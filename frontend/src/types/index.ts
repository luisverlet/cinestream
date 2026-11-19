export interface UserSession {
  userId: string;
  username: string;
  accessToken: string;
}

export interface SubtitleTrack {
  index: number;
  title?: string;
  language?: string;
  is_default: boolean;
  is_forced: boolean;
  codec?: string;
  is_external: boolean;
  delivery_url?: string;
}

export interface AudioTrack {
  index: number;
  title?: string;
  language?: string;
  codec?: string;
  channels?: number;
  is_default: boolean;
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'Movie' | 'Series' | 'Episode';
  overview?: string;
  year?: number;
  community_rating?: number;
  runtime_minutes?: number;
  primary_image_tag?: string;
  backdrop_image_tag?: string;
  image_url?: string;
  backdrop_url?: string;
  genres: string[];
  played: boolean;
  playback_position_ticks?: number;
  total_ticks?: number;
  progress_percentage?: number;
  series_id?: string;
  series_name?: string;
  season_id?: string;
  season_name?: string;
  episode_number?: number;
}

export interface EpisodeItem {
  id: string;
  name: string;
  index_number?: number;
  season_id?: string;
  overview?: string;
  runtime_minutes?: number;
  played: boolean;
  playback_position_ticks?: number;
  image_url?: string;
}

export interface MediaDetail {
  id: string;
  name: string;
  type: string;
  overview?: string;
  year?: number;
  community_rating?: number;
  runtime_minutes?: number;
  image_url?: string;
  backdrop_url?: string;
  genres: string[];
  media_source_id?: string;
  container?: string;
  video_codec?: string;
  audio_tracks: AudioTrack[];
  subtitle_tracks: SubtitleTrack[];
  episodes: EpisodeItem[];
  playback_position_ticks?: number;
}

export interface QualityOption {
  id: string;
  label: string;
  hls_url: string;
  video_bitrate: number;
  max_height: number;
}

export interface StreamInfo {
  item_id: string;
  name: string;
  media_source_id: string;
  hls_url: string;
  direct_url: string;
  play_session_id?: string;
  container?: string;
  video_codec?: string;
  playback_position_ticks: number;
  subtitle_tracks: SubtitleTrack[];
  audio_tracks: AudioTrack[];
  qualities: QualityOption[];
}

export interface TorrentItem {
  guid: string;
  title: string;
  info_hash?: string;
  magnet_url?: string;
  download_url?: string;
  indexer: string;
  size_bytes: number;
  size_formatted: string;
  seeders: number;
  leechers: number;
  resolution: '4K' | '1080p' | '720p' | 'SD' | 'Desconocida';
  category: 'movies' | 'tv' | string;
  publish_date?: string;
}

export interface ActiveTorrent {
  hash: string;
  name: string;
  progress: number;
  dlspeed: number;
  dlspeed_formatted: string;
  eta: number;
  eta_formatted: string;
  state: string;
  num_seeds: number;
  num_leechs: number;
  size_formatted: string;
  is_ready_to_play: boolean;
}

export interface StorageInfo {
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  used_percentage: number;
  is_low_space: boolean;
  is_critical: boolean;
  warning_message?: string;
}

export interface UserRating {
  user_nick: string;
  rating?: number;
  reaction?: string;
  comment?: string;
  updated_at?: string;
}

export interface WatchlistItem {
  id: string;
  title: string;
  original_title?: string;
  type: 'Movie' | 'Series';
  year?: number;
  imdb_id?: string;
  imdb_rating?: number;
  status: 'plan_to_watch' | 'completed';
  ratings?: UserRating[];
  user_nick?: string;
  user_rating?: number; // 1 to 5 (or float)
  notes?: string;
  created_at: string;
  updated_at: string;
  in_library: boolean;
}


