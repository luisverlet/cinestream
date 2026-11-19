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
      <div class="py-12 text-center text-zinc-500 text-xs font-mono">
        No se encontraron fuentes de descarga para este término.
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
      if (!targetUrl) throw new Error('No hay enlace de descarga disponible');

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
        alert(`Error: ${msg}`);
      }
    } finally {
      setDownloadingGuid(null);
    }
  };

  return (
    <div class="space-y-4">
      {/* Quality Filter Tabs */}
      <div class="flex flex-wrap items-center gap-1.5 pb-2 border-b border-zinc-800">
        <span class="text-xs text-zinc-400 font-mono mr-2">Calidad:</span>

        <div class="inline-flex p-0.5 bg-zinc-950 border border-zinc-800 rounded-md">
          <button
            data-nav="item"
            onClick={() => setSelectedQuality('720p')}
            class={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedQuality === '720p'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            720p HD <span class="font-mono text-[10px] text-zinc-400 ml-1">({count720p})</span>
          </button>

          <button
            data-nav="item"
            onClick={() => setSelectedQuality('1080p')}
            class={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedQuality === '1080p'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1080p FHD <span class="font-mono text-[10px] text-zinc-400 ml-1">({count1080p})</span>
          </button>

          {count4k > 0 && (
            <button
              data-nav="item"
              onClick={() => setSelectedQuality('4K')}
              class={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedQuality === '4K'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              4K <span class="font-mono text-[10px] text-zinc-400 ml-1">({count4k})</span>
            </button>
          )}

          <button
            data-nav="item"
            onClick={() => setSelectedQuality('all')}
            class={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedQuality === 'all'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas <span class="font-mono text-[10px] text-zinc-400 ml-1">({countAll})</span>
          </button>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div class="p-6 text-center bg-zinc-950 rounded-md border border-zinc-800 text-zinc-400 text-xs space-y-2">
          <p>No se encontraron resultados en resolución {selectedQuality}.</p>
          <button
            data-nav="item"
            onClick={() => setSelectedQuality('all')}
            class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-md border border-zinc-800 text-xs"
          >
            Ver todas las opciones ({countAll})
          </button>
        </div>
      ) : (
        <div class="space-y-2">
          {filteredResults.map((torrent) => {
            const isDownloading = downloadingGuid === torrent.guid;
            const isSuccess = successGuid === torrent.guid;

            return (
              <div
                key={torrent.guid}
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                {/* Title & Metadata */}
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5 mb-1">
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {torrent.resolution || 'HD'}
                    </span>
                    <span class="text-xs font-mono text-zinc-400">{torrent.size_formatted}</span>
                    <span class="text-xs font-mono text-zinc-400">↑ {torrent.seeders} seeds</span>
                    {torrent.indexer && (
                      <span class="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1 py-0.2 rounded">
                        {torrent.indexer}
                      </span>
                    )}
                  </div>

                  <h4 class="text-xs sm:text-sm font-medium text-zinc-100 break-words line-clamp-1" title={torrent.title}>
                    {torrent.title}
                  </h4>
                </div>

                {/* Actions */}
                <div class="flex items-center gap-2 flex-none self-end sm:self-auto">
                  <button
                    data-nav="item"
                    disabled={isDownloading || isSuccess}
                    onClick={() => handleDownload(torrent)}
                    class={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSuccess
                        ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                        : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm'
                    }`}
                  >
                    {isDownloading ? (
                      <>
                        <span class="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                        <span>Iniciando...</span>
                      </>
                    ) : isSuccess ? (
                      <>
                        <span>✓ En cola</span>
                      </>
                    ) : (
                      <>
                        <span>Descargar</span>
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
