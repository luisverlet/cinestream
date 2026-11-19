import os
import json
import uuid
import time
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Set
from fastapi import APIRouter, HTTPException, Depends, Query
import httpx

from app.schemas.watchlist import (
    WatchlistItem,
    WatchlistCreate,
    WatchlistUpdate,
    UserRating,
    RateItemRequest,
)
from app.routers.media import extract_token_and_user
from app.services.jellyfin import jellyfin_service
from app.config import settings

logger = logging.getLogger("verlet-watchlist")
router = APIRouter(prefix="/api/watchlist", tags=["Mi Lista"])

# Storage file location (prefer persistent /media/movies volume)
STORAGE_PATHS = [
    Path("/media/movies/.watchlist.json"),
    Path("/media/movies/.cineluisverlet_watchlist.json"),
    Path("./media/movies/.watchlist.json"),
    Path("./media/movies/.cineluisverlet_watchlist.json"),
    Path("./watchlist.json"),
    Path("/tmp/watchlist.json")
]

def get_storage_path() -> Path:
    # 1. Reuse existing storage file if already present on disk
    for p in STORAGE_PATHS:
        try:
            if p.is_file():
                return p
        except Exception:
            continue
    # 2. Otherwise use the first available directory
    for p in STORAGE_PATHS:
        try:
            if p.parent.exists():
                return p
        except Exception:
            continue
    return Path("/tmp/watchlist.json")

_file_lock = asyncio.Lock()
_library_cache: Set[str] = set()
_library_cache_time: float = 0.0

def _normalize(text: Optional[str]) -> str:
    if not text:
        return ""
    import unicodedata
    n = unicodedata.normalize('NFKD', text.lower()).encode('ASCII', 'ignore').decode('utf-8')
    import re
    return re.sub(r'[^a-z0-9]', '', n)

async def _get_library_normalized_titles(token: str) -> Set[str]:
    global _library_cache, _library_cache_time
    now = time.time()
    if _library_cache and (now - _library_cache_time) < 30.0:
        return _library_cache

    titles: Set[str] = set()
    try:
        api_key = settings.JELLYFIN_API_KEY or token
        url = f"{settings.JELLYFIN_URL}/Items"
        params = {
            "Recursive": "true",
            "IncludeItemTypes": "Movie,Series",
            "Fields": "Name,OriginalTitle",
            "ApiKey": api_key
        }
        headers = jellyfin_service._get_auth_header(token)
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("Items", []):
                    name = item.get("Name")
                    orig = item.get("OriginalTitle")
                    if name:
                        titles.add(_normalize(name))
                    if orig:
                        titles.add(_normalize(orig))
        _library_cache = titles
        _library_cache_time = now
    except Exception as e:
        logger.warning(f"Error fetching Jellyfin titles for in_library check: {e}")

    return _library_cache

async def _load_items_from_disk() -> List[dict]:
    storage_path = get_storage_path()
    if not storage_path.exists():
        return []
    try:
        text = storage_path.read_text(encoding="utf-8")
        if not text.strip():
            return []
        data = json.loads(text)
        return data.get("items", [])
    except Exception as e:
        logger.error(f"Error reading watchlist from {storage_path}: {e}")
        return []

async def _save_items_to_disk(items: List[dict]):
    storage_path = get_storage_path()
    try:
        storage_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}
        temp_file = storage_path.with_suffix(".tmp")
        temp_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        temp_file.replace(storage_path)
    except Exception as e:
        logger.error(f"Error saving watchlist to {storage_path}: {e}")
        raise HTTPException(status_code=500, detail="Error al guardar datos de la lista")

@router.get("", response_model=List[WatchlistItem])
async def get_watchlist(
    status: Optional[str] = Query(None, description="plan_to_watch o completed"),
    type: Optional[str] = Query(None, description="Movie o Series"),
    auth: tuple = Depends(extract_token_and_user)
):
    token, _ = auth
    async with _file_lock:
        raw_items = await _load_items_from_disk()

    lib_titles = await _get_library_normalized_titles(token)

    results: List[WatchlistItem] = []
    for item in raw_items:
        if status and item.get("status") != status:
            continue
        if type and item.get("type", "Movie").lower() != type.lower():
            continue

        # Check if in Jellyfin library
        title_norm = _normalize(item.get("title"))
        orig_norm = _normalize(item.get("original_title"))
        in_lib = (
            title_norm in lib_titles or
            (orig_norm and orig_norm in lib_titles) or
            any(title_norm in lt or lt in title_norm for lt in lib_titles if len(title_norm) > 4)
        )

        item_copy = dict(item)
        item_copy["in_library"] = in_lib
        if "ratings" not in item_copy or item_copy["ratings"] is None:
            item_copy["ratings"] = []
        results.append(WatchlistItem(**item_copy))

    # Sort: newest first
    results.sort(key=lambda x: x.updated_at or x.created_at, reverse=True)
    return results

