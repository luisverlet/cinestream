import httpx
import re
import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.schemas.torrents import TorrentSearchResult

logger = logging.getLogger(__name__)

class ProwlarrService:
    def __init__(self):
        self.base_url = settings.PROWLARR_URL.rstrip('/')
        self.api_key = settings.PROWLARR_API_KEY

    def _format_size(self, size_bytes: int) -> str:
        if size_bytes >= 1024 ** 3:
            return f"{size_bytes / (1024 ** 3):.2f} GB"
        elif size_bytes >= 1024 ** 2:
            return f"{size_bytes / (1024 ** 2):.1f} MB"
        return f"{size_bytes / 1024:.0f} KB"

    def _extract_resolution(self, title: str) -> str:
        title_lower = title.lower()
        if re.search(r'\b(2160p|4k|uhd)\b', title_lower):
            return "4K"
        if re.search(r'\b(1080p|fhd)\b', title_lower):
            return "1080p"
        if re.search(r'\b(720p|hd)\b', title_lower):
            return "720p"
        if re.search(r'\b(480p|sd|dvdrip|xvid)\b', title_lower):
            return "SD"
        return "Desconocida"

    def _is_suspicious(self, title: str, size_bytes: int) -> bool:
        title_lower = title.lower()
        # Filter dangerous or junk extensions/keywords
        junk_patterns = [
            r'\.exe$', r'\.rar$', r'\.zip$', r'\.iso$', r'setup\.exe',
            r'\bpassword\b', r'\bcam\b', r'\bcamrip\b', r'\bts\b', r'\btelesync\b',
            r'\bhdcams\b', r'\bclean\s+audio\b', r'\bsample\b'
        ]
        for pattern in junk_patterns:
            if re.search(pattern, title_lower):
                return True
        # Filter unrealistically tiny video files (< 150 MB)
        if size_bytes < 150 * 1024 * 1024:
            return True
        return False

    async def search(self, query: str) -> List[TorrentSearchResult]:
        if not self.api_key:
            logger.warning("Prowlarr API Key no configurada en .env")
            return []

        url = f"{self.base_url}/api/v1/search"
        # 2000 = Movies, 5000 = TV
        params = {
            "query": query,
            "categories": [2000, 5000],
            "type": "search"
        }
        headers = {
            "X-Api-Key": self.api_key,
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code != 200:
                    logger.error(f"Prowlarr search error {resp.status_code}: {resp.text}")
                    return []
                raw_results = resp.json()
        except Exception as e:
            logger.error(f"Prowlarr request failed: {e}")
            return []

        clean_results: List[TorrentSearchResult] = []

        for item in raw_results:
            seeders = item.get("seeders", 0) or 0
            # Filter dead torrents (0 seeds)
            if seeders <= 0:
                continue

            title = item.get("title", "")
            size = item.get("size", 0) or 0

            # Filter suspicious / garbage files
            if self._is_suspicious(title, size):
                continue

            # Determine category: check if title indicates a TV season / episode
            # e.g. S01E02, S01, Season 1, Episode 4
            is_tv_pattern = bool(re.search(r'\b(s\d{1,2}e\d{1,2}|s\d{1,2}\b|season\s*\d+|episodes?\s*\d+|e\d{2}\b)', title, re.IGNORECASE))
            category_id = item.get("categories", [{}])[0].get("id", 2000) if item.get("categories") else 2000
            category = "tv" if (is_tv_pattern and category_id >= 5000) else "movies"

            resolution = self._extract_resolution(title)
            magnet_url = item.get("magnetUrl")
            download_url = item.get("downloadUrl")
            info_hash = item.get("infoHash")

            clean_results.append(TorrentSearchResult(
                guid=str(item.get("guid") or info_hash or title),
                title=title,
                info_hash=info_hash,
                magnet_url=magnet_url,
                download_url=download_url,
                indexer=item.get("indexer", "Indexador"),
                size_bytes=size,
                size_formatted=self._format_size(size),
                seeders=seeders,
                leechers=item.get("leechers", 0) or 0,
                resolution=resolution,
                category=category,
                publish_date=item.get("publishDate")
            ))

        # Sort: priority to seeders descending, with slight boost for 1080p/720p quality
        def score(t: TorrentSearchResult):
            res_bonus = {"1080p": 20, "720p": 15, "4K": 10, "SD": 0, "Desconocida": 0}.get(t.resolution, 0)
            return t.seeders + res_bonus

        clean_results.sort(key=score, reverse=True)
        return clean_results[:30]

prowlarr_service = ProwlarrService()

