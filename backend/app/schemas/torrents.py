from pydantic import BaseModel
from typing import List, Optional

class TorrentSearchResult(BaseModel):
    guid: str
    title: str
    info_hash: Optional[str] = None
    magnet_url: Optional[str] = None
    download_url: Optional[str] = None
    indexer: str
    size_bytes: int
    size_formatted: str
    seeders: int
    leechers: int
    resolution: str  # "4K", "1080p", "720p", "SD", "Unknown"
    category: str    # "movies", "tv", "other"
    publish_date: Optional[str] = None

class TorrentSearchResponse(BaseModel):
    query: str
    total: int
    results: List[TorrentSearchResult]

class TorrentDownloadRequest(BaseModel):
    magnet_url: Optional[str] = None
    download_url: Optional[str] = None
    title: str
    category: str = "movies"  # "movies" or "tv"

class TorrentDownloadResponse(BaseModel):
    success: bool
    message: str
    hash: Optional[str] = None

class ActiveTorrent(BaseModel):
    hash: str
    name: str
    progress: float  # 0.0 to 100.0
    dlspeed: int     # bytes per sec
    dlspeed_formatted: str
    eta: int         # seconds
    eta_formatted: str
    state: str
    num_seeds: int
    num_leechs: int
    size_formatted: str
    is_ready_to_play: bool  # e.g. > 5% sequential or downloading fast