@router.post("", response_model=WatchlistItem)
async def add_or_update_watchlist(
    payload: WatchlistCreate,
    auth: tuple = Depends(extract_token_and_user)
):
    token, _ = auth
    now_iso = datetime.now(timezone.utc).isoformat()
    norm_title = _normalize(payload.title)

    async with _file_lock:
        items = await _load_items_from_disk()

        # Check if item with same title exists
        existing_idx = -1
        for idx, it in enumerate(items):
            if _normalize(it.get("title")) == norm_title:
                existing_idx = idx
                break

        if existing_idx != -1:
            existing = items[existing_idx]
            existing["status"] = payload.status
            if payload.original_title:
                existing["original_title"] = payload.original_title.strip()
            existing["type"] = payload.type
            if payload.year is not None:
                existing["year"] = payload.year
            if payload.imdb_rating is not None:
                existing["imdb_rating"] = payload.imdb_rating
            if payload.notes is not None:
                existing["notes"] = payload.notes

            # Multi-user ratings management
            ratings = existing.get("ratings") or []
            if payload.ratings is not None:
                existing["ratings"] = [r.dict() if hasattr(r, "dict") else r for r in payload.ratings]
            elif payload.user_nick and (payload.user_rating is not None or payload.notes):
                # Update or add rating for this user
                found_r = False
                nick_norm = payload.user_nick.strip().lower()
                for r in ratings:
                    if r.get("user_nick", "").strip().lower() == nick_norm:
                        if payload.user_rating is not None:
                            r["rating"] = payload.user_rating
                        r["updated_at"] = now_iso
                        found_r = True
                        break
                if not found_r:
                    ratings.append({
                        "user_nick": payload.user_nick.strip(),
                        "rating": payload.user_rating,
                        "updated_at": now_iso
                    })
                existing["ratings"] = ratings
                existing["user_nick"] = payload.user_nick.strip()
                existing["user_rating"] = payload.user_rating

            existing["updated_at"] = now_iso
            saved_item = existing
        else:
            item_id = uuid.uuid4().hex[:12]
            ratings_list = []
            if payload.ratings:
                ratings_list = [r.dict() if hasattr(r, "dict") else r for r in payload.ratings]
            elif payload.user_nick and payload.user_rating is not None:
                ratings_list.append({
                    "user_nick": payload.user_nick.strip(),
                    "rating": payload.user_rating,
                    "updated_at": now_iso
                })

            saved_item = {
                "id": item_id,
                "title": payload.title.strip(),
                "original_title": payload.original_title.strip() if payload.original_title else None,
                "type": payload.type,
                "year": payload.year,
                "imdb_id": payload.imdb_id,
                "imdb_rating": payload.imdb_rating,
                "status": payload.status,
                "ratings": ratings_list,
                "user_nick": payload.user_nick.strip() if payload.user_nick else None,
                "user_rating": payload.user_rating,
                "notes": payload.notes,
                "created_at": now_iso,
                "updated_at": now_iso
            }
            items.append(saved_item)

        await _save_items_to_disk(items)

    lib_titles = await _get_library_normalized_titles(token)
    in_lib = _normalize(saved_item.get("title")) in lib_titles
    item_res = dict(saved_item)
    item_res["in_library"] = in_lib
    return WatchlistItem(**item_res)

@router.put("/{item_id}", response_model=WatchlistItem)
async def update_watchlist_item(
    item_id: str,
    payload: WatchlistUpdate,
    auth: tuple = Depends(extract_token_and_user)
):
    token, _ = auth
    now_iso = datetime.now(timezone.utc).isoformat()

    async with _file_lock:
        items = await _load_items_from_disk()
        target = None
        for it in items:
            if it.get("id") == item_id:
                target = it
                break

        if not target:
            raise HTTPException(status_code=404, detail="Elemento no encontrado en la lista")

        if payload.title is not None:
            target["title"] = payload.title.strip()
        if payload.original_title is not None:
            target["original_title"] = payload.original_title.strip() if payload.original_title else None
        if payload.type is not None:
            target["type"] = payload.type
        if payload.year is not None:
            target["year"] = payload.year
        if payload.imdb_rating is not None:
            target["imdb_rating"] = payload.imdb_rating
        if payload.status is not None:
            target["status"] = payload.status
        if payload.notes is not None:
            target["notes"] = payload.notes

        if payload.ratings is not None:
            target["ratings"] = [r.dict() if hasattr(r, "dict") else r for r in payload.ratings]
        elif payload.user_nick and (payload.user_rating is not None or payload.notes):
            ratings = target.get("ratings") or []
            found_r = False
            nick_norm = payload.user_nick.strip().lower()
            for r in ratings:
                if r.get("user_nick", "").strip().lower() == nick_norm:
                    if payload.user_rating is not None:
                        r["rating"] = payload.user_rating
                    r["updated_at"] = now_iso
                    found_r = True
                    break
            if not found_r:
                ratings.append({
                    "user_nick": payload.user_nick.strip(),
                    "rating": payload.user_rating,
                    "updated_at": now_iso
                })
            target["ratings"] = ratings
            target["user_nick"] = payload.user_nick.strip()
            target["user_rating"] = payload.user_rating

        target["updated_at"] = now_iso
        await _save_items_to_disk(items)

    lib_titles = await _get_library_normalized_titles(token)
    in_lib = _normalize(target.get("title")) in lib_titles
    res = dict(target)
    res["in_library"] = in_lib
    return WatchlistItem(**res)

