from fastapi import APIRouter, HTTPException, Depends, Header, Response, Query
from typing import Optional, List
import httpx
from app.schemas.media import MediaItem, MediaDetail, EpisodeItem
from app.services.jellyfin import jellyfin_service
from app.config import settings

router = APIRouter(prefix="/api/media", tags=["Medios"])

async def extract_token_and_user(
    authorization: Optional[str] = Header(None),
    x_emby_token: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    token = x_emby_token
    if not token and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        else:
            token = authorization
    if not token:
        token = jellyfin_service.api_key
    if not x_user_id:
        x_user_id = await jellyfin_service.get_default_user_id()
    return token, x_user_id

@router.get("/hero", response_model=Optional[MediaItem])
async def get_hero(auth: tuple = Depends(extract_token_and_user)):
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    hero = await jellyfin_service.get_hero_banner(user_id, token)
    return hero

@router.get("/continue-watching", response_model=List[MediaItem])
async def get_continue_watching(limit: int = 12, auth: tuple = Depends(extract_token_and_user)):
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    items = await jellyfin_service.get_continue_watching(user_id, token, limit=limit)
    return items

@router.get("/movies", response_model=List[MediaItem])
async def get_movies(limit: int = 24, offset: int = 0, auth: tuple = Depends(extract_token_and_user)):
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    items = await jellyfin_service.get_movies(user_id, token, limit=limit, offset=offset)
    return items

@router.get("/tv", response_model=List[MediaItem])
async def get_series(limit: int = 24, offset: int = 0, auth: tuple = Depends(extract_token_and_user)):
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    items = await jellyfin_service.get_series(user_id, token, limit=limit, offset=offset)
    return items

@router.get("/item/{item_id}", response_model=MediaDetail)
async def get_item_detail(item_id: str, auth: tuple = Depends(extract_token_and_user)):
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    detail = await jellyfin_service.get_item_detail(item_id, user_id, token)
    if not detail:
        raise HTTPException(status_code=404, detail="Elemento no encontrado")
    return detail

@router.get("/series/{series_id}/episodes", response_model=List[EpisodeItem])
async def get_episodes(series_id: str, auth: tuple = Depends(extract_token_and_user)):
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    episodes = await jellyfin_service.get_episodes(series_id, user_id, token)
    return episodes

@router.get("/search", response_model=List[MediaItem])
async def search_media(q: str = Query(..., min_length=1), auth: tuple = Depends(extract_token_and_user)):
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    results = await jellyfin_service.search(q, user_id, token)
    return results

@router.get("/image/{item_id}/{image_type}")
async def proxy_image(
    item_id: str,
    image_type: str = "Primary",
    fillWidth: int = 500,
    tag: Optional[str] = None
):
    """Proxies images from Jellyfin with caching headers to avoid CORS/mixed-content"""
    url = f"{jellyfin_service.base_url}/Items/{item_id}/Images/{image_type}"
    params = {"fillWidth": fillWidth}
    if tag:
        params["tag"] = tag

    async with httpx.AsyncClient(timeout=10.0) as client:
        headers = {}
        if jellyfin_service.api_key:
            headers["X-MediaBrowser-Token"] = jellyfin_service.api_key
        try:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                content_type = resp.headers.get("content-type", "image/jpeg")
                return Response(
                    content=resp.content,
                    media_type=content_type,
                    headers={"Cache-Control": "public, max-age=604800, immutable"}
                )
        except Exception:
            pass

    # Fallback to an empty 1x1 transparent PNG if not found
    transparent_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02"
        b"\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    return Response(content=transparent_png, media_type="image/png")

@router.delete("/{item_id}")
async def delete_media_item(item_id: str, auth: tuple = Depends(extract_token_and_user)):
    """
    Deletes a media item from the Jellyfin library and wipes the physical file on disk.
    Also removes the corresponding torrent in qBittorrent to reclaim disk space.
    """
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    res = await jellyfin_service.delete_item(item_id, user_id, token)
    return res


