import { useEffect, useState } from 'preact/hooks';
import { MediaItem, MediaDetail, EpisodeItem } from '../types';
import { api } from '../services/api';

interface MediaDetailModalProps {
  item: MediaItem;
  onClose: () => void;
  onPlay: (item: MediaItem, initialTicks?: number) => void;
  onReplaceMedia?: (movieTitle: string) => void;
  onMediaDeleted?: (itemId: string) => void;
}

export function MediaDetailModal({ item, onClose, onPlay, onReplaceMedia, onMediaDeleted }: MediaDetailModalProps) {
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getItemDetail(item.id);
        if (isMounted) {
          setDetail(data);
          if (data.type === 'Series') {
            setEpisodes(data.episodes || []);
          }
        }
      } catch (e) {
        console.error('Error fetching media details:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [item.id]);

  const backdrop = detail?.backdrop_url || item.backdrop_url || item.image_url;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.deleteMediaItem(item.id);
      if (onMediaDeleted) {
        onMediaDeleted(item.id);
      }
      onClose();
    } catch (e: any) {
      alert(e.message || 'Error al eliminar el archivo del servidor');
      setIsDeleting(false);
    }
  };

  return (
    <div
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        class="relative bg-[#0d131f] border border-slate-700/80 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Banner */}
        <div class="relative h-40 sm:h-64 w-full overflow-hidden bg-slate-900">
          {backdrop && (
            <img
              src={backdrop}
              alt={item.name}
              class="w-full h-full object-cover filter brightness-[0.55]"
            />
          )}
          <div class="absolute inset-0 bg-gradient-to-t from-[#0d131f] via-transparent to-transparent" />

          {/* Close button */}
          <button
            data-nav="item"
            onClick={onClose}
            class="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 backdrop-blur-sm transition-colors text-xs sm:text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div class="p-4 sm:p-6 -mt-10 sm:-mt-16 relative z-10">
          <div class="flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster Thumbnail */}
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                class="w-28 sm:w-36 rounded-xl shadow-2xl border-2 border-slate-700/80 flex-none object-cover aspect-[2/3] hidden sm:block"
              />
            )}

            {/* Title & Metadata */}
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  {item.type === 'Movie' ? 'Película' : 'Serie'}
                </span>
                {item.year && <span class="text-xs text-slate-300 font-semibold">{item.year}</span>}
                {item.community_rating && (
                  <span class="text-xs text-amber-400 font-bold">★ {item.community_rating.toFixed(1)}</span>
                )}
                {item.runtime_minutes && (
                  <span class="text-xs text-slate-400">{item.runtime_minutes} min</span>
                )}
                {detail?.video_codec && (
                  <span class="text-xs text-slate-400 font-mono uppercase bg-slate-800/80 px-2 py-0.5 rounded">
                    {detail.video_codec}
                  </span>
                )}
              </div>

              <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {item.name}
              </h2>

              {/* Genres */}
              {item.genres && item.genres.length > 0 && (
                <div class="flex flex-wrap gap-1.5 mt-2">
                  {item.genres.map((g) => (
                    <span key={g} class="text-[11px] px-2 py-0.5 bg-slate-800/90 text-slate-300 rounded-md">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              <p class="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {item.overview || 'Sin descripción disponible.'}
              </p>

              {/* Action Buttons: Play, Replace / Search another version, Delete */}
              <div class="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {item.type !== 'Series' && (
                  <button
                    data-nav="item"
                    data-nav-default="true"
                    onClick={() => {
                      onClose();
                      onPlay(item, detail?.playback_position_ticks);
                    }}
                    class="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95"
                  >
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>
                      {detail?.playback_position_ticks && detail.playback_position_ticks > 0
                        ? 'Reanudar'
                        : 'Reproducir'}
                    </span>
                  </button>
                )}

                {/* Search alternative version / Replace */}
                <button
                  data-nav="item"
                  onClick={() => {
                    onClose();
                    if (onReplaceMedia) {
                      onReplaceMedia(item.name);
                    }
                  }}
                  class="w-full sm:w-auto px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 border border-slate-700/80 active:scale-95"
                  title="Buscar otra calidad (1080p, 4K) o versión con otro audio/idioma"
                >
                  <span>🔄</span>
                  <span>Buscar otra versión</span>
                </button>

                {/* Delete button */}
                <button
                  data-nav="item"
                  onClick={() => setConfirmDelete(true)}
                  class="w-full sm:w-auto px-4 py-2.5 bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/50 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  title="Eliminar película del servidor para liberar espacio en disco"
                >
                  <span>🗑️</span>
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Series Episodes List */}
          {item.type === 'Series' && (
            <div class="mt-8 border-t border-slate-800/80 pt-6">
              <h3 class="text-base font-bold text-white mb-4 flex items-center justify-between">
                <span>Episodios Disponibles</span>
                <span class="text-xs text-slate-400 font-normal">{episodes.length} episodios</span>
              </h3>

              {loading ? (
                <div class="py-8 flex justify-center text-slate-400 text-sm">
                  <span class="animate-spin mr-2">⟳</span> Cargando episodios...
                </div>
              ) : episodes.length === 0 ? (
                <p class="text-xs text-slate-400 py-4">No se encontraron episodios en esta serie.</p>
              ) : (
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      data-nav="item"
                      tabIndex={0}
                      onClick={() => {
                        onClose();
                        onPlay({
                          id: ep.id,
                          name: `${item.name} - ${ep.name}`,
                          type: 'Episode',
                          genres: item.genres,
                          played: ep.played,
                          playback_position_ticks: ep.playback_position_ticks
                        }, ep.playback_position_ticks);
                      }}
                      class="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/40 cursor-pointer transition-all hover:scale-[1.02] focus:ring-2 focus:ring-emerald-400"
                    >
                      <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-none">
                        ▶
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="text-xs font-semibold text-white truncate">{ep.name}</h4>
                        <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {ep.runtime_minutes && <span>{ep.runtime_minutes} min</span>}
                          {ep.played && <span class="text-emerald-400">✓ Visto</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div
            class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { e.stopPropagation(); if (!isDeleting) setConfirmDelete(false); }}
          >
            <div
              class="bg-slate-900 border border-rose-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div class="flex items-center gap-3 text-rose-400">
                <span class="text-2xl">⚠️</span>
                <h3 class="text-base sm:text-lg font-bold text-white">¿Eliminar "{item.name}"?</h3>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                Esta acción desindexará la película de Jellyfin y borrará físicamente el archivo del disco para <strong>liberar espacio de almacenamiento</strong>.
              </p>
              <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  data-nav="item"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(false)}
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  data-nav="item"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  class="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-950/40"
                >
                  {isDeleting ? (
                    <>
                      <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <span>Sí, eliminar archivo</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

