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
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        class="relative bg-[#131b26] border border-[#2a3c50] rounded-md max-w-4xl w-full overflow-hidden shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Banner */}
        <div class="relative h-40 sm:h-64 w-full overflow-hidden bg-[#0e141d]">
          {backdrop && (
            <img
              src={backdrop}
              alt={item.name}
              class="w-full h-full object-cover filter brightness-[0.55]"
            />
          )}
          <div class="absolute inset-0 bg-gradient-to-t from-[#131b26] via-transparent to-transparent" />

          {/* Close button */}
          <button
            data-nav="item"
            onClick={onClose}
            class="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#1a2533] hover:bg-[#253549] text-white flex items-center justify-center border border-[#2d3e52] transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div class="p-4 sm:p-6 -mt-10 sm:-mt-16 relative z-10">
          <div class="flex flex-col sm:flex-row gap-5 items-start">
            {/* Poster Thumbnail */}
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                class="w-28 sm:w-36 rounded border border-[#2a3c50] shadow-xl flex-none object-cover aspect-[2/3] hidden sm:block"
              />
            )}

            {/* Title & Metadata */}
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#1a2b3c] text-cyan-300 border border-cyan-700/60 font-mono">
                  {item.type === 'Movie' ? 'Película' : item.type === 'Episode' ? 'Episodio' : 'Serie'}
                </span>
                {item.year && <span class="text-xs text-slate-300 font-semibold">{item.year}</span>}
                {item.community_rating && (
                  <span class="text-xs text-amber-400 font-bold">★ {item.community_rating.toFixed(1)}</span>
                )}
                {item.runtime_minutes && (
                  <span class="text-xs text-slate-400">{item.runtime_minutes} min</span>
                )}
                {detail?.video_codec && (
                  <span class="text-xs text-slate-400 font-mono uppercase bg-[#1a2533] px-2 py-0.5 rounded border border-[#243547]">
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
                    <span key={g} class="text-[11px] px-2 py-0.5 bg-[#1a2533] text-slate-300 rounded border border-[#243547]">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              <p class="mt-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {item.overview || 'Sin descripción disponible.'}
              </p>

              {/* Action Buttons: Play, Replace / Search another version, Delete */}
              <div class="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                {item.type !== 'Series' && (
                  <button
                    data-nav="item"
                    data-nav-default="true"
                    onClick={() => {
                      onClose();
                      onPlay(item, detail?.playback_position_ticks);
                    }}
                    class="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 border border-emerald-500"
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
                  class="w-full sm:w-auto px-4 py-2.5 bg-[#1a2533] hover:bg-[#233347] text-slate-200 font-semibold rounded text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 border border-[#2d3e52]"
                  title="Buscar otra calidad (1080p, 4K) o versión con otro audio/idioma"
                >
                  <span>🔄</span>
                  <span>Buscar otra versión</span>
                </button>

                {/* Delete button */}
                <button
                  data-nav="item"
                  onClick={() => setConfirmDelete(true)}
                  class="w-full sm:w-auto px-3.5 py-2.5 bg-[#1b1419] hover:bg-[#2a1720] text-rose-300 hover:text-rose-200 border border-rose-900/60 font-semibold rounded text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
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
            class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={(e) => { e.stopPropagation(); if (!isDeleting) setConfirmDelete(false); }}
          >
            <div
              class="bg-[#171217] border border-rose-900/80 rounded-md p-5 max-w-md w-full shadow-2xl space-y-3.5"
              onClick={(e) => e.stopPropagation()}
            >
              <div class="flex items-center gap-2.5 text-rose-400">
                <span class="text-xl">⚠️</span>
                <h3 class="text-sm sm:text-base font-bold text-white">¿Eliminar "{item.name}"?</h3>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                Esta acción desindexará la película de Jellyfin y borrará físicamente el archivo del disco para <strong>liberar espacio de almacenamiento</strong>.
              </p>
              <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2d1c24]">
                <button
                  data-nav="item"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(false)}
                  class="px-3.5 py-1.5 bg-[#251820] hover:bg-[#341d2a] text-slate-300 text-xs font-semibold rounded border border-rose-900/50"
                >
                  Cancelar
                </button>
                <button
                  data-nav="item"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  class="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded flex items-center gap-2"
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

