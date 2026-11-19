from pydantic import BaseModel
from typing import List, Optional

class SubtitleTrack(BaseModel):
    index: int
    title: Optional[str] = None
    language: Optional[str] = None
    is_default: bool = False
    is_forced: bool = False
    codec: Optional[str] = None
    is_external: bool = False
    delivery_url: Optional[str] = None

class AudioTrack(BaseModel):
    index: int
    title: Optional[str] = None
    language: Optional[str] = None
    codec: Optional[str] = None
    channels: Optional[int] = None
    is_default: bool = False

class MediaItem(BaseModel):
    id: str
    name: str
    type: str  # "Movie", "Series", "Episode"
    overview: Optional[str] = None
    year: Optional[int] = None
    community_rating: Optional[float] = None
    runtime_minutes: Optional[int] = None
    primary_image_tag: Optional[str] = None
    backdrop_image_tag: Optional[str] = None
    image_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    genres: List[str] = []
    played: bool = False
    playback_position_ticks: Optional[int] = None
    total_ticks: Optional[int] = None
    progress_percentage: Optional[float] = None
    # For series/episodes
    series_id: Optional[str] = None
    series_name: Optional[str] = None
    season_id: Optional[str] = None
    season_name: Optional[str] = None
    episode_number: Optional[int] = None

class MediaListResponse(BaseModel):
    items: List[MediaItem]
    total_count: int

class EpisodeItem(BaseModel):
    id: str
    name: str
    index_number: Optional[int] = None
    season_id: Optional[str] = None
    overview: Optional[str] = None
    runtime_minutes: Optional[int] = None
    played: bool = False
    playback_position_ticks: Optional[int] = None
    image_url: Optional[str] = None

class MediaDetail(BaseModel):
    id: str
    name: str
    type: str
    overview: Optional[str] = None
    year: Optional[int] = None
    community_rating: Optional[float] = None
    runtime_minutes: Optional[int] = None
    image_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    genres: List[str] = []
    media_source_id: Optional[str] = None
    container: Optional[str] = None
    video_codec: Optional[str] = None
    audio_tracks: List[AudioTrack] = []
    subtitle_tracks: List[SubtitleTrack] = []
    episodes: List[EpisodeItem] = []
    playback_position_ticks: Optional[int] = None

class QualityOption(BaseModel):
    id: str
    label: str
    hls_url: str
    video_bitrate: int
    max_height: int

class StreamInfoResponse(BaseModel):
    item_id: str
    name: str
    media_source_id: str
    hls_url: str
    direct_url: str
    play_session_id: Optional[str] = None
    container: Optional[str] = None
    video_codec: Optional[str] = None
    playback_position_ticks: int = 0
    subtitle_tracks: List[SubtitleTrack] = []
    audio_tracks: List[AudioTrack] = []
    qualities: List[QualityOption] = []

