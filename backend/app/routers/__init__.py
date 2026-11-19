from .auth import router as auth_router
from .media import router as media_router
from .stream import router as stream_router
from .torrents import router as torrents_router
from .subtitles import router as subtitles_router
from .system import router as system_router
from .watchlist import router as watchlist_router

__all__ = [
    "auth_router",
    "media_router",
    "stream_router",
    "torrents_router",
    "subtitles_router",
    "system_router",
    "watchlist_router",
]

