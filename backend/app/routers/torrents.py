from fastapi import APIRouter, HTTPException, Query, Body, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.torrents import (
    TorrentSearchResponse,
    TorrentDownloadRequest,
    TorrentDownloadResponse,
    ActiveTorrent
)
from app.services.prowlarr import prowlarr_service
from app.services.qbittorrent import qbittorrent_service

from app.schemas.media import MediaItem
from app.services.jellyfin import jellyfin_service
from app.routers.media import extract_token_and_user

router = APIRouter(prefix="/api/torrents", tags=["Torrents"])

class TorrentControlRequest(BaseModel):
    hash: str

@router.get("/search", response_model=TorrentSearchResponse)
async def search_torrents(q: str = Query(..., min_length=2)):
    """Search torrents via Prowlarr, cleaned, filtered and sorted by seeds & resolution"""
    results = await prowlarr_service.search(q)
    return TorrentSearchResponse(
        query=q,
        total=len(results),
        results=results
    )

@router.post("/download", response_model=TorrentDownloadResponse)
async def download_torrent(request: TorrentDownloadRequest):
    """
    Sends torrent to qBittorrent with:
    - sequentialDownload = true
    - firstLastPiecePrio = true
    - savepath = /media/movies or /media/tv
    - Disk space pre-check to prevent system crashes
    """
    import shutil
    import os

    target_url = request.magnet_url or request.download_url
    if not target_url:
        raise HTTPException(status_code=400, detail="Se requiere un enlace magnet o download_url válido")

    # Check available storage on disk before queueing download
    target_path = "/media/movies" if request.category.lower() != "tv" else "/media/tv"
    if not os.path.exists(target_path):
        target_path = "."
    try:
        _, _, free_bytes = shutil.disk_usage(target_path)
        free_gb = round(free_bytes / (1024 ** 3), 1)
        if free_bytes < 2 * 1024 ** 3:  # Less than 2 GB remaining
            raise HTTPException(
                status_code=400,
                detail=f"Espacio insuficiente en disco. Solo quedan {free_gb} GB libres en el servidor. Elimina alguna película existente antes de descargar más contenido."
            )
    except HTTPException:
        raise
    except Exception:
        pass

    try:
        res = await qbittorrent_service.add_torrent(
            torrent_url=target_url,
            category=request.category
        )
        return TorrentDownloadResponse(
            success=True,
            message=res.get("message", "Torrent añadido exitosamente con descarga secuencial")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar a qBittorrent: {str(e)}")

@router.get("/active", response_model=List[ActiveTorrent])
async def get_active_downloads():
    """Returns active downloads in qBittorrent with real-time speed, progress and ETA"""
    return await qbittorrent_service.get_active_torrents()

@router.post("/pause")
async def pause_torrent(req: TorrentControlRequest):
    success = await qbittorrent_service.pause_torrent(req.hash)
    return {"success": success}

@router.post("/resume")
async def resume_torrent(req: TorrentControlRequest):
    success = await qbittorrent_service.resume_torrent(req.hash)
    return {"success": success}

@router.delete("/{torrent_hash}")
async def delete_torrent(torrent_hash: str, delete_files: bool = Query(False)):
    success = await qbittorrent_service.delete_torrent(torrent_hash, delete_files=delete_files)
    return {"success": success}

@router.post("/{torrent_hash}/play", response_model=Optional[MediaItem])
async def play_torrent(
    torrent_hash: str,
    auth: tuple = Depends(extract_token_and_user)
):
    """
    Finds or triggers indexing for a downloaded torrent and returns the Jellyfin MediaItem for immediate playback.
    """
    token, user_id = auth
    if not token or not user_id:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")

    torrents = await qbittorrent_service.get_active_torrents()
    matching = next((t for t in torrents if t.hash.lower() == torrent_hash.lower()), None)
    torrent_name = matching.name if matching else ""

    item = await jellyfin_service.find_media_for_torrent(torrent_name, torrent_hash, user_id, token)
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Jellyfin está procesando el archivo de video. Por favor reintenta en unos segundos."
        )
    return item

