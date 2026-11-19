import { useEffect, useState } from 'preact/hooks';
import { ActiveTorrent, MediaItem, StorageInfo } from '../types';
import { api } from '../services/api';

interface ActiveDownloadsProps {
  onRefresh?: () => void;
  onPlayMedia?: (item: MediaItem) => void;
  storageInfo?: StorageInfo | null;
}

export function ActiveDownloads({ onRefresh, onPlayMedia, storageInfo }: ActiveDownloadsProps) {
  const [downloads, setDownloads] = useState<ActiveTorrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingHash, setResolvingHash] = useState<string | null>(null);
  const [playStatusMessage, setPlayStatusMessage] = useState<string | null>(null);

  const fetchTorrents = async () => {
    try {
      const data = await api.getActiveTorrents();
      setDownloads(data);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Error fetching active torrents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTorrents();
    const interval = setInterval(fetchTorrents, 2500);
    return () => clearInterval(interval);
  }, []);

  const handlePlayTorrent = (hash: string) => {
    setResolvingHash(hash);
    setPlayStatusMessage('Sincronizando con Jellyfin...');

    let attempts = 0;
    const maxAttempts = 6;

    const tryResolve = async () => {
      attempts++;
      try {
        setPlayStatusMessage(`Sincronizando con Jellyfin (${attempts}/${maxAttempts})...`);
        const mediaItem = await api.playTorrent(hash);
        if (mediaItem) {
          setResolvingHash(null);
          setPlayStatusMessage(null);
          if (onPlayMedia) {
            onPlayMedia(mediaItem);
          }
          return;
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(tryResolve, 2500);
        } else {
          setResolvingHash(null);
          setPlayStatusMessage(
            'El video se está terminando de procesar en el servidor. Espera un momento y vuelve a pulsar Reproducir.'
          );
          setTimeout(() => setPlayStatusMessage(null), 6000);
        }
      }
    };

    tryResolve();
  };

  const handlePause = async (hash: string) => {
    await api.pauseTorrent(hash);
    fetchTorrents();
  };

  const handleResume = async (hash: string) => {
    await api.resumeTorrent(hash);
    fetchTorrents();
  };

  const handleDelete = async (hash: string) => {
    if (confirm('¿Eliminar esta descarga de la cola?')) {
      await api.deleteTorrent(hash, true);
      fetchTorrents();
    }
  };

  return (
    <div class="px-4 sm:px-[4vw] py-6 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div class="flex items-center justify-between pb-5 border-b border-zinc-800">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-lg sm:text-xl font-semibold text-zinc-100 tracking-tight">
              Cola de descargas
            </h2>
            <span class="text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
              qBittorrent
            </span>
          </div>
          <p class="text-xs text-zinc-400 max-w-prose">
            Descargas secuenciales activas en el servidor para permitir streaming continuo.
          </p>
        </div>

        <button
          data-nav="item"
          onClick={fetchTorrents}
          class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors border border-zinc-800 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      {/* Storage Disk Status */}
      {storageInfo && (
        <div class="my-5 p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="text-xs font-medium text-zinc-200">Almacenamiento en disco</h4>
              <span class="text-[11px] font-mono text-zinc-400">
                {storageInfo.free_gb} GB libres de {storageInfo.total_gb} GB
              </span>
            </div>
            <p class="text-[11px] text-zinc-500 mt-0.5 font-mono">
              {storageInfo.warning_message || `Ocupado: ${storageInfo.used_gb} GB (${storageInfo.used_percentage}%)`}
            </p>
          </div>

          <div class="sm:w-48 flex flex-col gap-1">
            <div class="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                class={`h-full rounded-full ${
                  storageInfo.is_critical
                    ? 'bg-rose-500'
                    : storageInfo.is_low_space
                    ? 'bg-amber-400'
                    : 'bg-zinc-300'
                }`}
                style={{ width: `${storageInfo.used_percentage}%` }}
              />
            </div>
            <span class="text-[10px] text-right text-zinc-500 font-mono">
              {storageInfo.used_percentage}% ocupado
            </span>
          </div>
        </div>
      )}

      {/* Play Status Notice */}
      {playStatusMessage && (
        <div class="my-4 p-3 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-2.5">
          {resolvingHash && <span class="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></span>}
          <span>{playStatusMessage}</span>
        </div>
      )}

      {loading && downloads.length === 0 ? (
        <div class="py-16 text-center text-zinc-500 text-xs font-mono">
          Consultando descargas en servidor...
        </div>
      ) : downloads.length === 0 ? (
        <div class="py-16 text-center text-zinc-500">
          <p class="text-sm font-medium text-zinc-300">No hay descargas activas</p>
          <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Utiliza la pestaña Buscar para encontrar títulos e iniciar una descarga secuencial.
          </p>
        </div>
      ) : (
        <div class="mt-5 space-y-3">
          {downloads.map((t) => {
            const isFinished = t.progress >= 100;
            const isPaused = t.state.includes('paused');

            return (
              <div
                key={t.hash}
                class="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 sm:p-4 hover:border-zinc-700 transition-colors"
              >
                {/* Header row */}
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      class={`w-2 h-2 rounded-full flex-none ${
                        isFinished
                          ? 'bg-zinc-300'
                          : isPaused
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <h3 class="text-xs sm:text-sm font-medium text-zinc-100 break-words line-clamp-1" title={t.name}>
                      {t.name}
                    </h3>
                  </div>

                  <div class="flex items-center gap-2 flex-none self-end sm:self-auto">
                    {/* Ready to play button */}
                    {t.is_ready_to_play && (
                      <button
                        data-nav="item"
                        disabled={resolvingHash === t.hash}
                        onClick={() => handlePlayTorrent(t.hash)}
                        class="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {resolvingHash === t.hash ? (
                          <>
                            <span class="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                            <span>Cargando</span>
                          </>
                        ) : (
                          <>
                            <span class="text-[10px]">▶</span>
                            <span>Reproducir</span>
                          </>
                        )}
                      </button>
                    )}

                    <span class="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                      {t.size_formatted}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div class="mt-3 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    class={`h-full rounded-full transition-all duration-300 ${
                      isFinished
                        ? 'bg-zinc-200'
                        : isPaused
                        ? 'bg-amber-400'
                        : 'bg-zinc-300'
                    }`}
                    style={{ width: `${t.progress}%` }}
                  />
                </div>

                {/* Progress stats & actions */}
                <div class="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400 font-mono">
                  <div class="flex flex-wrap items-center gap-2.5 sm:gap-4">
                    <span class="font-medium text-zinc-200">{t.progress.toFixed(1)}%</span>
                    <span>Descarga: <strong class="text-zinc-300 font-normal">{t.dlspeed_formatted}</strong></span>
                    <span>ETA: <strong class="text-zinc-300 font-normal">{t.eta_formatted}</strong></span>
                    <span>Seeds: <strong class="text-zinc-300 font-normal">{t.num_seeds}</strong></span>
                    <span class="capitalize text-zinc-500 hidden sm:inline">{t.state}</span>
                  </div>

                  {/* Torrent Controls */}
                  <div class="flex items-center gap-1.5 self-end sm:self-auto">
                    {isPaused ? (
                      <button
                        data-nav="item"
                        onClick={() => handleResume(t.hash)}
                        class="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800 transition-colors cursor-pointer"
                      >
                        Reanudar
                      </button>
                    ) : (
                      <button
                        data-nav="item"
                        onClick={() => handlePause(t.hash)}
                        class="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-800 transition-colors cursor-pointer"
                      >
                        Pausar
                      </button>
                    )}

                    <button
                      data-nav="item"
                      onClick={() => handleDelete(t.hash)}
                      class="px-2.5 py-1 rounded bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 text-xs border border-zinc-800 hover:border-rose-900/60 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
