import { useEffect, useState, useMemo } from 'preact/hooks';
import { MediaItem } from '../types';
import { api } from '../services/api';
import { MediaCard } from '../components/MediaCard';

interface HomeViewProps {
  onPlay: (item: MediaItem, initialTicks?: number) => void;
  onSelect: (item: MediaItem) => void;
}

export function HomeView({ onPlay, onSelect }: HomeViewProps) {
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Steam-style library controls
  const [filterType, setFilterType] = useState<'all' | 'movies' | 'series' | 'continue'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'alpha' | 'recent' | 'rating'>('recent');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [continueData, moviesData, seriesData] = await Promise.allSettled([
          api.getContinueWatching(20),
          api.getMovies(100),
          api.getSeries(100)
        ]);

        if (isMounted) {
          if (continueData.status === 'fulfilled') {
            setContinueWatching(continueData.value || []);
          }
          if (moviesData.status === 'fulfilled') {
            setMovies(moviesData.value || []);
          }
          if (seriesData.status === 'fulfilled') {
            setSeries(seriesData.value || []);
          }
        }
      } catch (err) {
        console.error('Error fetching home catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and sort items according to Steam library toolbar
  const displayedItems = useMemo(() => {
    let baseList: MediaItem[] = [];

    if (filterType === 'movies') {
      baseList = [...movies];
    } else if (filterType === 'series') {
      baseList = [...series];
    } else if (filterType === 'continue') {
      baseList = [...continueWatching];
    } else {
      // 'all': combine movies and series without duplicates
      const seen = new Set<string>();
      baseList = [];
      for (const m of movies) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          baseList.push(m);
        }
      }
      for (const s of series) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          baseList.push(s);
        }
      }
    }

    // Filter by title
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      baseList = baseList.filter((it) => it.name.toLowerCase().includes(q));
    }

    // Sort items
    return baseList.sort((a, b) => {
      if (sortBy === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'rating') {
        return (b.community_rating || 0) - (a.community_rating || 0);
      }
      // 'recent' by year or default
      return (b.year || 0) - (a.year || 0);
    });
  }, [filterType, movies, series, continueWatching, searchFilter, sortBy]);

  const allCount = movies.length + series.length;
  const hasNoMedia = continueWatching.length === 0 && movies.length === 0 && series.length === 0;

  if (loading && movies.length === 0 && series.length === 0) {
    return (
      <div class="min-h-[70vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div class="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-mono tracking-widest uppercase text-slate-500">Cargando biblioteca...</p>
      </div>
    );
  }

  return (
    <div class="pb-16 select-none max-w-7xl mx-auto px-3 sm:px-[4vw]">
      {/* ─── STEAM-STYLE LIBRARY HEADER TOOLBAR ─── */}
      <div class="pt-4 sm:pt-6 pb-4 border-b border-[#202d3d] mb-5 sm:mb-6">
        {/* Top line: Library Title + Counter + Search Filter */}
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div class="flex items-center gap-2.5">
            <h1 class="text-lg sm:text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2 font-sans">
              <span>Biblioteca</span>
              <span class="text-xs font-mono font-normal text-slate-400">
                ({displayedItems.length})
              </span>
            </h1>
          </div>

          {/* Quick Filter Search Input (Steam style) */}
          <div class="relative w-full sm:w-64">
            <input
              type="text"
              data-nav="item"
              value={searchFilter}
              onInput={(e) => setSearchFilter((e.target as HTMLInputElement).value)}
              placeholder="Filtrar por título..."
              class="w-full pl-8 pr-3 py-1.5 bg-[#141d27] border border-[#243547] rounded text-xs text-white placeholder-slate-500 outline-none focus:border-[#66c0f4] transition-colors"
            />
            <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                class="absolute right-2 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Secondary line: Filter Chips & Sort Selector */}
        <div class="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Category Filter Chips */}
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              data-nav="item"
              onClick={() => setFilterType('all')}
              class={`px-3 py-1 rounded text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                filterType === 'all'
                  ? 'bg-[#1b2838] text-cyan-300 border-[#384b61] font-bold'
                  : 'bg-[#121922] text-slate-400 border-[#1f2b38] hover:text-slate-200 hover:bg-[#16212e]'
              }`}
            >
              Todas ({allCount})
            </button>

            <button
              data-nav="item"
              onClick={() => setFilterType('movies')}
              class={`px-3 py-1 rounded text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                filterType === 'movies'
                  ? 'bg-[#1b2838] text-cyan-300 border-[#384b61] font-bold'
                  : 'bg-[#121922] text-slate-400 border-[#1f2b38] hover:text-slate-200 hover:bg-[#16212e]'
              }`}
            >
              Películas ({movies.length})
            </button>

            {series.length > 0 && (
              <button
                data-nav="item"
                onClick={() => setFilterType('series')}
                class={`px-3 py-1 rounded text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                  filterType === 'series'
                    ? 'bg-[#1b2838] text-cyan-300 border-[#384b61] font-bold'
                    : 'bg-[#121922] text-slate-400 border-[#1f2b38] hover:text-slate-200 hover:bg-[#16212e]'
                }`}
              >
                Series ({series.length})
              </button>
            )}

            {continueWatching.length > 0 && (
              <button
                data-nav="item"
                onClick={() => setFilterType('continue')}
                class={`px-3 py-1 rounded text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                  filterType === 'continue'
                    ? 'bg-[#1b2838] text-emerald-400 border-[#384b61] font-bold'
                    : 'bg-[#121922] text-slate-400 border-[#1f2b38] hover:text-slate-200 hover:bg-[#16212e]'
                }`}
              >
                Continuar viendo ({continueWatching.length})
              </button>
            )}
          </div>

          {/* Sort By Dropdown / Segmented Control */}
          <div class="flex items-center gap-1.5 text-xs text-slate-400">
            <span class="text-[11px] uppercase tracking-wider font-mono text-slate-500">Ordenar:</span>
            <div class="inline-flex rounded border border-[#243547] bg-[#121922] p-0.5">
              <button
                data-nav="item"
                onClick={() => setSortBy('recent')}
                class={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-[#223142] text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Recientes
              </button>
              <button
                data-nav="item"
                onClick={() => setSortBy('alpha')}
                class={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  sortBy === 'alpha'
                    ? 'bg-[#223142] text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                A-Z
              </button>
              <button
                data-nav="item"
                onClick={() => setSortBy('rating')}
                class={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  sortBy === 'rating'
                    ? 'bg-[#223142] text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ★ Puntuación
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EMPTY STATE ─── */}
      {hasNoMedia && (
        <div class="py-20 px-6 text-center max-w-md mx-auto text-slate-400 border border-[#223142] rounded bg-[#131b26] my-8">
          <div class="w-12 h-12 rounded bg-[#1a2533] border border-[#2d3e52] flex items-center justify-center mx-auto mb-3 text-cyan-400 text-xl">
            🎬
          </div>
          <h3 class="text-base font-bold text-white mb-1.5">Tu biblioteca está vacía</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-4">
            Agrega archivos a la carpeta <code class="text-cyan-400 bg-[#1e2a38] px-1 py-0.5 rounded">./media/movies</code> o busca y descarga títulos desde la pestaña de Torrents.
          </p>
        </div>
      )}

      {/* ─── CONTINUAR VIENDO SHELF (If in 'all' view with no search filter) ─── */}
      {continueWatching.length > 0 && filterType === 'all' && !searchFilter && (
        <section class="mb-8">
          <div class="flex items-center justify-between mb-3 pb-1 border-b border-[#1b2633]">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span>Continuar Viendo</span>
              <span class="text-slate-500 font-normal">({continueWatching.length})</span>
            </h2>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {continueWatching.map((item) => (
              <MediaCard
                key={`continue-${item.id}`}
                item={item}
                onSelect={(selected) => onPlay(selected, selected.playback_position_ticks)}
                aspect="poster"
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── STEAM CAPSULES GRID (MAIN LIBRARY) ─── */}
      {displayedItems.length > 0 && (
        <section>
          {continueWatching.length > 0 && filterType === 'all' && !searchFilter && (
            <div class="flex items-center justify-between mb-3 pb-1 border-b border-[#1b2633]">
              <h2 class="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Todos los títulos ({displayedItems.length})
              </h2>
            </div>
          )}

          {/* 
            Responsive Layout:
            - Mobile (< sm): 2 columns vertical grid, centered, scrolling down
            - Tablet & Desktop: Dense Steam-style capsule grid
          */}
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {displayedItems.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onSelect={onSelect}
                aspect="poster"
              />
            ))}
          </div>
        </section>
      )}

      {/* No results from search filter */}
      {displayedItems.length === 0 && !hasNoMedia && (
        <div class="py-16 text-center text-slate-400">
          <p class="text-sm font-semibold text-slate-300">No se encontraron títulos que coincidan con "{searchFilter}"</p>
          <button
            onClick={() => setSearchFilter('')}
            class="mt-3 px-3 py-1.5 rounded bg-[#1b2838] text-cyan-300 border border-[#384b61] text-xs font-semibold hover:bg-[#233347]"
          >
            Limpiar filtro
          </button>
        </div>
      )}
    </div>
  );
}
