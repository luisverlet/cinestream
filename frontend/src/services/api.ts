import { storage } from './storage';
import {
  MediaItem,
  MediaDetail,
  EpisodeItem,
  StreamInfo,
  TorrentItem,
  ActiveTorrent,
  StorageInfo,
  WatchlistItem
} from '../types';

class ApiService {
  private getHeaders(): HeadersInit {
    const session = storage.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
      headers['X-Emby-Token'] = session.accessToken;
      headers['X-User-Id'] = session.userId;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };
    const response = await fetch(endpoint, { ...options, headers });

    if (response.status === 401) {
      // 1. If this is the login endpoint, it's just invalid credentials - do not reload or clear
      if (endpoint.includes('/api/auth/login')) {
        let msg = 'Usuario o contraseña incorrectos';
        try {
          const err = await response.json();
          if (err.detail) msg = err.detail;
        } catch {
          // keep default msg
        }
        throw new Error(msg);
      }

      // 2. Protected endpoint: DO NOT automatically clear session on transient network or backend glitches!
      // Never wipe the session unless the user explicitly clicks "Cerrar sesión" in the Navbar.
      throw new Error('Sesión no autorizada o temporalmente no disponible');
    }

    if (!response.ok) {
      let errorMsg = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorMsg = errorJson.detail;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string): Promise<{ user_id: string; username: string; access_token: string }> {
    const res = await this.request<{ user_id: string; username: string; access_token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    storage.setSession({
      userId: res.user_id,
      username: res.username,
      accessToken: res.access_token
    });
    return res;
  }

  // Media
  async getHero(): Promise<MediaItem | null> {
    return this.request<MediaItem | null>('/api/media/hero');
  }

  async getContinueWatching(limit: number = 12): Promise<MediaItem[]> {
    return this.request<MediaItem[]>(`/api/media/continue-watching?limit=${limit}`);
  }

  async getMovies(limit: number = 24, offset: number = 0): Promise<MediaItem[]> {
    return this.request<MediaItem[]>(`/api/media/movies?limit=${limit}&offset=${offset}`);
  }

  async getSeries(limit: number = 24, offset: number = 0): Promise<MediaItem[]> {
    return this.request<MediaItem[]>(`/api/media/tv?limit=${limit}&offset=${offset}`);
  }

  async getItemDetail(itemId: string): Promise<MediaDetail> {
    return this.request<MediaDetail>(`/api/media/item/${itemId}`);
  }

  async getEpisodes(seriesId: string): Promise<EpisodeItem[]> {
    return this.request<EpisodeItem[]>(`/api/media/series/${seriesId}/episodes`);
  }

  async searchLocal(query: string): Promise<MediaItem[]> {
    return this.request<MediaItem[]>(`/api/media/search?q=${encodeURIComponent(query)}`);
  }

  // Torrents
  async searchTorrents(query: string): Promise<{ query: string; total: number; results: TorrentItem[] }> {
    return this.request<{ query: string; total: number; results: TorrentItem[] }>(
      `/api/torrents/search?q=${encodeURIComponent(query)}`
    );
  }

  async downloadTorrent(params: {
    magnetUrl?: string;
    downloadUrl?: string;
    title: string;
    category: 'movies' | 'tv';
  }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/torrents/download', {
      method: 'POST',
      body: JSON.stringify({
        magnet_url: params.magnetUrl,
        download_url: params.downloadUrl,
        title: params.title,
        category: params.category
      })
    });
  }

  async getActiveTorrents(): Promise<ActiveTorrent[]> {
    return this.request<ActiveTorrent[]>('/api/torrents/active');
  }

  async pauseTorrent(hash: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/api/torrents/pause', {
      method: 'POST',
      body: JSON.stringify({ hash })
    });
    return res.success;
  }

  async resumeTorrent(hash: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/api/torrents/resume', {
      method: 'POST',
      body: JSON.stringify({ hash })
    });
    return res.success;
  }

  async deleteTorrent(hash: string, deleteFiles: boolean = false): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(
      `/api/torrents/${hash}?delete_files=${deleteFiles}`,
      { method: 'DELETE' }
    );
    return res.success;
  }

  async playTorrent(hash: string): Promise<MediaItem> {
    return this.request<MediaItem>(`/api/torrents/${hash}/play`, {
      method: 'POST'
    });
  }

  // Streaming & Playback reporting
  async getStreamInfo(itemId: string): Promise<StreamInfo> {
    return this.request<StreamInfo>(`/api/stream/${itemId}/info`);
  }

  async reportProgress(
    itemId: string,
    positionTicks: number,
    isPaused: boolean = false,
    playSessionId?: string,
    mediaSourceId?: string
  ): Promise<void> {
    try {
      await this.request(`/api/stream/${itemId}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          position_ticks: positionTicks,
          is_paused: isPaused,
          play_session_id: playSessionId,
          media_source_id: mediaSourceId
        })
      });
    } catch {
      // Non-critical background ping
    }
  }

  async reportStopped(itemId: string, positionTicks: number, playSessionId?: string): Promise<void> {
    try {
      await this.request(`/api/stream/${itemId}/stopped`, {
        method: 'POST',
        body: JSON.stringify({
          position_ticks: positionTicks,
          play_session_id: playSessionId
        })
      });
    } catch {
      // Non-critical background ping
    }
  }

  // Subtitles
  async fetchSpanishSubtitles(itemId: string): Promise<{ success: boolean; message: string; subtitle_url?: string }> {
    return this.request<{ success: boolean; message: string; subtitle_url?: string }>(
      `/api/subtitles/fetch/${itemId}`
    );
  }

  // System & Storage
  async getStorageInfo(): Promise<StorageInfo> {
    return this.request<StorageInfo>('/api/system/storage');
  }

  // Media Deletion
  async deleteMediaItem(itemId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/media/${itemId}`, {
      method: 'DELETE'
    });
  }

  // Watchlist & Watched Lists
  async getWatchlist(status?: string, type?: string): Promise<WatchlistItem[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<WatchlistItem[]>(`/api/watchlist${qs}`);
  }

  async addToWatchlist(item: Partial<WatchlistItem>): Promise<WatchlistItem> {
    return this.request<WatchlistItem>('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  async updateWatchlistItem(id: string, updates: Partial<WatchlistItem>): Promise<WatchlistItem> {
    return this.request<WatchlistItem>(`/api/watchlist/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteWatchlistItem(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/watchlist/${id}`, {
      method: 'DELETE'
    });
  }

  async rateWatchlistItem(
    itemId: string,
    data: { user_nick: string; rating?: number; reaction?: string; comment?: string }
  ): Promise<WatchlistItem> {
    return this.request<WatchlistItem>(`/api/watchlist/${itemId}/rate`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteUserRating(itemId: string, userNick: string): Promise<WatchlistItem> {
    return this.request<WatchlistItem>(`/api/watchlist/${itemId}/rate/${encodeURIComponent(userNick)}`, {
      method: 'DELETE'
    });
  }
}

export const api = new ApiService();