@router.post("/{item_id}/rate", response_model=WatchlistItem)
async def rate_watchlist_item(
    item_id: str,
    payload: RateItemRequest,
    auth: tuple = Depends(extract_token_and_user)
):
    token, _ = auth
    now_iso = datetime.now(timezone.utc).isoformat()
    clean_nick = payload.user_nick.strip()
    if not clean_nick:
        raise HTTPException(status_code=400, detail="El nombre o nick es obligatorio")

    async with _file_lock:
        items = await _load_items_from_disk()
        target = None
        for it in items:
            if it.get("id") == item_id:
                target = it
                break

        if not target:
            raise HTTPException(status_code=404, detail="Elemento no encontrado en la lista")

        ratings = target.get("ratings") or []
        found_idx = -1
        for idx, r in enumerate(ratings):
            if r.get("user_nick", "").strip().lower() == clean_nick.lower():
                found_idx = idx
                break

        rating_entry = {
            "user_nick": clean_nick,
            "rating": payload.rating,
            "reaction": payload.reaction,
            "comment": payload.comment,
            "updated_at": now_iso
        }

        if found_idx != -1:
            ratings[found_idx] = rating_entry
        else:
            ratings.append(rating_entry)

        target["ratings"] = ratings
        target["status"] = "completed"  # Having ratings marks it as watched/completed
        target["user_nick"] = clean_nick
        if payload.rating is not None:
            target["user_rating"] = payload.rating
        target["updated_at"] = now_iso

        await _save_items_to_disk(items)

    lib_titles = await _get_library_normalized_titles(token)
    in_lib = _normalize(target.get("title")) in lib_titles
    res = dict(target)
    res["in_library"] = in_lib
    return WatchlistItem(**res)

@router.delete("/{item_id}/rate/{user_nick}", response_model=WatchlistItem)
async def delete_user_rating(
    item_id: str,
    user_nick: str,
    auth: tuple = Depends(extract_token_and_user)
):
    token, _ = auth
    now_iso = datetime.now(timezone.utc).isoformat()
    clean_nick = user_nick.strip().lower()

    async with _file_lock:
        items = await _load_items_from_disk()
        target = None
        for it in items:
            if it.get("id") == item_id:
                target = it
                break

        if not target:
            raise HTTPException(status_code=404, detail="Elemento no encontrado")

        ratings = target.get("ratings") or []
        ratings = [r for r in ratings if r.get("user_nick", "").strip().lower() != clean_nick]
        target["ratings"] = ratings
        if ratings:
            target["user_nick"] = ratings[-1].get("user_nick")
            target["user_rating"] = ratings[-1].get("rating")
        else:
            target["user_nick"] = None
            target["user_rating"] = None
            # If no ratings remain, can optionally stay completed or move to plan_to_watch

        target["updated_at"] = now_iso
        await _save_items_to_disk(items)

    lib_titles = await _get_library_normalized_titles(token)
    in_lib = _normalize(target.get("title")) in lib_titles
    res = dict(target)
    res["in_library"] = in_lib
    return WatchlistItem(**res)

@router.delete("/{item_id}")
async def delete_watchlist_item(
    item_id: str,
    auth: tuple = Depends(extract_token_and_user)
):
    async with _file_lock:
        items = await _load_items_from_disk()
        initial_len = len(items)
        items = [it for it in items if it.get("id") != item_id]
        if len(items) == initial_len:
            raise HTTPException(status_code=404, detail="Elemento no encontrado")
        await _save_items_to_disk(items)

    return {"success": True, "message": "Elemento eliminado de la lista"}
