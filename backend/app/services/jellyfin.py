import httpx
import logging
from typing import Optional, Dict, Any, List
from app.config import settings
from app.schemas.media import MediaItem, MediaDetail, AudioTrack, SubtitleTrack, EpisodeItem

logger = logging.getLogger(__name__)

class JellyfinService:
    def __init__(self):
        self.base_url = settings.JELLYFIN_URL.rstrip('/')
        self.client_name = settings.JELLYFIN_CLIENT_NAME
        self.device_id = settings.JELLYFIN_DEVICE_ID
        self.version = settings.JELLYFIN_VERSION
        self.api_key = settings.JELLYFIN_API_KEY
        self._cached_user_id: Optional[str] = None

    async def get_default_user_id(self) -> str:
        if self._cached_user_id:
            return self._cached_user_id
        headers = self._get_auth_header()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/Users", headers=headers)
                if resp.status_code == 200:
                    users = resp.json()
                    if users:
                        self._cached_user_id = users[0]["Id"]
                        return self._cached_user_id
        except Exception:
            pass
        return ""

    def _get_auth_header(self, token: Optional[str] = None) -> Dict[str, str]:
        effective_token = token or self.api_key
        header_val = (
            f'MediaBrowser Client="{self.client_name}", '
            f'Device="WebBrowser", '
            f'DeviceId="{self.device_id}", '
            f'Version="{self.version}"'
        )
        if effective_token:
            header_val += f', Token="{effective_token}"'
        return {
            "Authorization": header_val,
            "X-Emby-Authorization": header_val,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

    async def authenticate(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate user against Jellyfin"""
        url = f"{self.base_url}/Users/AuthenticateByName"
        payload = {"Username": username, "Pw": password}
        auth_header = (
            f'MediaBrowser Client="{self.client_name}", '
            f'Device="WebBrowser", '
            f'DeviceId="{self.device_id}", '
            f'Version="{self.version}"'
        )
        headers = {
            "Authorization": auth_header,
            "X-Emby-Authorization": auth_header,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                logger.warning(f"Jellyfin authentication failed for {username}: status {resp.status_code}")
                raise Exception("Usuario o contraseña incorrectos")
            data = resp.json()
            return {
                "user_id": data["User"]["Id"],
                "username": data["User"]["Name"],
                "access_token": data["AccessToken"],
                "server_id": data.get("ServerId")
            }

    def _format_image_url(self, item_id: str, image_type: str = "Primary", tag: Optional[str] = None, width: int = 400) -> str:
        """Returns proxy or direct Jellyfin image URL"""
        return f"/api/media/image/{item_id}/{image_type}?fillWidth={width}&tag={tag or ''}"

    def _map_item(self, item: Dict[str, Any]) -> MediaItem:
        user_data = item.get("UserData", {})
        ticks = user_data.get("PlaybackPositionTicks", 0)
        total_ticks = item.get("RunTimeTicks", 0)
        progress = None
        if total_ticks and total_ticks > 0:
            progress = round((ticks / total_ticks) * 100, 1)

        run_time_mins = None
        if total_ticks:
            run_time_mins = int(total_ticks / (10000000 * 60))

        item_id = item["Id"]
        primary_tag = item.get("ImageTags", {}).get("Primary")
        backdrop_tag = (item.get("BackdropImageTags") or [None])[0]

        return MediaItem(
            id=item_id,
            name=item.get("Name", "Sin título"),
            type=item.get("Type", "Movie"),
            overview=item.get("Overview"),
            year=item.get("ProductionYear"),
            community_rating=item.get("CommunityRating"),
            runtime_minutes=run_time_mins,
            primary_image_tag=primary_tag,
            backdrop_image_tag=backdrop_tag,
            image_url=self._format_image_url(item_id, "Primary", primary_tag, width=500),
            backdrop_url=self._format_image_url(item_id, "Backdrop", backdrop_tag, width=1280) if backdrop_tag else None,
            genres=item.get("Genres", []),
            played=user_data.get("Played", False),
            playback_position_ticks=ticks,
            total_ticks=total_ticks,
            progress_percentage=progress,
            series_id=item.get("SeriesId"),
            series_name=item.get("SeriesName"),
            season_id=item.get("SeasonId"),
            season_name=item.get("SeasonName"),
            episode_number=item.get("IndexNumber")
        )

    async def get_hero_banner(self, user_id: str, token: str) -> Optional[MediaItem]:
        """Fetch the most recent featured movie or series with a backdrop"""
        effective_uid = user_id or (await self.get_default_user_id())
        if effective_uid:
            url = f"{self.base_url}/Users/{effective_uid}/Items/Latest"
            params = {
                "Limit": 5,
                "Fields": "Overview,ProductionYear,CommunityRating,Genres,RunTimeTicks,BackdropImageTags,ImageTags",
                "EnableImageTypes": "Primary,Backdrop"
            }
            headers = self._get_auth_header(token)
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url, params=params, headers=headers)
                    if resp.status_code == 200:
                        items = resp.json()
                        for it in items:
                            if (it.get("BackdropImageTags") or it.get("ImageTags", {}).get("Primary")):
                                return self._map_item(it)
                        if items:
                            return self._map_item(items[0])
            except Exception as e:
                logger.warning(f"Error fetching latest hero item: {e}")

        # Fallback to get_movies
        movies = await self.get_movies(effective_uid, token, limit=1)
        if movies:
            return movies[0]
        return None

    async def get_continue_watching(self, user_id: str, token: str, limit: int = 12) -> List[MediaItem]:
        """Fetch items in progress for the user"""
        effective_uid = user_id or (await self.get_default_user_id())
        url = f"{self.base_url}/Users/{effective_uid}/Items/Resume"
        params = {
            "Limit": limit,
            "Fields": "Overview,PrimaryImageAspectRatio,BasicSyncInfo,RunTimeTicks,UserData,SeriesName,SeasonName,IndexNumber",
            "ImageTypeLimit": 1,
            "EnableImageTypes": "Primary,Backdrop,Thumb"
        }
        headers = self._get_auth_header(token)
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return [self._map_item(i) for i in data.get("Items", [])]
        return []

    async def get_movies(self, user_id: str, token: str, limit: int = 24, offset: int = 0) -> List[MediaItem]:
        effective_uid = user_id or (await self.get_default_user_id())
        headers = self._get_auth_header(token)
        items = []

        # 1. Try user-scoped endpoint
        if effective_uid:
            url = f"{self.base_url}/Users/{effective_uid}/Items"
            params = {
                "IncludeItemTypes": "Movie",
                "Recursive": "true",
                "SortBy": "DateCreated,SortName",
                "SortOrder": "Descending",
                "Fields": "Overview,ProductionYear,CommunityRating,Genres,RunTimeTicks,BackdropImageTags,ImageTags",
                "Limit": limit,
                "StartIndex": offset
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url, params=params, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        items = [self._map_item(i) for i in data.get("Items", [])]
            except Exception as e:
                logger.warning(f"Error fetching user movies: {e}")

        # 2. Fallback to server-level items endpoint with API key if user returns empty
        if not items:
            admin_headers = self._get_auth_header()
            url = f"{self.base_url}/Items"
            params = {
                "IncludeItemTypes": "Movie",
                "Recursive": "true",
                "SortBy": "DateCreated,SortName",
                "SortOrder": "Descending",
                "Fields": "Overview,ProductionYear,CommunityRating,Genres,RunTimeTicks,BackdropImageTags,ImageTags",
                "Limit": limit,
                "StartIndex": offset
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url, params=params, headers=admin_headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        items = [self._map_item(i) for i in data.get("Items", [])]
            except Exception as e:
                logger.warning(f"Error fetching server-level movies: {e}")

        return items

    async def get_series(self, user_id: str, token: str, limit: int = 24, offset: int = 0) -> List[MediaItem]:
        effective_uid = user_id or (await self.get_default_user_id())
        items = []
        if effective_uid:
            url = f"{self.base_url}/Users/{effective_uid}/Items"
            params = {
                "IncludeItemTypes": "Series,Episode",
                "Recursive": "true",
                "SortBy": "DateCreated,SortName",
                "SortOrder": "Descending",
                "Fields": "Overview,ProductionYear,CommunityRating,Genres,BackdropImageTags,SeriesId,SeriesName,SeasonName,IndexNumber",
                "Limit": limit,
                "StartIndex": offset
            }
            headers = self._get_auth_header(token)
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url, params=params, headers=headers)
                    if resp.status_code == 200:
                        raw_items = resp.json().get("Items", [])
                        series_ids = {s["Id"] for s in raw_items if s.get("Type") == "Series"}
                        for i in raw_items:
                            if i.get("Type") == "Series":
                                items.append(self._map_item(i))
                            elif i.get("Type") == "Episode":
                                # Include standalone episodes whose parent series is not listed
                                if not i.get("SeriesId") or i.get("SeriesId") not in series_ids:
                                    items.append(self._map_item(i))
            except Exception as e:
                logger.warning(f"Error fetching user series: {e}")

        if not items:
            url_admin = f"{self.base_url}/Items"
            params_admin = {
                "IncludeItemTypes": "Series,Episode",
                "Recursive": "true",
                "SortBy": "DateCreated,SortName",
                "SortOrder": "Descending",
                "Fields": "Overview,ProductionYear,CommunityRating,Genres,BackdropImageTags,SeriesId,SeriesName,SeasonName,IndexNumber",
                "Limit": limit,
                "StartIndex": offset
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url_admin, params=params_admin, headers=self._get_auth_header())
                    if resp.status_code == 200:
                        raw_items = resp.json().get("Items", [])
                        series_ids = {s["Id"] for s in raw_items if s.get("Type") == "Series"}
                        for i in raw_items:
                            if i.get("Type") == "Series":
                                items.append(self._map_item(i))
                            elif i.get("Type") == "Episode":
                                if not i.get("SeriesId") or i.get("SeriesId") not in series_ids:
                                    items.append(self._map_item(i))
            except Exception as e:
                logger.warning(f"Error fetching server-level series: {e}")
        return items

    async def get_episodes(self, series_id: str, user_id: str, token: str) -> List[EpisodeItem]:
        url = f"{self.base_url}/Shows/{series_id}/Episodes"
        params = {
            "UserId": user_id,
            "Fields": "Overview,MediaStreams,RunTimeTicks,UserData"
        }
        headers = self._get_auth_header(token)
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                episodes = resp.json().get("Items", [])
                result = []
                for ep in episodes:
                    user_data = ep.get("UserData", {})
                    total_ticks = ep.get("RunTimeTicks", 0)
                    mins = int(total_ticks / (10000000 * 60)) if total_ticks else None
                    ep_id = ep["Id"]
                    tag = ep.get("ImageTags", {}).get("Primary")
                    result.append(EpisodeItem(
                        id=ep_id,
                        name=f"E{ep.get('IndexNumber', 1)}: {ep.get('Name', 'Episodio')}",
                        index_number=ep.get("IndexNumber"),
                        season_id=ep.get("SeasonId"),
                        overview=ep.get("Overview"),
                        runtime_minutes=mins,
                        played=user_data.get("Played", False),
                        playback_position_ticks=user_data.get("PlaybackPositionTicks", 0),
                        image_url=self._format_image_url(ep_id, "Primary", tag, width=400)
                    ))
                return result
        return []

    async def get_item_detail(self, item_id: str, user_id: str, token: str) -> Optional[MediaDetail]:
        effective_uid = user_id or (await self.get_default_user_id())
        data = None

        if effective_uid:
            url = f"{self.base_url}/Users/{effective_uid}/Items/{item_id}"
            headers = self._get_auth_header(token)
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
            except Exception as e:
                logger.warning(f"Error fetching user item detail: {e}")

        # Fallback 1: Admin user with server API key
        if not data:
            admin_uid = await self.get_default_user_id()
            if admin_uid:
                fallback_url = f"{self.base_url}/Users/{admin_uid}/Items/{item_id}"
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.get(fallback_url, headers=self._get_auth_header(self.api_key))
                        if resp.status_code == 200:
                            data = resp.json()
                except Exception as e:
                    logger.warning(f"Error fetching admin item detail fallback: {e}")

        # Fallback 2: /Items?Ids={item_id}
        if not data:
            items_url = f"{self.base_url}/Items?Ids={item_id}&Fields=MediaSources,MediaStreams,Overview,Genres,ProductionYear,CommunityRating,RunTimeTicks,UserData"
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(items_url, headers=self._get_auth_header(self.api_key))
                    if resp.status_code == 200:
                        items_list = resp.json().get("Items", [])
                        if items_list:
                            data = items_list[0]
            except Exception as e:
                logger.warning(f"Error fetching items detail by id: {e}")

        if not data:
            return None

        media_sources = data.get("MediaSources", [])
        media_source_id = media_sources[0].get("Id") if media_sources else item_id
        container = media_sources[0].get("Container") if media_sources else None

        # Parse streams
        streams = (media_sources[0].get("MediaStreams", []) if media_sources else data.get("MediaStreams", []))
        video_codec = None
        audio_tracks: List[AudioTrack] = []
        subtitle_tracks: List[SubtitleTrack] = []

        for s in streams:
            stype = s.get("Type")
            if stype == "Video" and not video_codec:
                video_codec = s.get("Codec")
            elif stype == "Audio":
                audio_tracks.append(AudioTrack(
                    index=s.get("Index", 0),
                    title=s.get("DisplayTitle") or s.get("Language") or "Pista Audio",
                    language=s.get("Language"),
                    codec=s.get("Codec"),
                    channels=s.get("Channels"),
                    is_default=s.get("IsDefault", False)
                ))
            elif stype == "Subtitle":
                sub_idx = s.get("Index", 0)
                # Subtitle URL via Nginx proxy to Jellyfin
                sub_url = f"/jellyfin/Videos/{item_id}/{media_source_id}/Subtitles/{sub_idx}/Stream.vtt?ApiKey={self.api_key or token}"
                subtitle_tracks.append(SubtitleTrack(
                    index=sub_idx,
                    title=s.get("DisplayTitle") or s.get("Language") or f"Subtítulo #{sub_idx}",
                    language=s.get("Language"),
                    is_default=s.get("IsDefault", False),
                    is_forced=s.get("IsForced", False),
                    codec=s.get("Codec"),
                    is_external=s.get("IsExternal", False),
                    delivery_url=sub_url
                ))

        episodes = []
        if data.get("Type") == "Series":
            episodes = await self.get_episodes(item_id, user_id, token)

        total_ticks = data.get("RunTimeTicks", 0)
        mins = int(total_ticks / (10000000 * 60)) if total_ticks else None
        primary_tag = data.get("ImageTags", {}).get("Primary")
        backdrop_tag = (data.get("BackdropImageTags") or [None])[0]

        return MediaDetail(
            id=item_id,
            name=data.get("Name", "Sin título"),
            type=data.get("Type", "Movie"),
            overview=data.get("Overview"),
            year=data.get("ProductionYear"),
            community_rating=data.get("CommunityRating"),
            runtime_minutes=mins,
            image_url=self._format_image_url(item_id, "Primary", primary_tag, width=500),
            backdrop_url=self._format_image_url(item_id, "Backdrop", backdrop_tag, width=1280) if backdrop_tag else None,
            genres=data.get("Genres", []),
            media_source_id=media_source_id,
            container=container,
            video_codec=video_codec,
            audio_tracks=audio_tracks,
            subtitle_tracks=subtitle_tracks,
            episodes=episodes,
            playback_position_ticks=data.get("UserData", {}).get("PlaybackPositionTicks", 0)
        )

    async def search(self, query: str, user_id: str, token: str) -> List[MediaItem]:
        effective_uid = user_id or (await self.get_default_user_id())
        params = {
            "SearchTerm": query,
            "Recursive": "true",
            "IncludeItemTypes": "Movie,Series,Episode",
            "Limit": 20,
            "Fields": "Overview,ProductionYear,CommunityRating,Genres,RunTimeTicks,BackdropImageTags,SeriesId,SeriesName,SeasonName,IndexNumber"
        }
        if effective_uid:
            url = f"{self.base_url}/Users/{effective_uid}/Items"
            headers = self._get_auth_header(token)
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url, params=params, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        items = [self._map_item(i) for i in data.get("Items", [])]
                        if items:
                            return items
            except Exception as e:
                logger.warning(f"Search user error: {e}")

        # Fallback to server-level items search
        url_admin = f"{self.base_url}/Items"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url_admin, params=params, headers=self._get_auth_header())
                if resp.status_code == 200:
                    data = resp.json()
                    return [self._map_item(i) for i in data.get("Items", [])]
        except Exception as e:
            logger.warning(f"Search admin error: {e}")
        return []

    async def get_item_raw(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Fetch raw Jellyfin item data including ProviderIds, Path, MediaSources"""
        admin_headers = self._get_auth_header()
        url = f"{self.base_url}/Items?Ids={item_id}&Fields=ProviderIds,Path,MediaSources,MediaStreams,Overview,Genres,ProductionYear,CommunityRating,RunTimeTicks"
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, headers=admin_headers)
                if resp.status_code == 200:
                    items = resp.json().get("Items", [])
                    if items:
                        return items[0]
        except Exception as e:
            logger.warning(f"Error fetching raw item {item_id}: {e}")
        return None

    async def report_playing(self, item_id: str, play_session_id: str, media_source_id: str, token: Optional[str] = None):
        """Create and register active playback session with Jellyfin SessionManager"""
        url = f"{self.base_url}/Sessions/Playing"
        headers = self._get_auth_header()
        payload = {
            "ItemId": item_id,
            "PlaySessionId": play_session_id,
            "MediaSourceId": media_source_id,
            "CanSeek": True
        }
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                await client.post(url, json=payload, headers=headers)
            except Exception as e:
                logger.warning(f"Failed to report playing session to Jellyfin: {e}")

    async def report_progress(
        self,
        item_id: str,
        position_ticks: int,
        is_paused: bool,
        token: str,
        play_session_id: Optional[str] = None,
        media_source_id: Optional[str] = None
    ):
        """Report playback progress to Jellyfin keep-alive and update resume state"""
        url = f"{self.base_url}/Sessions/Playing/Progress"
        headers = self._get_auth_header()
        payload = {
            "ItemId": item_id,
            "PositionTicks": position_ticks,
            "IsPaused": is_paused,
            "EventName": "timeupdate"
        }
        if play_session_id:
            payload["PlaySessionId"] = play_session_id
        if media_source_id:
            payload["MediaSourceId"] = media_source_id

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                await client.post(url, json=payload, headers=headers)
            except Exception as e:
                logger.warning(f"Failed to report playback progress to Jellyfin: {e}")

    async def report_stopped(
        self,
        item_id: str,
        position_ticks: int,
        token: str,
        play_session_id: Optional[str] = None
    ):
        url = f"{self.base_url}/Sessions/Playing/Stopped"
        headers = self._get_auth_header()
        payload = {
            "ItemId": item_id,
            "PositionTicks": position_ticks
        }
        if play_session_id:
            payload["PlaySessionId"] = play_session_id

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                await client.post(url, json=payload, headers=headers)
            except Exception as e:
                logger.warning(f"Failed to report playback stopped to Jellyfin: {e}")

    async def refresh_library(self) -> bool:
        """Trigger Jellyfin library refresh scan so newly added or completed files are indexed"""
        url = f"{self.base_url}/Library/Refresh"
        headers = self._get_auth_header()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers)
                return resp.status_code in [200, 204]
        except Exception as e:
            logger.warning(f"Failed to trigger library refresh: {e}")
            return False

    async def find_media_for_torrent(
        self,
        torrent_name: str,
        torrent_hash: str = "",
        user_id: str = "",
        token: str = ""
    ) -> Optional[MediaItem]:
        """
        Attempts to locate the Jellyfin MediaItem corresponding to a torrent download.
        Triggers a library refresh and matches strictly by exact video filename, clean title, or folder name.
        NEVER falls back to returning an unrelated movie.
        """
        import re
        import asyncio
        from app.services.qbittorrent import qbittorrent_service

        # 1. Trigger scan so Jellyfin discovers newly downloaded files
        await self.refresh_library()

        # 2. Extract files from qBittorrent if torrent_hash is provided
        torrent_files = []
        if torrent_hash:
            try:
                torrent_files = await qbittorrent_service.get_torrent_files(torrent_hash)
            except Exception as e:
                logger.warning(f"Could not get torrent files for {torrent_hash}: {e}")

        # Identify candidate video filenames from qBittorrent
        video_exts = ('.mp4', '.mkv', '.avi', '.mov', '.m4v', '.webm', '.ts')
        video_files = [f for f in torrent_files if f.get("name", "").lower().endswith(video_exts)]
        # Sort by size descending (the main feature is the largest file)
        video_files.sort(key=lambda x: x.get("size", 0), reverse=True)

        target_filenames = []
        target_folders = []
        for vf in video_files:
            full_path = vf.get("name", "")
            parts = full_path.replace("\\", "/").split("/")
            fn = parts[-1]
            target_filenames.append(fn)
            if len(parts) > 1:
                target_folders.append(parts[0])

        # 3. Clean torrent and file names to extract core title and year
        sample_text = torrent_name
        if target_filenames:
            sample_text += " " + target_filenames[0]

        year_match = re.search(r'\b(19\d{2}|20\d{2})\b', sample_text)
        target_year = year_match.group(1) if year_match else None

        clean_name = re.sub(r'[\._\-]', ' ', torrent_name)
        clean_name = re.sub(
            r'\b(2160p|1080p|720p|480p|webrip|web-dl|bluray|brrip|bdrip|x264|x265|hevc|ddp5|ddp|aac|ac3|10bit|neonoir|yify|yts|am|rarbg)\b.*$',
            '',
            clean_name,
            flags=re.IGNORECASE
        )
        if target_year:
            clean_name = clean_name.replace(target_year, '')
        clean_name = re.sub(r'[\[\]\(\)]', ' ', clean_name).strip()

        words = [
            w.lower() for w in clean_name.split()
            if len(w) >= 3 and w.lower() not in {"the", "and", "los", "las", "del", "part"}
        ]

        search_terms = []
        if len(words) >= 2:
            search_terms.append(" ".join(words[:3]))
            search_terms.append(" ".join(words[:2]))
        if len(words) >= 1:
            search_terms.append(words[0])

        effective_uid = user_id or (await self.get_default_user_id())

        # 4. Poll Jellyfin items (up to 8 attempts = ~16s) to allow library scan to finish
        for attempt in range(8):
            # Check Jellyfin /Items (most reliable: checks exact filesystem Path)
            admin_headers = self._get_auth_header()
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.get(
                        f"{self.base_url}/Items",
                        params={
                            "Recursive": "true",
                            "IncludeItemTypes": "Movie,Episode",
                            "SortBy": "DateCreated",
                            "SortOrder": "Descending",
                            "Limit": 25,
                            "Fields": "Overview,ProductionYear,CommunityRating,Genres,RunTimeTicks,BackdropImageTags,ImageTags,Path"
                        },
                        headers=admin_headers
                    )
                    if resp.status_code == 200:
                        raw_items = resp.json().get("Items", [])
                        for raw in raw_items:
                            r_path = (raw.get("Path") or "").lower()
                            r_name = (raw.get("Name") or "").lower()

                            # Match A: Exact video filename in Jellyfin Path
                            for fn in target_filenames:
                                if fn.lower() in r_path:
                                    logger.info(f"Matched media by exact filename {fn} -> {raw.get('Name')}")
                                    return self._map_item(raw)

                            # Match B: Folder name in Jellyfin Path
                            for fld in target_folders:
                                if fld.lower() in r_path:
                                    logger.info(f"Matched media by folder name {fld} -> {raw.get('Name')}")
                                    return self._map_item(raw)

                            # Match C: All significant title words match path or name
                            if words:
                                words_in_path = all(w in r_path for w in words)
                                words_in_name = all(w in r_name for w in words)
                                year_matches = (target_year is None) or (target_year in r_path) or (str(raw.get("ProductionYear") or "") == target_year)
                                if (words_in_path or words_in_name) and year_matches:
                                    logger.info(f"Matched media by title words & year -> {raw.get('Name')}")
                                    return self._map_item(raw)
            except Exception as e:
                logger.warning(f"Error checking Jellyfin items on attempt {attempt}: {e}")

            # Also try Jellyfin search endpoint if we have search terms
            for term in search_terms:
                try:
                    results = await self.search(term, effective_uid, token)
                    for item in (results or []):
                        item_name_lower = (item.name or "").lower()
                        item_year = str(item.production_year or "")
                        if words and all(w in item_name_lower for w in words):
                            if not target_year or item_year == target_year:
                                logger.info(f"Matched media by search {term} -> {item.name}")
                                return item
                except Exception:
                    pass

            if attempt < 7:
                await asyncio.sleep(2.0)

        # NEVER return raw_items[0]! If not yet ready, return None so client can retry or wait.
        logger.info(f"No media found yet for torrent: {torrent_name}")
        return None

    async def search_and_download_subtitle(self, item_id: str, language: str, token: str) -> bool:
        """Search and download subtitle via Jellyfin Remote Search"""
        headers = self._get_auth_header(token)
        search_url = f"{self.base_url}/Items/{item_id}/RemoteSearch/Subtitles/{language}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(search_url, headers=headers)
            if resp.status_code == 200:
                subs = resp.json()
                if subs and len(subs) > 0:
                    best_sub_id = subs[0]["Id"]
                    download_url = f"{self.base_url}/Items/{item_id}/RemoteSearch/Subtitles/{best_sub_id}"
                    down_resp = await client.post(download_url, headers=headers)
                    return down_resp.status_code in [200, 204]
        return False

    async def delete_item(self, item_id: str, user_id: str, token: str) -> Dict[str, Any]:
        """
        Permanently deletes a media item from Jellyfin and underlying disk storage.
        Also cleans up any associated active torrent in qBittorrent and refreshes library.
        """
        import os
        import shutil

        headers = self._get_auth_header(token)

        # 1. First get item details to discover physical file path and name
        item_path = None
        item_name = ""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                detail_resp = await client.get(f"{self.base_url}/Users/{user_id}/Items/{item_id}", headers=headers)
                if detail_resp.status_code == 200:
                    data = detail_resp.json()
                    item_name = data.get("Name", "")
                    item_path = data.get("Path")
                    if not item_path and data.get("MediaSources"):
                        item_path = data["MediaSources"][0].get("Path")
        except Exception as e:
            logger.warning(f"Could not retrieve path prior to delete: {e}")

        # 2. Tell Jellyfin to delete the item from its database and storage
        jellyfin_deleted = False
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                # Use admin API key if present for maximum permission
                del_headers = self._get_auth_header(self.api_key or token)
                del_resp = await client.delete(f"{self.base_url}/Items/{item_id}", headers=del_headers)
                if del_resp.status_code in [200, 204]:
                    jellyfin_deleted = True
                else:
                    logger.warning(f"Jellyfin delete returned status {del_resp.status_code}: {del_resp.text}")
            except Exception as e:
                logger.error(f"Error calling Jellyfin DELETE /Items/{item_id}: {e}")

        # 3. Clean up matching qBittorrent torrents if any
        try:
            from app.services.qbittorrent import qbittorrent_service
            torrents = await qbittorrent_service.get_active_torrents()
            for t in torrents:
                if item_name and (item_name.lower() in t.name.lower() or t.name.lower() in item_name.lower()):
                    await qbittorrent_service.delete_torrent(t.hash, delete_files=True)
                    logger.info(f"Deleted corresponding qBittorrent torrent for {item_name}: {t.hash}")
        except Exception as e:
            logger.warning(f"Error checking qBittorrent torrents for cleanup: {e}")

        # 4. Clean physical file if it still exists on disk
        if item_path and os.path.exists(item_path):
            try:
                if os.path.isfile(item_path):
                    parent_dir = os.path.dirname(item_path)
                    os.remove(item_path)
                    logger.info(f"Removed physical file: {item_path}")
                    # If parent_dir is a dedicated subfolder under /media, remove it if empty
                    if parent_dir not in ["/media/movies", "/media/downloads", "/media/tv", "/media"] and os.path.exists(parent_dir):
                        if not os.listdir(parent_dir):
                            os.rmdir(parent_dir)
                elif os.path.isdir(item_path) and item_path not in ["/media/movies", "/media/downloads", "/media/tv", "/media"]:
                    shutil.rmtree(item_path)
                    logger.info(f"Removed physical directory: {item_path}")
            except Exception as e:
                logger.warning(f"Error removing physical media file {item_path}: {e}")

        # 5. Refresh Jellyfin library so the item immediately disappears from frontend
        await self.refresh_library()

        return {
            "success": True,
            "message": f"'{item_name or 'Elemento'}' ha sido eliminado correctamente del servidor y del disco."
        }

jellyfin_service = JellyfinService()

