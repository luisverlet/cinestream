import { useState, useEffect, useCallback } from 'preact/hooks';
import { IMDB_TOP_GENRES, ImdbMovie } from '../data/imdbTopGenres';
import { api } from '../services/api';
import { WatchlistItem } from '../types';

interface TopImdbViewProps {
  onSearchMovie: (movieTitle: string) => void;
}

const STORAGE_LAST_NICK_KEY = 'verlet_cine_last_nick';

export function TopImdbView({ onSearchMovie }: TopImdbViewProps) {
  const [selectedGenreId, setSelectedGenreId] = useState<string>(IMDB_TOP_GENRES[0].id);
  const currentGenre = IMDB_TOP_GENRES.find((g) => g.id === selectedGenreId) || IMDB_TOP_GENRES[0];

  const [selectedSubgenreId, setSelectedSubgenreId] = useState<string>(currentGenre.subgenres[0].id);

  // Watchlist state & sync
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [markingMovie, setMarkingMovie] = useState<ImdbMovie | null>(null);
  const [userRating, setUserRating] = useState<number>(5);
  const [nick, setNick] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_LAST_NICK_KEY) || localStorage.getItem('cineluisverlet_last_nick') || '';
    } catch {
      return '';
    }
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    try {
      const data = await api.getWatchlist();
      setWatchlistItems(data);
    } catch {
      // quiet background
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // When changing genre, pick its first subgenre
  const handleSelectGenre = (genreId: string) => {
    setSelectedGenreId(genreId);
    const targetGenre = IMDB_TOP_GENRES.find((g) => g.id === genreId);
    if (targetGenre && targetGenre.subgenres.length > 0) {
      setSelectedSubgenreId(targetGenre.subgenres[0].id);
    }
  };

  const currentSubgenre = currentGenre.subgenres.find((s) => s.id === selectedSubgenreId) || currentGenre.subgenres[0];

  const [expandedMovieIndex, setExpandedMovieIndex] = useState<number | null>(null);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);

  const handleCopyTitle = (title: string, e: Event) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(title);
    setCopiedTitle(title);
    setTimeout(() => setCopiedTitle(null), 2500);
  };

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const normalizeStr = (s?: string) => {
    if (!s) return '';
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Find if movie matches any watchlist item
  const getWatchlistMatch = (movie: ImdbMovie): WatchlistItem | undefined => {
    const tNorm = normalizeStr(movie.title);
    const oNorm = normalizeStr(movie.originalTitle);
    return watchlistItems.find((it) => {
      const itTitle = normalizeStr(it.title);
      const itOrig = normalizeStr(it.original_title);
      return (
        itTitle === tNorm ||
        itTitle === oNorm ||
        (itOrig && (itOrig === tNorm || itOrig === oNorm))
      );
    });
  };

  // Quick add to "Por Ver"
  const handleAddToPlanToWatch = async (movie: ImdbMovie, e: Event) => {
    e.stopPropagation();
    try {
      const saved = await api.addToWatchlist({
        title: movie.title,
        original_title: movie.originalTitle,
        type: 'Movie',
        year: movie.year,
        imdb_rating: movie.rating,
        status: 'plan_to_watch',
        notes: `Top 15 IMDb (${currentGenre.name} - ${currentSubgenre.name})`
      });
      showToast(`Añadida a Por Ver: "${movie.title}"`);
      await fetchWatchlist();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error'));
    }
  };

  // Confirm Mark as Watched
  const handleConfirmWatched = async () => {
    if (!markingMovie) return;
    const trimmedNick = nick.trim() || 'Nano';
    try {
      localStorage.setItem(STORAGE_LAST_NICK_KEY, trimmedNick);

      const existing = getWatchlistMatch(markingMovie);
      if (existing) {
        await api.rateWatchlistItem(existing.id, {
          user_nick: trimmedNick,
          rating: userRating
        });
      } else {
        await api.addToWatchlist({
          title: markingMovie.title,
          original_title: markingMovie.originalTitle,
          type: 'Movie',
          year: markingMovie.year,
          imdb_rating: markingMovie.rating,
          status: 'completed',
          user_rating: userRating,
          user_nick: trimmedNick
        });
      }

      showToast(`Calificada por ${trimmedNick} (${userRating}★): "${markingMovie.title}"`);
      setMarkingMovie(null);
      await fetchWatchlist();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error'));
    }
  };

  return (
    <div class="px-4 sm:px-[4vw] py-6 max-w-6xl mx-auto select-none w-full max-w-full overflow-x-hidden">
      {/* Header Banner */}
      <div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-2">
            <span>Top 15 IMDb</span>
            <span class="text-zinc-600">/</span>
            <span class="text-zinc-400">Selección por géneros</span>
          </div>
          <h1 class="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-100 tracking-tight">
            Catálogo Editorial IMDb
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Títulos clasificados por subgéneros cinematográficos. Puedes guardarlos en tu lista Por Ver o calificarlos directamente.
          </p>
        </div>

        <div class="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-md">
          <span>Modo catálogo ligero</span>
        </div>
      </div>

      {/* Main Genre Tabs */}
      <div class="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar w-full max-w-full">
        {IMDB_TOP_GENRES.map((genre) => {
          const isActive = genre.id === selectedGenreId;
          return (
            <button
              key={genre.id}
              data-nav="item"
              onClick={() => handleSelectGenre(genre.id)}
              class={`flex-none px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-zinc-800'
              }`}
            >
              <span>{genre.name}</span>
            </button>
          );
        })}
      </div>

      {/* Subgenres Pills */}
      <div class="mt-3 p-3 rounded-md bg-zinc-950 border border-zinc-800">
        <div class="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
          Subgéneros de {currentGenre.name}:
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          {currentGenre.subgenres.map((sub) => {
            const isSubActive = sub.id === currentSubgenre.id;
            return (
              <button
                key={sub.id}
                data-nav="item"
                onClick={() => {
                  setSelectedSubgenreId(sub.id);
                  setExpandedMovieIndex(null);
                }}
                class={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer border ${
                  isSubActive
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border-zinc-800/80'
                }`}
              >
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>

        {/* Subgenre description */}
        <p class="mt-2.5 text-xs text-zinc-400 font-mono flex items-center gap-1.5 border-t border-zinc-800/80 pt-2">
          <span class="text-zinc-500">Enfoque:</span>
          <span>{currentSubgenre.description}</span>
        </p>
      </div>

      {/* Copied toast / feedback notice */}
      {(copiedTitle || feedback) && (
        <div class="fixed bottom-5 right-5 z-50 bg-zinc-900 text-zinc-100 text-xs px-3.5 py-2 rounded-md shadow-xl border border-zinc-700 flex items-center gap-2 font-mono">
          <span>✓</span>
          <span>{feedback || `Título copiado: ${copiedTitle}`}</span>
        </div>
      )}

      {/* Movie List Header */}
      <div class="mt-6 mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-sm sm:text-base font-semibold text-zinc-100">
            {currentSubgenre.name}
          </h2>
          <span class="text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded">
            {currentSubgenre.movies.length} títulos
          </span>
        </div>
      </div>

      {/* Movies Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {currentSubgenre.movies.map((movie: ImdbMovie) => {
          const isExpanded = expandedMovieIndex === movie.rank;
          const match = getWatchlistMatch(movie);
          const isWatched = match?.status === 'completed';
          const isPlanToWatch = match?.status === 'plan_to_watch';
          const inLibrary = match?.in_library;

          return (
            <div
              key={movie.rank}
              class={`group relative bg-zinc-950 border rounded-md p-3.5 sm:p-4 transition-colors flex flex-col justify-between ${
                isWatched
                  ? 'border-zinc-700 bg-zinc-900/40'
                  : isPlanToWatch
                  ? 'border-zinc-700'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Header: Rank + Title + Ratings */}
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    {/* Rank Badge */}
                    <span class="px-1.5 py-0.2 rounded text-[11px] font-mono font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                      #{movie.rank}
                    </span>

                    {/* IMDb Rating */}
                    <span class="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-amber-400 font-mono text-[11px] px-1.5 py-0.2 rounded">
                      <span>★</span>
                      <span>{movie.rating.toFixed(1)}</span>
                    </span>

                    {/* IN LIBRARY BADGE */}
                    {inLibrary && (
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-200 border border-zinc-700">
                        En servidor
                      </span>
                    )}

                    {/* WATCHED BADGES */}
                    {isWatched && (
                      <div class="flex flex-wrap items-center gap-1">
                        {match.ratings && match.ratings.length > 0 ? (
                          match.ratings.map((r) => (
                            <span
                              key={r.user_nick}
                              class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-700 flex items-center gap-1"
                            >
                              <span>{r.user_nick}:</span>
                              <span>{r.reaction || (r.rating ? `${r.rating}★` : '✓')}</span>
                            </span>
                          ))
                        ) : (
                          <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                            Vista {match.user_rating ? `(${match.user_rating}★)` : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {/* PLAN TO WATCH BADGE */}
                    {isPlanToWatch && !isWatched && (
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        Por Ver
                      </span>
                    )}
                  </div>

                  {/* Year & Duration */}
                  <div class="text-[11px] text-zinc-400 font-mono flex items-center gap-1 flex-none">
                    <span>{movie.year}</span>
                    {movie.duration && (
                      <>
                        <span>·</span>
                        <span>{movie.duration}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 class="text-sm sm:text-base font-semibold text-zinc-100 leading-snug">
                  {movie.title}
                </h3>

                {movie.originalTitle !== movie.title && (
                  <p class="text-xs text-zinc-400 mt-0.5 font-normal" title={`Título original: ${movie.originalTitle}`}>
                    {movie.originalTitle}
                  </p>
                )}

                <p class="text-xs text-zinc-400 mt-1 flex items-center gap-1 font-normal">
                  <span class="text-zinc-500">Dirección:</span>
                  <span class="text-zinc-300">{movie.director}</span>
                </p>

                {/* Synopsis */}
                <div class="mt-2.5 text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80 font-normal">
                  <p class={isExpanded ? '' : 'line-clamp-3'}>
                    {movie.synopsis}
                  </p>
                  {movie.synopsis.length > 140 && (
                    <button
                      data-nav="item"
                      onClick={() => setExpandedMovieIndex(isExpanded ? null : movie.rank)}
                      class="mt-1 text-xs text-zinc-400 hover:text-zinc-200 underline block cursor-pointer"
                    >
                      {isExpanded ? 'Mostrar menos' : 'Leer sinopsis completa'}
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div class="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                {/* Mark as Watched button */}
                <button
                  data-nav="item"
                  onClick={() => {
                    setUserRating(match?.user_rating || 5);
                    setMarkingMovie(movie);
                  }}
                  class={`py-1.5 px-2.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
                    isWatched
                      ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                  }`}
                  title={isWatched ? 'Editar calificación' : 'Marcar como vista'}
                >
                  <span>✓</span>
                  <span>{isWatched ? `Vista (${match.user_rating || 5}★)` : 'Marcar vista'}</span>
                </button>

                {/* Add to Por Ver */}
                {!isWatched && !isPlanToWatch && (
                  <button
                    data-nav="item"
                    onClick={(e) => handleAddToPlanToWatch(movie, e)}
                    class="py-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-medium transition-colors border border-zinc-800 cursor-pointer"
                    title="Añadir a Por Ver"
                  >
                    + Por Ver
                  </button>
                )}

                {/* Search in Torrents */}
                <button
                  data-nav="item"
                  onClick={() => onSearchMovie(movie.originalTitle || movie.title)}
                  class="flex-1 py-1.5 px-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                  title={`Buscar descargas para ${movie.originalTitle || movie.title}`}
                >
                  <svg class="w-3 h-3 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Buscar</span>
                </button>

                {/* Copy Title */}
                <button
                  data-nav="item"
                  onClick={(e) => handleCopyTitle(movie.originalTitle || movie.title, e)}
                  class="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-xs transition-colors border border-zinc-800 flex items-center justify-center cursor-pointer"
                  title="Copiar título"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MODAL: CALIFICAR Y MARCAR COMO VISTA ─── */}
      {markingMovie && (
        <div
          class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setMarkingMovie(null)}
        >
          <div
            class="bg-zinc-950 border border-zinc-800 rounded-lg max-w-sm w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 class="text-sm font-semibold text-zinc-100">
                Calificar y registrar vista
              </h3>
              <button
                data-nav="item"
                onClick={() => setMarkingMovie(null)}
                class="text-zinc-400 hover:text-zinc-100 p-1 text-xs rounded"
              >
                ✕
              </button>
            </div>

            <div>
              <p class="text-sm font-medium text-zinc-100 truncate">
                {markingMovie.title}
              </p>
              <p class="text-xs text-zinc-400 font-mono mt-0.5">
                {markingMovie.year} · ★ {markingMovie.rating.toFixed(1)} IMDb
              </p>
            </div>

            {/* Nick Switcher */}
            <div>
              <label class="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Perfil activo
              </label>
              <div class="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  data-nav="item"
                  onClick={() => {
                    setNick('Nano');
                    const m = getWatchlistMatch(markingMovie);
                    const r = m?.ratings?.find((x) => x.user_nick.toLowerCase() === 'nano');
                    if (r && r.rating) setUserRating(r.rating);
                  }}
                  class={`py-1.5 px-3 rounded text-xs font-medium transition-colors border cursor-pointer ${
                    nick.toLowerCase() === 'nano'
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Nano
                </button>
                <button
                  type="button"
                  data-nav="item"
                  onClick={() => {
                    setNick('Vane');
                    const m = getWatchlistMatch(markingMovie);
                    const r = m?.ratings?.find((x) => x.user_nick.toLowerCase() === 'vane');
                    if (r && r.rating) setUserRating(r.rating);
                  }}
                  class={`py-1.5 px-3 rounded text-xs font-medium transition-colors border cursor-pointer ${
                    nick.toLowerCase() === 'vane'
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Vane
                </button>
              </div>
              <input
                type="text"
                data-nav="item"
                value={nick}
                onInput={(e) => setNick((e.target as HTMLInputElement).value)}
                placeholder="Otro nombre..."
                class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>

            {/* Stars Selector (1 to 5) */}
            <div class="p-3 bg-zinc-900/60 border border-zinc-800 rounded text-center">
              <label class="block text-xs font-mono text-zinc-400 mb-2 uppercase">
                Calificación
              </label>
              <div class="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    data-nav="item"
                    onClick={() => setUserRating(star)}
                    class={`text-2xl transition-colors cursor-pointer ${
                      star <= userRating ? 'text-amber-400' : 'text-zinc-700'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span class="text-xs font-mono text-zinc-400 block mt-1.5">
                {userRating} de 5 estrellas
              </span>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                data-nav="item"
                onClick={() => setMarkingMovie(null)}
                class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                data-nav="item"
                onClick={handleConfirmWatched}
                class="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
