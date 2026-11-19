import { useState, useEffect } from 'preact/hooks';
import { TorrentItem } from '../types';
import { api } from '../services/api';

interface TorrentResultsProps {
  results: TorrentItem[];
  onDownloadStarted: (torrentTitle: string) => void;
  onDownloadError?: (errorMsg: string) => void;
}

export function TorrentResults({ results, onDownloadStarted, onDownloadError }: TorrentResultsProps) {
  const [downloadingGuid, setDownloadingGuid] = useState<string | null>(null);
  const [successGuid, setSuccessGuid] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('720p');

  // When results change, default to 720p as requested for faster downloads
  useEffect(() => {
    const has720 = results.some(r => r.resolution === '720p');
    if (has720) {
      setSelectedQuality('720p');
    } else {
      const has1080 = results.some(r => r.resolution === '1080p');
      setSelectedQuality(has1080 ? '1080p' : 'all');
    }
  }, [results]);

  if (results.length === 0) {
    return (
      <div class="py-12 text-center text-slate-400 text-sm">
        No se encontraron torrents activos para este término.
      </div>
    );
  }

  const count720p = results.filter(r => r.resolution === '720p').length;
  const count1080p = results.filter(r => r.resolution === '1080p').length;
  const count4k = results.filter(r => r.resolution === '4K').length;
  const countAll = results.length;

  const filteredResults = selectedQuality === 'all'
    ? results
    : results.filter(r => r.resolution === selectedQuality);

  const handleDownload = async (torrent: TorrentItem) => {
    try {
      setDownloadingGuid(torrent.guid);
      const targetUrl = torrent.magnet_url || torrent.download_url;
      if (!targetUrl) throw new Error('No hay enlace de descarga para este torrent');

      await api.downloadTorrent({
        magnetUrl: torrent.magnet_url,
        downloadUrl: torrent.download_url,
        title: torrent.title,
        category: (torrent.category === 'tv' ? 'tv' : 'movies')
      });

      setSuccessGuid(torrent.guid);
      onDownloadStarted(torrent.title);
      setTimeout(() => setSuccessGuid(null), 3000);
    } catch (e: any) {
      const msg = e.message || 'Error al conectar con qBittorrent';
      if (onDownloadError) {
        onDownloadError(msg);
      } else {
        alert(`Error al descargar: ${msg}`);
      }
    } finally {
      setDownloadingGuid(null);
    }
  };

  const getResolutionColor = (res: string) => {
    switch (res) {
      case '4K':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case '1080p':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case '720p':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
    }
  };

  return (
    <div class="space-y-4">
      {/* Quality Selection Tabs (Default: 720p for fast download) */}
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-2 border-b border-slate-800/80">
        <span class="text-xs text-slate-400 font-semibold mr-1 w-full sm:w-auto">Calidad a descargar:</span>

        <button
          data-nav="item"
          onClick={() => setSelectedQuality('720p')}
          class={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 border ${
            selectedQuality === '720p'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
          }`}
        >
          <span>⚡ 720p HD</span>
          <span class="hidden sm:inline">(Rápida ~2m)</span>
          <span class={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedQuality === '720p' ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
          }`}>
            {count720p}
          </span>
        </button>

        <button
          data-nav="item"
          onClick={() => setSelectedQuality('1080p')}
          class={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 border ${
            selectedQuality === '1080p'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
          }`}
        >
          <span>1080p FHD</span>
          <span class={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedQuality === '1080p' ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
          }`}>
            {count1080p}
          </span>
        </button>

        {count4k > 0 && (
          <button
            data-nav="item"
            onClick={() => setSelectedQuality('4K')}
            class={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 border ${
              selectedQuality === '4K'
                ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-md shadow-purple-500/20'
                : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <span>4K UHD</span>
            <span class={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedQuality === '4K' ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
            }`}>
              {count4k}
            </span>
          </button>
        )}

        <button
          data-nav="item"
          onClick={() => setSelectedQuality('all')}
          class={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 border ${
            selectedQuality === 'all'
              ? 'bg-slate-200 text-slate-950 border-white shadow-md'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
          }`}
        >
          <span>Todas ({countAll})</span>
        </button>
      </div>

      {/* No results in selected quality notice */}
      {filteredResults.length === 0 ? (
        <div class="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs space-y-3">
          <p>No se encontraron torrents en resolución <strong>{selectedQuality}</strong> para este título.</p>
          <div class="flex justify-center gap-2">
            {count1080p > 0 && (
              <button
                data-nav="item"
                onClick={() => setSelectedQuality('1080p')}
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
              >
                Ver en 1080p ({count1080p})
              </button>
            )}
            <button
              data-nav="item"
              onClick={() => setSelectedQuality('all')}
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold"
            >
              Ver todas las calidades ({countAll})
            </button>
          </div>
        </div>
      ) : (
        <div class="space-y-3">
          {filteredResults.map((torrent) => {
            const isDownloading = downloadingGuid === torrent.guid;
            const isSuccess = successGuid === torrent.guid;

            return (
          <div
            key={torrent.guid}
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all hover:bg-slate-800/50"
          >
            {/* Title & Metadata */}
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                {/* Resolution Badge */}
                <span
                  class={`px-2 py-0.5 rounded text-[11px] font-bold border font-mono ${getResolutionColor(
                    torrent.resolution
                  )}`}
                >
                  {torrent.resolution}
                </span>

                {/* File Size */}
                <span class="text-xs font-mono font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                  {torrent.size_formatted}
                </span>

                {/* Seeders */}
                <span class="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  ▲ {torrent.seeders} seeds
                </span>

                {/* Leechers */}
                <span class="text-xs text-slate-400 font-mono">
                  ▼ {torrent.leechers}
                </span>

                {/* Indexer */}
                <span class="text-[11px] text-slate-400 truncate max-w-[140px]">
                  {torrent.indexer}
                </span>
              </div>

              {/* Torrent Clean Title (wrapped nicely on mobile) */}
              <h4 class="text-xs sm:text-sm font-medium text-white break-words line-clamp-2" title={torrent.title}>
                {torrent.title}
              </h4>
            </div>

            {/* Action: Descargar y Ver */}
            <div class="flex-none flex items-center">
              <button
                data-nav="item"
                disabled={isDownloading || isSuccess}
                onClick={() => handleDownload(torrent)}
                class={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  isSuccess
                    ? 'bg-emerald-600 text-white'
                    : isDownloading
                    ? 'bg-slate-700 text-slate-300 opacity-60'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
                }`}
              >
                {isSuccess ? (
                  <>
                    <span>✓ Enviado a qBittorrent</span>
                  </>
                ) : isDownloading ? (
                  <>
                    <span class="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    <span>Descargar y Ver</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
}

