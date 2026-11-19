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
        user_nick: nick.trim() || undefined
      });
      showToast(`📌 "${movie.title}" agregada a Por Ver`);
      await fetchWatchlist();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error al agregar'));
    }
  };

  // Confirm Mark as Watched
  const handleConfirmWatched = async () => {
    if (!markingMovie) return;
    try {
      const trimmedNick = nick.trim() || 'Nano';
      try {
        localStorage.setItem(STORAGE_LAST_NICK_KEY, trimmedNick);
      } catch { }

      const existingMatch = getWatchlistMatch(markingMovie);
      if (existingMatch) {
        await api.rateWatchlistItem(existingMatch.id, {
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

      showToast(`✓ "${markingMovie.title}" calificada por ${trimmedNick} (${userRating}★)`);
      setMarkingMovie(null);
      await fetchWatchlist();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error'));
    }
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-amber-400/25';
    if (rank === 2) return 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black shadow-slate-300/25';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black shadow-amber-600/25';
    return 'bg-slate-800 text-slate-300 border border-slate-700 font-black';
  };

  return (
    <div class="px-3 sm:px-[4vw] py-5 sm:py-8 max-w-7xl mx-auto select-none w-full max-w-full overflow-x-hidden">
      {/* Header Banner */}
      <div class="mb-6 sm:mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5 sm:pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold mb-2">
            <span>⭐ IMDb TOP 15</span>
            <span class="text-slate-400">•</span>
            <span>Catálogo Ligero & Mi Lista</span>
          </div>
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Top 15 IMDb por Géneros
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Explora obras maestras, márcalas como <strong>Vistas</strong> con tu calificación en estrellas o agrégalas a tu lista <strong>Por Ver</strong>.
          </p>
        </div>

        {/* Quick hint badge */}
        <div class="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
          <span class="text-emerald-400 font-bold">⚡ Carga instantánea:</span>
          <span>Sin imágenes pesadas</span>
        </div>
      </div>

      {/* Main Genre Tabs (Horizontally scrollable on mobile) */}
      <div class="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar w-full max-w-full">
        {IMDB_TOP_GENRES.map((genre) => {
          const isActive = genre.id === selectedGenreId;
          return (
            <button
              key={genre.id}
              data-nav="item"
              onClick={() => handleSelectGenre(genre.id)}
              class={`flex-none px-3.5 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all duration-150 cursor-pointer border ${isActive
                ? 'bg-[#1b2838] text-cyan-300 border-[#384b61] font-bold'
                : 'bg-[#121922] hover:bg-[#16212e] text-slate-300 border-[#1f2b38]'
                }`}
            >
              <span class="text-sm sm:text-base">{genre.icon}</span>
              <span>{genre.name}</span>
            </button>
          );
        })}
      </div>

      {/* Subgenres Pills */}
      <div class="mt-4 sm:mt-5 p-3 sm:p-4 rounded bg-[#131b26] border border-[#202d3d]">
        <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-mono">
          <span>Subgéneros de {currentGenre.name}:</span>
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
                class={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer border ${isSubActive
                  ? 'bg-[#1f2f42] text-cyan-300 font-bold border-cyan-600/60'
                  : 'bg-[#16212e] text-slate-400 hover:text-slate-200 border-[#243447] hover:bg-[#1b2838]'
                  }`}
              >
                <span>{sub.icon}</span>
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>

        {/* Subgenre description */}
        <p class="mt-3 text-xs text-slate-400 italic flex items-center gap-1.5 border-t border-[#1e2a38] pt-2.5">
          <span class="text-cyan-400 font-bold not-italic font-mono">ℹ Enfoque:</span>
          <span>{currentSubgenre.description}</span>
        </p>
      </div>

      {/* Copied toast or feedback notice */}
      {(copiedTitle || feedback) && (
        <div class="fixed bottom-6 right-6 z-50 bg-[#162231] text-cyan-300 font-bold px-4 py-2 rounded shadow-xl flex items-center gap-2 border border-[#2b3e55] text-xs">
          <span>✓</span>
          <span>{feedback || `Título copiado: ${copiedTitle}`}</span>
        </div>
      )}

      {/* Movie List Header */}
      <div class="mt-6 sm:mt-8 mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-sm sm:text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide font-sans">
            <span>Top 15 {currentSubgenre.name}</span>
          </h2>
          <span class="text-xs px-2 py-0.5 rounded bg-[#141d27] border border-[#243547] text-slate-400 font-mono">
            {currentSubgenre.movies.length} títulos
          </span>
        </div>
      </div>

      {/* Movies Grid (Sin carátulas: 1 col on mobile, 2 col on tablet, 3 col on desktop) */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {currentSubgenre.movies.map((movie: ImdbMovie) => {
          const isExpanded = expandedMovieIndex === movie.rank;
          const match = getWatchlistMatch(movie);
          const isWatched = match?.status === 'completed';
          const isPlanToWatch = match?.status === 'plan_to_watch';
          const inLibrary = match?.in_library;

          return (
            <div
              key={movie.rank}
              class={`group relative bg-[#141d27] border rounded-md p-3.5 sm:p-4 transition-all duration-150 flex flex-col justify-between ${isWatched
                ? 'border-emerald-600/50 bg-[#121f1d]'
                : isPlanToWatch
                  ? 'border-purple-600/50 bg-[#1a1424]'
                  : 'border-[#243547] hover:border-[#384b61]'
                }`}
            >
              {/* Header: Rank + Title + Ratings */}
              <div>
                <div class="flex items-start justify-between gap-2 mb-2.5">
                  <div class="flex flex-wrap items-center gap-2">
                    {/* Rank Badge */}
                    <span
                      class={`px-2.5 py-1 rounded-xl text-xs shadow-md flex items-center justify-center min-w-[34px] ${getRankBadgeStyle(
                        movie.rank
                      )}`}
                    >
                      #{movie.rank}
                    </span>

                    {/* Rating badge */}
                    <span class="inline-flex items-center gap-1 bg-amber-400/15 border border-amber-400/30 text-amber-300 font-black text-xs px-2.5 py-0.5 rounded-lg">
                      <span>★</span>
                      <span>{movie.rating.toFixed(1)}</span>
                    </span>

                    {/* IN LIBRARY BADGE */}
                    {inLibrary && (
                      <span class="text-[10px] px-2 py-0.5 rounded-md font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <span>✓</span>
                        <span>EN BIBLIOTECA</span>
                      </span>
                    )}

                    {/* WATCHED BADGES */}
                    {isWatched && (
                      <div class="flex flex-wrap items-center gap-1">
                        {match.ratings && match.ratings.length > 0 ? (
                          match.ratings.map((r) => (
                            <span
                              key={r.user_nick}
                              class={`text-[10px] px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 ${r.user_nick.toLowerCase() === 'nano'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : r.user_nick.toLowerCase() === 'vane'
                                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }`}
                            >
                              <span>👤 {r.user_nick}:</span>
                              <span>{r.reaction || (r.rating ? `★ ${r.rating}` : '✓')}</span>
                            </span>
                          ))
                        ) : (
                          <span class="text-[10px] px-2 py-0.5 rounded-md font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                            <span>✓ Vista</span>
                            {match.user_rating && <span>({match.user_rating}★)</span>}
                            {match.user_nick && <span class="opacity-80">· {match.user_nick}</span>}
                          </span>
                        )}
                      </div>
                    )}

                    {/* PLAN TO WATCH BADGE */}
                    {isPlanToWatch && !isWatched && (
                      <span class="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-purple-600/20 text-purple-300 border border-purple-600/30">
                        📌 En Por Ver
                      </span>
                    )}
                  </div>

                  {/* Year & Duration */}
                  <div class="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-none">
                    <span>{movie.year}</span>
                    {movie.duration && (
                      <>
                        <span>•</span>
                        <span>{movie.duration}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 class="text-base sm:text-lg font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                  {movie.title}
                </h3>

                {movie.originalTitle !== movie.title && (
                  <p class="text-xs text-slate-400 italic mt-0.5" title={`Título original: ${movie.originalTitle}`}>
                    {movie.originalTitle}
                  </p>
                )}

                <p class="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span class="text-slate-500 font-semibold">Dirección:</span>
                  <span class="text-slate-300 font-medium">{movie.director}</span>
                </p>

                {/* Synopsis */}
                <div class="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <p class={isExpanded ? '' : 'line-clamp-3 sm:line-clamp-4'}>
                    {movie.synopsis}
                  </p>
                  {movie.synopsis.length > 140 && (
                    <button
                      data-nav="item"
                      onClick={() => setExpandedMovieIndex(isExpanded ? null : movie.rank)}
                      class="mt-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold underline block cursor-pointer"
                    >
                      {isExpanded ? 'Ver menos' : 'Leer sinopsis completa...'}
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Marcar Vista + Por Ver + Search Torrents + Copy Title */}
              <div class="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                {/* Mark as Watched button */}
                <button
                  data-nav="item"
                  onClick={() => {
                    setUserRating(match?.user_rating || 5);
                    setMarkingMovie(movie);
                  }}
                  class={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isWatched
                    ? 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/30'
                    }`}
                  title={isWatched ? 'Editar calificación de película vista' : 'Marcar película como vista y calificar'}
                >
                  <span>✓</span>
                  <span>{isWatched ? `Vista (${match.user_rating || 5}★)` : 'Marcar Vista'}</span>
                </button>

                {/* Add to Por Ver (only if not already watched or in list) */}
                {!isWatched && !isPlanToWatch && (
                  <button
                    data-nav="item"
                    onClick={(e) => handleAddToPlanToWatch(movie, e)}
                    class="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold rounded-xl text-xs transition-colors border border-slate-700 cursor-pointer flex items-center gap-1"
                    title="Agregar a Por Ver"
                  >
                    <span>📌</span>
                    <span>Por Ver</span>
                  </button>
                )}

                {/* Search in Torrents */}
                <button
                  data-nav="item"
                  onClick={() => onSearchMovie(movie.originalTitle || movie.title)}
                  class="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                  title={`Buscar torrents para ${movie.originalTitle || movie.title}`}
                >
                  <svg class="w-3.5 h-3.5 fill-none stroke-current" stroke-width="2.5" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span class="hidden xs:inline">Torrents</span>
                </button>

                {/* Copy Title */}
                <button
                  data-nav="item"
                  onClick={(e) => handleCopyTitle(movie.originalTitle || movie.title, e)}
                  class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors border border-slate-700 flex items-center justify-center cursor-pointer"
                  title="Copiar título"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
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
          class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setMarkingMovie(null)}
        >
          <div
            class="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
                <span>✓ Marcar como Vista:</span>
              </h3>
              <button
                data-nav="item"
                onClick={() => setMarkingMovie(null)}
                class="text-slate-400 hover:text-white p-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            <div>
              <p class="text-sm font-bold text-emerald-400 truncate">
                {markingMovie.title}
              </p>
              <p class="text-xs text-slate-400 mt-0.5">
                {markingMovie.year} • ⭐ IMDb {markingMovie.rating.toFixed(1)}
              </p>
            </div>

            {/* Nick Switcher */}
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                ¿Quién califica?
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
                  class={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${nick.toLowerCase() === 'nano'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                >
                  👤 Nano
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
                  class={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${nick.toLowerCase() === 'vane'
                    ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-900/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                >
                  👤 Vane
                </button>
              </div>
              <input
                type="text"
                data-nav="item"
                value={nick}
                onInput={(e) => setNick((e.target as HTMLInputElement).value)}
                placeholder="O escribe otro nombre..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
              />
            </div>

            {/* Stars Selector (1 to 5) */}
            <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center">
              <label class="block text-xs font-bold text-slate-300 mb-2">
                Tu Calificación en estrellas:
              </label>
              <div class="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    data-nav="item"
                    onClick={() => setUserRating(star)}
                    class={`text-3xl transition-transform hover:scale-125 cursor-pointer ${star <= userRating ? 'text-amber-400' : 'text-slate-700'
                      }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span class="text-xs font-mono text-amber-300 font-bold block mt-1.5">
                {userRating} de 5 estrellas
              </span>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                data-nav="item"
                onClick={() => setMarkingMovie(null)}
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                data-nav="item"
                onClick={handleConfirmWatched}
                class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 cursor-pointer"
              >
                Confirmar Vista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
