import httpx
import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.schemas.torrents import ActiveTorrent

logger = logging.getLogger(__name__)

class QBittorrentService:
    def __init__(self):
        self.base_url = settings.QBITTORRENT_URL.rstrip('/')
        self.username = settings.QBITTORRENT_USER
        self.password = settings.QBITTORRENT_PASS
        self.cookies: Dict[str, str] = {}
        self._completed_hashes: set = set()
        self._initial_load_done: bool = False

    async def _ensure_logged_in(self, client: httpx.AsyncClient) -> bool:
        if self.cookies:
            # Test if session is still valid
            try:
                resp = await client.get(f"{self.base_url}/api/v2/app/version", cookies=self.cookies, timeout=4.0)
                if resp.status_code == 200:
                    return True
            except Exception:
                pass

        # Perform login
        try:
            url = f"{self.base_url}/api/v2/auth/login"
            data = {"username": self.username, "password": self.password}
            resp = await client.post(url, data=data, timeout=5.0)
            if resp.status_code in [200, 204] and ("set-cookie" in resp.headers or resp.cookies):
                # Store cookies
                self.cookies = dict(resp.cookies)
                return True
            elif resp.status_code == 200 and resp.text.strip() == "Ok.":
                self.cookies = dict(resp.cookies)
                return True
        except Exception as e:
            logger.error(f"qBittorrent login failed: {e}")
        return False

    def _format_speed(self, bytes_per_sec: int) -> str:
        if bytes_per_sec >= 1024 ** 2:
            return f"{bytes_per_sec / (1024 ** 2):.1f} MB/s"
        elif bytes_per_sec >= 1024:
            return f"{bytes_per_sec / 1024:.0f} KB/s"
        return f"{bytes_per_sec} B/s"

    def _format_eta(self, seconds: int) -> str:
        if seconds <= 0 or seconds >= 8640000:
            return "Desconocido"
        if seconds < 60:
            return f"{seconds}s"
        elif seconds < 3600:
            return f"{seconds // 60}m {seconds % 60}s"
        hours = seconds // 3600
        mins = (seconds % 3600) // 60
        return f"{hours}h {mins}m"

    def _format_size(self, size_bytes: int) -> str:
        if size_bytes >= 1024 ** 3:
            return f"{size_bytes / (1024 ** 3):.2f} GB"
        elif size_bytes >= 1024 ** 2:
            return f"{size_bytes / (1024 ** 2):.1f} MB"
        return f"{size_bytes / 1024:.0f} KB"

    async def add_torrent(
        self,
        torrent_url: str,
        category: str = "movies"
    ) -> Dict[str, Any]:
        """
        Adds torrent to qBittorrent with:
        - sequentialDownload = true
        - firstLastPiecePrio = true
        - category = movies / tv
        - savepath = /media/movies or /media/tv
        """
        save_path = (
            settings.QBITTORRENT_TV_PATH if category.lower() == "tv"
            else settings.QBITTORRENT_MOVIES_PATH
        )

        async with httpx.AsyncClient(timeout=15.0) as client:
            logged_in = await self._ensure_logged_in(client)
            if not logged_in:
                raise Exception("No se pudo conectar a qBittorrent. Verifica credenciales y puerto.")

            url = f"{self.base_url}/api/v2/torrents/add"
            data = {
                "urls": torrent_url,
                "savepath": save_path,
                "category": category.lower(),
                "sequentialDownload": "true",
                "firstLastPiecePrio": "true",
                "autoTMM": "false"
            }

            resp = await client.post(url, data=data, cookies=self.cookies)
            # qBittorrent 4.x returns 200 "Ok.", while qBittorrent 5.x returns 200 or 202 (Accepted) with JSON status
            if resp.status_code not in [200, 201, 202]:
                raise Exception(f"qBittorrent error al añadir torrent: {resp.text}")

            # Check if qBittorrent v5 returned an explicit failure JSON
            try:
                res_data = resp.json()
                if isinstance(res_data, dict):
                    # Only treat as failure if failure_count > 0 AND nothing succeeded or was queued
                    if (
                        res_data.get("failure_count", 0) > 0
                        and res_data.get("success_count", 0) == 0
                        and res_data.get("pending_count", 0) == 0
                    ):
                        raise Exception("qBittorrent no pudo procesar el enlace del torrent.")
            except (ValueError, TypeError):
                if "fails" in resp.text.lower():
                    raise Exception("qBittorrent no pudo añadir el torrent.")

            return {
                "success": True,
                "message": f"Torrent añadido con descarga secuencial en {save_path}"
            }

    async def get_active_torrents(self) -> List[ActiveTorrent]:
        """Returns list of active torrents and download progress"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            logged_in = await self._ensure_logged_in(client)
            if not logged_in:
                return []

            url = f"{self.base_url}/api/v2/torrents/info?filter=all"
            try:
                resp = await client.get(url, cookies=self.cookies)
                if resp.status_code != 200:
                    return []
                items = resp.json()
            except Exception as e:
                logger.error(f"Error fetching qBittorrent torrents: {e}")
                return []

        # Check for newly completed torrents to trigger Jellyfin library refresh automatically
        current_completed = {
            (t.get("hash") or "").lower() for t in items
            if (t.get("progress", 0) or 0) >= 1.0 or t.get("state") in ["uploading", "stalledUP", "pausedUP", "queuedUP", "forcedUP"]
        }
        if not self._initial_load_done:
            self._completed_hashes = current_completed
            self._initial_load_done = True
        else:
            newly_completed = current_completed - self._completed_hashes
            if newly_completed:
                self._completed_hashes.update(newly_completed)
                logger.info(f"Newly completed torrents detected: {newly_completed}. Triggering Jellyfin library scan & subtitle auto-fetch.")
                import asyncio
                from app.services.jellyfin import jellyfin_service
                from app.services.subtitles import subtitle_service
                asyncio.create_task(jellyfin_service.refresh_library())
                for c_hash in newly_completed:
                    t_item = next((x for x in items if (x.get("hash") or "").lower() == c_hash), None)
                    t_name = t_item.get("name", "") if t_item else ""
                    asyncio.create_task(subtitle_service.auto_download_for_torrent(t_name, c_hash))

        active_list: List[ActiveTorrent] = []
        for t in items:
            prog_ratio = t.get("progress", 0) or 0
            prog_pct = round(prog_ratio * 100, 1)
            dlspeed = t.get("dlspeed", 0) or 0
            eta = t.get("eta", 0) or 0
            state = t.get("state", "unknown")
            size = t.get("total_size", 0) or t.get("size", 0) or 0

            # Consider ready to play if > 4% downloaded sequentially, or finished
            is_ready = prog_pct >= 4.0 or state in ["uploading", "stalledUP", "pausedUP", "forcedUP"]

            active_list.append(ActiveTorrent(
                hash=t.get("hash", ""),
                name=t.get("name", "Torrent"),
                progress=prog_pct,
                dlspeed=dlspeed,
                dlspeed_formatted=self._format_speed(dlspeed),
                eta=eta,
                eta_formatted=self._format_eta(eta),
                state=state,
                num_seeds=t.get("num_seeds", 0) or 0,
                num_leechs=t.get("num_leechs", 0) or 0,
                size_formatted=self._format_size(size),
                is_ready_to_play=is_ready
            ))

        # Sort active torrents with downloading ones first
        active_list.sort(key=lambda x: (x.progress < 100, x.dlspeed), reverse=True)
        return active_list

    async def get_torrent_files(self, torrent_hash: str) -> List[Dict[str, Any]]:
        """Returns list of files for a specific torrent hash from qBittorrent"""
        async with httpx.AsyncClient(timeout=8.0) as client:
            logged_in = await self._ensure_logged_in(client)
            if not logged_in:
                return []
            url = f"{self.base_url}/api/v2/torrents/files?hash={torrent_hash}"
            try:
                resp = await client.get(url, cookies=self.cookies)
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.error(f"Error fetching torrent files for {torrent_hash}: {e}")
            return []

    async def pause_torrent(self, torrent_hash: str) -> bool:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await self._ensure_logged_in(client)
            resp = await client.post(f"{self.base_url}/api/v2/torrents/pause", data={"hashes": torrent_hash}, cookies=self.cookies)
            return resp.status_code == 200

    async def resume_torrent(self, torrent_hash: str) -> bool:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await self._ensure_logged_in(client)
            resp = await client.post(f"{self.base_url}/api/v2/torrents/resume", data={"hashes": torrent_hash}, cookies=self.cookies)
            return resp.status_code == 200

    async def delete_torrent(self, torrent_hash: str, delete_files: bool = False) -> bool:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await self._ensure_logged_in(client)
            resp = await client.post(
                f"{self.base_url}/api/v2/torrents/delete",
                data={"hashes": torrent_hash, "deleteFiles": "true" if delete_files else "false"},
                cookies=self.cookies
            )
            return resp.status_code == 200

qbittorrent_service = QBittorrentService()

