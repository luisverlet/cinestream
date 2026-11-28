import os
import re
import io
import time
import base64
import zipfile
import logging
import asyncio
import urllib.parse
from typing import Optional, Dict, Any, List
import httpx

from app.config import settings
from app.services.jellyfin import jellyfin_service

logger = logging.getLogger(__name__)

OPENSUBTITLES_API_KEY = getattr(settings, "OPENSUBTITLES_API_KEY", "")
OPENSUBTITLES_USER = getattr(settings, "OPENSUBTITLES_USER", "")
OPENSUBTITLES_PASS = getattr(settings, "OPENSUBTITLES_PASS", "")

MIRRORS = [
    "https://yts-subs.com",
    "https://yifysubtitles.org",
    "https://yifysubtitles.ch"
]

class SubtitleService:
    """
    Multi-provider subtitle search and download service.
    Directly retrieves Spanish subtitles for downloaded movies and series,
    saves them locally as '.es.srt' next to the video file, and refreshes Jellyfin.
    """

    def __init__(self):
        self._os_token: Optional[str] = None
        self._os_token_time: float = 0.0

    def _decode_srt_text(self, raw_bytes: bytes) -> str:
        """Decode raw subtitle bytes attempting standard encodings and return UTF-8 string"""
        for enc in ["utf-8-sig", "utf-8", "windows-1252", "iso-8859-1", "latin-1"]:
            try:
                return raw_bytes.decode(enc)
            except UnicodeDecodeError:
                continue
        return raw_bytes.decode("utf-8", errors="ignore")

    async def _get_opensubtitles_token(self, client: httpx.AsyncClient) -> Optional[str]:
        """Obtains or reuses an active OpenSubtitles.com session token"""
        now = time.time()
        if self._os_token and (now - self._os_token_time < 3600 * 12):
            return self._os_token

        headers = {
            "User-Agent": "Bazarr v1.4.3",
            "Api-Key": OPENSUBTITLES_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        login_url = "https://api.opensubtitles.com/api/v1/login"
        payload = {
            "username": OPENSUBTITLES_USER,
            "password": OPENSUBTITLES_PASS
        }

        try:
            resp = await client.post(login_url, json=payload, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                token = data.get("token")
                if token:
                    self._os_token = token
                    self._os_token_time = now
                    logger.info("Successfully authenticated with OpenSubtitles.com API")
                    return token
            logger.warning(f"OpenSubtitles login returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"Failed to authenticate with OpenSubtitles.com: {e}")
        return None

    async def _fetch_from_opensubtitles(
        self,
        client: httpx.AsyncClient,
        imdb_id: Optional[str],
        title: str,
        year: Optional[int],
        release_filename: Optional[str] = None
    ) -> Optional[bytes]:
        """
        Search OpenSubtitles.com for Spanish subtitles and download the best matching .srt.
        Primary high-reliability source for movies and series.
        """
        token = await self._get_opensubtitles_token(client)
        headers = {
            "User-Agent": "Bazarr v1.4.3",
            "Api-Key": OPENSUBTITLES_API_KEY,
            "Accept": "application/json"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        search_urls = []

        # 1. Search by IMDb ID
        if imdb_id:
            digits = re.sub(r'^[^\d]*', '', imdb_id)
            if digits:
                search_urls.append(f"https://api.opensubtitles.com/api/v1/subtitles?imdb_id={digits}&languages=es,spa")

        # 2. Search by title and year (stripping any web domains like www.torrenting.com, trackers or release tags)
        clean_title = re.sub(r'^(?:https?://)?(?:www\.)?[a-zA-Z0-9\-_]+\.[a-zA-Z]{2,}(?:\s*[-_–—]\s*)?', '', title, flags=re.IGNORECASE)
        clean_title = re.sub(r'\[[^\]]*\]|\([^\)]*\)', ' ', clean_title)
        clean_title = re.sub(r'[\._\-]', ' ', clean_title)
        clean_title = re.sub(
            r'\b(2160p|1080p|720p|480p|webrip|web-dl|bluray|brrip|bdrip|x264|x265|hevc|rarbg|yts|yify|aac2|aac|ddp|kitsune|remux|repack)\b.*$',
            '',
            clean_title,
            flags=re.IGNORECASE
        ).strip()

        q_str = urllib.parse.quote(clean_title)
        if year:
            search_urls.append(f"https://api.opensubtitles.com/api/v1/subtitles?query={q_str}&year={year}&languages=es,spa")
        search_urls.append(f"https://api.opensubtitles.com/api/v1/subtitles?query={q_str}&languages=es,spa")

        sub_items = []
        for url in search_urls:
            try:
                resp = await client.get(url, headers=headers, timeout=10.0, follow_redirects=True)
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("data", [])
                    if items:
                        sub_items = items
                        logger.info(f"OpenSubtitles.com found {len(items)} Spanish subtitle candidates")
                        break
            except Exception as e:
                logger.warning(f"Error querying OpenSubtitles at {url}: {e}")

        if not sub_items:
            return None

        # Sort candidate subtitles: match release tags or filename if available
        def score_sub(item: Dict[str, Any]) -> int:
            score = 0
            attr = item.get("attributes", {})
            rel = (attr.get("release") or "").lower()
            if release_filename:
                fn_lower = release_filename.lower()
                for token_word in ["rarbg", "yts", "yify", "bluray", "1080p", "720p", "webrip", "brrip"]:
                    if token_word in fn_lower and token_word in rel:
                        score += 5
            # Higher download count indicates community verification
            dl_count = attr.get("download_count", 0) or 0
            score += min(dl_count // 100, 10)
            return score

        sub_items.sort(key=score_sub, reverse=True)

        # Download candidate subtitle
        for item in sub_items[:3]:
            attr = item.get("attributes", {})
            files = attr.get("files", [])
            if not files:
                continue
            file_id = files[0].get("file_id")
            if not file_id:
                continue

            dl_url = "https://api.opensubtitles.com/api/v1/download"
            try:
                dl_headers = dict(headers)
                dl_headers["Content-Type"] = "application/json"
                dl_resp = await client.post(dl_url, json={"file_id": file_id}, headers=dl_headers, timeout=12.0)
                if dl_resp.status_code == 200:
                    link = dl_resp.json().get("link")
                    if link:
                        file_resp = await client.get(link, headers={"User-Agent": "Bazarr v1.4.3"}, timeout=15.0, follow_redirects=True)
                        if file_resp.status_code == 200 and len(file_resp.content) > 500:
                            srt_text = self._decode_srt_text(file_resp.content)
                            logger.info(f"Downloaded Spanish subtitle from OpenSubtitles.com ({len(srt_text)} chars)")
                            return srt_text.encode("utf-8")
            except Exception as ex:
                logger.warning(f"Error downloading subtitle file_id {file_id}: {ex}")

        return None

    async def _fetch_from_yts_mirror(
        self,
        client: httpx.AsyncClient,
        base_url: str,
        imdb_id: str
    ) -> Optional[bytes]:
        """Try fetching Spanish subtitle zip from a specific YTS subtitles mirror"""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
        url = f"{base_url}/movie-imdb/{imdb_id}"
        try:
            resp = await client.get(url, headers=headers, timeout=8.0, follow_redirects=True)
            if resp.status_code != 200:
                return None

            html = resp.text
            rows = re.findall(r'<tr[^>]*>.*?</tr>', html, re.DOTALL)
            sub_links = []
            for r in rows:
                r_lower = r.lower()
                if "spanish" in r_lower or "español" in r_lower:
                    m = re.search(r'href=["\'](/subtitles/[^"\']+)["\']', r)
                    if m:
                        sub_links.append(m.group(1))

            if not sub_links:
                return None

            for sub_link in sub_links[:3]:
                det_url = f"{base_url}{sub_link}"
                det_resp = await client.get(det_url, headers=headers, timeout=8.0, follow_redirects=True)
                if det_resp.status_code != 200:
                    continue

                det_html = det_resp.text
                m_dl = re.search(r'data-link=["\']([^"\']+)["\']', det_html)
                if m_dl:
                    try:
                        zip_url = base64.b64decode(m_dl.group(1)).decode("utf-8").strip()
                        if not zip_url.startswith("http"):
                            zip_url = f"{base_url}{zip_url}"
                        zip_resp = await client.get(zip_url, headers=headers, timeout=12.0, follow_redirects=True)
                        if zip_resp.status_code == 200 and len(zip_resp.content) > 500:
                            return zip_resp.content
                    except Exception as ex:
                        logger.warning(f"Error downloading data-link zip from {base_url}: {ex}")

                m_zip = re.search(r'href=["\']([^"\']+\.zip)["\']', det_html)
                if m_zip:
                    zip_url = m_zip.group(1)
                    if not zip_url.startswith("http"):
                        zip_url = f"{base_url}{zip_url}"
                    try:
                        zip_resp = await client.get(zip_url, headers=headers, timeout=12.0, follow_redirects=True)
                        if zip_resp.status_code == 200 and len(zip_resp.content) > 500:
                            return zip_resp.content
                    except Exception as ex:
                        logger.warning(f"Error downloading direct zip link: {ex}")

        except Exception as e:
            logger.warning(f"Failed query to {base_url}/movie-imdb/{imdb_id}: {e}")
        return None

    async def _search_imdb_on_mirror(
        self,
        client: httpx.AsyncClient,
        base_url: str,
        title: str,
        year: Optional[int] = None
    ) -> Optional[str]:
        """Search mirror for movie title to resolve its IMDb ID"""
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        search_query = title
        if year:
            search_query = f"{title} {year}"
        url = f"{base_url}/search?q={urllib.parse.quote(search_query)}"
        try:
            resp = await client.get(url, headers=headers, timeout=8.0, follow_redirects=True)
            if resp.status_code == 200:
                matches = re.findall(r'/movie-imdb/(tt\d+)', resp.text)
                if matches:
                    return matches[0]
        except Exception as e:
            logger.warning(f"Error searching {base_url} for '{title}': {e}")
        return None

    async def search_and_download_spanish(self, item_id: str, token: Optional[str] = None) -> Dict[str, Any]:
        """
        Main entry point for downloading Spanish subtitles for a Jellyfin item.
        Handles checking existing subs, querying OpenSubtitles.com, YTS mirrors,
        saving '.es.srt' next to the video file, and triggering Jellyfin library refresh.
        """
        # 1. Retrieve Jellyfin metadata
        item_data = await jellyfin_service.get_item_raw(item_id)
        if not item_data:
            return {
                "success": False,
                "message": "Elemento no encontrado en Jellyfin.",
                "language": "spa"
            }

        title = item_data.get("Name", "Película")
        year = item_data.get("ProductionYear")
        provider_ids = item_data.get("ProviderIds", {})
        imdb_id = provider_ids.get("Imdb")

        file_path = item_data.get("Path")
        if not file_path and item_data.get("MediaSources"):
            file_path = item_data["MediaSources"][0].get("Path")

        logger.info(f"Searching Spanish subtitles for '{title}' (IMDb: {imdb_id}, Path: {file_path})")

        # 2. Check if subtitle already exists on disk
        target_srt_path = None
        if file_path:
            base, _ = os.path.splitext(file_path)
            target_srt_path = f"{base}.es.srt"
            if os.path.exists(target_srt_path) and os.path.getsize(target_srt_path) > 1000:
                await jellyfin_service.refresh_library()
                return {
                    "success": True,
                    "message": f"Los subtítulos en español ya están instalados y sincronizados para '{title}'.",
                    "language": "spa"
                }

        srt_content_bytes = None
        release_filename = os.path.basename(file_path) if file_path else None

        async with httpx.AsyncClient(timeout=18.0, follow_redirects=True) as client:
            # 3. Source 1: OpenSubtitles.com API (Most comprehensive & reliable)
            try:
                os_bytes = await self._fetch_from_opensubtitles(client, imdb_id, title, year, release_filename)
                if os_bytes:
                    srt_content_bytes = os_bytes
                    logger.info(f"Obtained Spanish subtitle from OpenSubtitles.com for '{title}'")
            except Exception as e_os:
                logger.warning(f"OpenSubtitles fetch failed: {e_os}")

            # 4. Source 2: YTS Subtitles Mirrors fallback
            if not srt_content_bytes:
                # If IMDb ID missing, try resolving on mirror
                if not imdb_id:
                    for mirror in MIRRORS:
                        resolved_id = await self._search_imdb_on_mirror(client, mirror, title, year)
                        if resolved_id:
                            imdb_id = resolved_id
                            break

                if imdb_id:
                    for mirror in MIRRORS:
                        zip_bytes = await self._fetch_from_yts_mirror(client, mirror, imdb_id)
                        if zip_bytes:
                            try:
                                with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
                                    for name in z.namelist():
                                        if name.lower().endswith(".srt"):
                                            raw = z.read(name)
                                            srt_text = self._decode_srt_text(raw)
                                            srt_content_bytes = srt_text.encode("utf-8")
                                            logger.info(f"Extracted Spanish subtitle from {mirror}: {name}")
                                            break
                            except Exception as ez:
                                logger.warning(f"Error extracting zip from {mirror}: {ez}")

                        if srt_content_bytes:
                            break

        # 5. If found, write to disk next to movie file
        if srt_content_bytes and target_srt_path:
            try:
                os.makedirs(os.path.dirname(target_srt_path), exist_ok=True)
                with open(target_srt_path, "wb") as f:
                    f.write(srt_content_bytes)
                logger.info(f"Successfully saved Spanish subtitle to {target_srt_path} ({len(srt_content_bytes)} bytes)")

                # Refresh Jellyfin library so the new external subtitle is indexed
                await jellyfin_service.refresh_library()
                await asyncio.sleep(1.5)

                return {
                    "success": True,
                    "message": f"Subtítulos en español descargados con éxito para '{title}'.",
                    "language": "spa"
                }
            except Exception as ew:
                logger.error(f"Error saving subtitle to disk {target_srt_path}: {ew}")

        # 6. Source 3: Jellyfin Native RemoteSearch fallback
        try:
            downloaded = await jellyfin_service.search_and_download_subtitle(
                item_id, "spa", token or jellyfin_service.api_key
            )
            if downloaded:
                await asyncio.sleep(1.5)
                return {
                    "success": True,
                    "message": f"Subtítulos en español añadidos mediante Jellyfin para '{title}'.",
                    "language": "spa"
                }
        except Exception as ej:
            logger.warning(f"Jellyfin RemoteSearch fallback failed: {ej}")

        return {
            "success": False,
            "message": f"No se encontraron subtítulos en español disponibles para '{title}'.",
            "language": "spa"
        }

    async def auto_download_for_torrent(self, torrent_name: str, torrent_hash: str):
        """
        Background job triggered when a torrent download finishes.
        Locates the main video file on disk and proactively downloads Spanish subtitles.
        """
        from app.services.qbittorrent import qbittorrent_service
        try:
            files = await qbittorrent_service.get_torrent_files(torrent_hash)
            video_exts = ('.mp4', '.mkv', '.avi', '.mov', '.m4v', '.webm', '.ts')
            video_files = [f for f in files if f.get("name", "").lower().endswith(video_exts)]
            video_files.sort(key=lambda x: x.get("size", 0), reverse=True)

            if not video_files:
                return

            vf_relative = video_files[0].get("name", "")
            # Check save paths (/media/movies or /media/tv)
            candidate_paths = [
                os.path.join(settings.QBITTORRENT_MOVIES_PATH, vf_relative),
                os.path.join(settings.QBITTORRENT_TV_PATH, vf_relative),
            ]
            real_video_path = next((p for p in candidate_paths if os.path.exists(p)), None)

            if not real_video_path:
                return

            base, _ = os.path.splitext(real_video_path)
            target_srt_path = f"{base}.es.srt"
            if os.path.exists(target_srt_path) and os.path.getsize(target_srt_path) > 1000:
                logger.info(f"Subtitles already exist on disk for torrent {torrent_name}")
                return

            # Extract year & clean title from torrent_name / filename
            filename_only = os.path.basename(real_video_path)
            sample_text = f"{torrent_name} {filename_only}"
            year_match = re.search(r'\b(19\d{2}|20\d{2})\b', sample_text)
            year = int(year_match.group(1)) if year_match else None

            clean_title = re.sub(r'[\._\-]', ' ', torrent_name)
            clean_title = re.sub(
                r'\b(2160p|1080p|720p|480p|webrip|web-dl|bluray|brrip|bdrip|x264|x265|hevc|rarbg|yts|yify)\b.*$',
                '',
                clean_title,
                flags=re.IGNORECASE
            ).strip()

            logger.info(f"Auto-downloading Spanish subtitles for finished torrent: {clean_title} ({year})")
            async with httpx.AsyncClient(timeout=18.0, follow_redirects=True) as client:
                srt_bytes = await self._fetch_from_opensubtitles(
                    client, None, clean_title, year, filename_only
                )

            if srt_bytes:
                with open(target_srt_path, "wb") as f:
                    f.write(srt_bytes)
                logger.info(f"Successfully auto-saved Spanish subtitles to {target_srt_path}")
                await jellyfin_service.refresh_library()
        except Exception as e:
            logger.warning(f"Error in auto_download_for_torrent for {torrent_name}: {e}")

subtitle_service = SubtitleService()
