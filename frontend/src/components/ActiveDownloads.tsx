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
    setPlayStatusMessage('Sincronizando con Jellyfin... buscando película');

    let attempts = 0;
    const maxAttempts = 6;

    const tryResolve = async () => {
      attempts++;
      try {
        setPlayStatusMessage(`Sincronizando con Jellyfin... (intento ${attempts}/${maxAttempts})`);
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
            'El video aún se está descargando o procesando en Jellyfin. Espera unos segundos y vuelve a pulsar Ver ahora.'
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
    if (confirm('¿Deseas eliminar esta descarga de qBittorrent?')) {
      await api.deleteTorrent(hash, true);
      fetchTorrents();
    }
  };

  return (
    <div class="px-[4vw] py-6 max-w-6xl mx-auto select-none">
      <div class="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h2 class="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Cola de Descargas</span>
            <span class="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-mono rounded-full">
              qBittorrent Secuencial
            </span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Los archivos se descargan en modo secuencial para permitir reproducción casi inmediata.
          </p>
        </div>

        <button
          data-nav="item"
          onClick={fetchTorrents}
          class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <span>Actualizar</span>
        </button>
      </div>

      {/* Storage Disk Meter */}
      {storageInfo && (
        <div class="my-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
              storageInfo.is_critical
                ? 'bg-rose-500/20 text-rose-400'
                : storageInfo.is_low_space
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {storageInfo.is_critical ? '⚠️' : storageInfo.is_low_space ? '⚠️' : '💾'}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-xs sm:text-sm font-bold text-white">Almacenamiento del Servidor</h4>
                <span class={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  storageInfo.is_critical
                    ? 'bg-rose-500/20 text-rose-300'
                    : storageInfo.is_low_space
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {storageInfo.free_gb} GB libres
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                {storageInfo.warning_message || `Usado: ${storageInfo.used_gb} GB de ${storageInfo.total_gb} GB en disco`}
              </p>
            </div>
          </div>

          <div class="sm:w-48 flex flex-col gap-1">
            <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                class={`h-full rounded-full transition-all duration-500 ${
                  storageInfo.is_critical
                    ? 'bg-rose-500'
                    : storageInfo.is_low_space
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${storageInfo.used_percentage}%` }}
              />
            </div>
            <span class="text-[10px] text-right text-slate-400 font-mono">
              {storageInfo.used_percentage}% ocupado
            </span>
          </div>
        </div>
      )}

      {/* Play Status Notice */}
      {playStatusMessage && (
        <div class="my-4 p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xl backdrop-blur-md">
          {resolvingHash && <span class="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>}
          <span>{playStatusMessage}</span>
        </div>
      )}

      {loading && downloads.length === 0 ? (
        <div class="py-16 text-center text-slate-400">
          <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-xs">Consultando descargas activas...</p>
        </div>
      ) : downloads.length === 0 ? (
        <div class="py-20 text-center text-slate-500">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <p class="text-base font-semibold text-slate-400">No hay descargas activas en este momento</p>
          <p class="text-xs text-slate-500 mt-1">Busca una película o serie en la pestaña de Torrents para iniciar una descarga secuencial.</p>
        </div>
      ) : (
        <div class="mt-6 space-y-4">
          {downloads.map((t) => {
            const isFinished = t.progress >= 100;
            const isPaused = t.state.includes('paused');

            return (
              <div
                key={t.hash}
                class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 transition-all hover:border-slate-700"
              >
                {/* Header row */}
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      class={`w-2.5 h-2.5 rounded-full flex-none ${
                        isFinished
                          ? 'bg-emerald-400'
                          : isPaused
                          ? 'bg-amber-400'
                          : 'bg-cyan-400 animate-pulse'
                      }`}
                    />
                    <h3 class="text-xs sm:text-base font-bold text-white break-words line-clamp-2" title={t.name}>
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
                        class="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl border border-emerald-400 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                      >
                        {resolvingHash === t.hash ? (
                          <>
                            <span class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                            <span>Cargando...</span>
                          </>
                        ) : (
                          <>
                            <span>▶</span>
                            <span>Ver ahora</span>
                          </>
                        )}
                      </button>
                    )}

                    <span class="text-xs font-mono font-semibold text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg">
                      {t.size_formatted}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div class="mt-3.5 w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    class={`h-full rounded-full transition-all duration-300 ${
                      isFinished
                        ? 'bg-emerald-500'
                        : isPaused
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${t.progress}%` }}
                  />
                </div>

                {/* Progress stats & actions */}
                <div class="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] sm:text-xs text-slate-400 font-mono">
                  <div class="flex flex-wrap items-center gap-2.5 sm:gap-4">
                    <span class="font-bold text-white font-sans">{t.progress.toFixed(1)}%</span>
                    <span>Velocidad: <strong class="text-emerald-400">{t.dlspeed_formatted}</strong></span>
                    <span>ETA: <strong class="text-slate-300">{t.eta_formatted}</strong></span>
                    <span>Seeds: <strong class="text-slate-300">{t.num_seeds}</strong></span>
                    <span class="capitalize text-slate-500 hidden sm:inline">{t.state}</span>
                  </div>

                  {/* Torrent Controls */}
                  <div class="flex items-center gap-2 self-end sm:self-auto pt-1 sm:pt-0">
                    {isPaused ? (
                      <button
                        data-nav="item"
                        onClick={() => handleResume(t.hash)}
                        class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs border border-slate-700 transition-colors"
                      >
                        Reanudar
                      </button>
                    ) : (
                      <button
                        data-nav="item"
                        onClick={() => handlePause(t.hash)}
                        class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors"
                      >
                        Pausar
                      </button>
                    )}

                    <button
                      data-nav="item"
                      onClick={() => handleDelete(t.hash)}
                      class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 font-semibold text-xs border border-slate-700 hover:border-rose-800/40 transition-colors"
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

