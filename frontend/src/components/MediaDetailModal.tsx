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
        class="relative bg-[#09090b] border border-zinc-800 rounded-lg max-w-3xl w-full overflow-hidden shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Banner */}
        <div class="relative h-36 sm:h-52 w-full overflow-hidden bg-zinc-950 border-b border-zinc-800">
          {backdrop && (
            <img
              src={backdrop}
              alt={item.name}
              class="w-full h-full object-cover filter brightness-[0.45]"
            />
          )}
          <div class="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />

          {/* Close button */}
          <button
            data-nav="item"
            onClick={onClose}
            class="absolute top-3 right-3 w-7 h-7 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-700/80 transition-colors text-xs cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div class="p-4 sm:p-6 -mt-8 sm:-mt-12 relative z-10">
          <div class="flex flex-col sm:flex-row gap-5 items-start">
            {/* Poster Thumbnail */}
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                class="w-24 sm:w-32 rounded-md shadow-md border border-zinc-700 flex-none object-cover aspect-[2/3] hidden sm:block bg-zinc-900"
              />
            )}

            {/* Title & Metadata */}
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-800">
                  {item.type === 'Movie' ? 'Película' : 'Serie'}
                </span>
                {item.year && <span class="text-xs text-zinc-400 font-mono">{item.year}</span>}
                {item.community_rating && (
                  <span class="text-xs text-amber-400 font-medium">★ {item.community_rating.toFixed(1)}</span>
                )}
                {item.runtime_minutes && (
                  <span class="text-xs text-zinc-400 font-mono">{item.runtime_minutes} min</span>
                )}
                {detail?.video_codec && (
                  <span class="text-xs text-zinc-400 font-mono uppercase bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded">
                    {detail.video_codec}
                  </span>
                )}
              </div>

              <h2 class="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
                {item.name}
              </h2>

              {/* Genres */}
              {item.genres && item.genres.length > 0 && (
                <div class="flex flex-wrap gap-1.5 mt-2">
                  {item.genres.map((g) => (
                    <span key={g} class="text-[11px] px-2 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-800/80 rounded font-normal">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              <p class="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl font-normal">
                {item.overview || 'Sin descripción disponible.'}
              </p>

              {/* Action Buttons */}
              <div class="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                {item.type !== 'Series' && (
                  <button
                    data-nav="item"
                    data-nav-default="true"
                    onClick={() => {
                      onClose();
                      onPlay(item, detail?.playback_position_ticks);
                    }}
                    class="w-full sm:w-auto px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-md text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
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
                  class="w-full sm:w-auto px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium rounded-md text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 border border-zinc-700/80 cursor-pointer"
                  title="Buscar otra calidad o versión en la red"
                >
                  <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Buscar otra versión</span>
                </button>

                {/* Delete button */}
                <button
                  data-nav="item"
                  onClick={() => setConfirmDelete(true)}
                  class="w-full sm:w-auto px-3.5 py-2 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/60 font-medium rounded-md text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Eliminar del servidor para liberar espacio"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Series Episodes List */}
          {item.type === 'Series' && (
            <div class="mt-6 border-t border-zinc-800 pt-5">
              <h3 class="text-sm font-semibold text-zinc-100 mb-3 flex items-center justify-between">
                <span>Episodios disponibles</span>
                <span class="text-xs font-mono text-zinc-400">{episodes.length}</span>
              </h3>

              {loading ? (
                <div class="py-6 text-center text-zinc-400 text-xs font-mono">
                  Cargando episodios...
                </div>
              ) : episodes.length === 0 ? (
                <p class="text-xs text-zinc-400 py-3">No se encontraron episodios en esta serie.</p>
              ) : (
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
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
                      class="flex items-center gap-2.5 p-2.5 rounded-md bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-colors"
                    >
                      <div class="w-6 h-6 rounded bg-zinc-800 text-zinc-200 flex items-center justify-center font-bold text-[10px] flex-none">
                        ▶
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="text-xs font-medium text-zinc-200 truncate">{ep.name}</h4>
                        <div class="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-0.5">
                          {ep.runtime_minutes && <span>{ep.runtime_minutes}m</span>}
                          {ep.played && <span class="text-zinc-300">✓ Visto</span>}
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
              class="bg-zinc-950 border border-zinc-800 rounded-lg p-5 max-w-sm w-full shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 class="text-sm font-semibold text-zinc-100">¿Eliminar "{item.name}"?</h3>
              <p class="text-xs text-zinc-400 leading-relaxed">
                Esta acción borrará el archivo de video físicamente del disco del servidor para liberar espacio.
              </p>
              <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  data-nav="item"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(false)}
                  class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-md border border-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  data-nav="item"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar archivo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
