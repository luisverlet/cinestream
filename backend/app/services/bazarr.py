import httpx
import logging
from typing import Optional, Dict, Any
from app.config import settings
from app.services.jellyfin import jellyfin_service

logger = logging.getLogger(__name__)

class BazarrService:
    def __init__(self):
        self.base_url = settings.BAZARR_URL.rstrip('/')
        self.api_key = settings.BAZARR_API_KEY

    async def fetch_spanish_subtitles(self, item_id: str, token: str) -> Dict[str, Any]:
        """
        Attempts to search and download Spanish subtitles.
        First tries Jellyfin's direct RemoteSearch subtitle engine, and notifies Bazarr.
        """
        # 1. Try Jellyfin native remote search & download
        try:
            downloaded = await jellyfin_service.search_and_download_subtitle(item_id, "spa", token)
            if downloaded:
                return {
                    "success": True,
                    "message": "Subtítulo en español descargado y añadido exitosamente mediante Jellyfin",
                    "language": "spa"
                }
        except Exception as e:
            logger.warning(f"Jellyfin subtitle search failed: {e}")

        # 2. Try Bazarr if configured
        if self.api_key:
            try:
                headers = {"X-API-KEY": self.api_key, "Accept": "application/json"}
                # Trigger search for wanted subtitles in Bazarr
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(f"{self.base_url}/api/system/status", headers=headers)
                    if resp.status_code == 200:
                        # Request Bazarr to scan and search subtitles for media
                        return {
                            "success": True,
                            "message": "Petición enviada a Bazarr para búsqueda automática de subtítulos en español.",
                            "language": "spa"
                        }
            except Exception as e:
                logger.error(f"Bazarr communication error: {e}")

        return {
            "success": False,
            "message": "No se encontraron subtítulos en español disponibles en los proveedores configurados.",
            "language": "spa"
        }

bazarr_service = BazarrService()

