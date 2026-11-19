import { useEffect, useState } from 'preact/hooks';
import { MediaItem } from '../types';
import { api } from '../services/api';
import { HeroBanner } from '../components/HeroBanner';
import { MediaRow } from '../components/MediaRow';

interface HomeViewProps {
  onPlay: (item: MediaItem, initialTicks?: number) => void;
  onSelect: (item: MediaItem) => void;
}

export function HomeView({ onPlay, onSelect }: HomeViewProps) {
  const [hero, setHero] = useState<MediaItem | null>(null);
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [heroData, continueData, moviesData, seriesData] = await Promise.allSettled([
          api.getHero(),
          api.getContinueWatching(12),
          api.getMovies(24),
          api.getSeries(24)
        ]);

        if (isMounted) {
          if (heroData.status === 'fulfilled' && heroData.value) {
            setHero(heroData.value);
          }
          if (continueData.status === 'fulfilled') {
            setContinueWatching(continueData.value);
          }
          if (moviesData.status === 'fulfilled') {
            setMovies(moviesData.value);
            if (!hero && moviesData.value.length > 0) {
              setHero(moviesData.value[0]);
            }
          }
          if (seriesData.status === 'fulfilled') {
            setSeries(seriesData.value);
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

  if (loading && !hero && movies.length === 0) {
    return (
      <div class="min-h-[60vh] flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div class="w-7 h-7 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-mono uppercase tracking-wider">Cargando biblioteca...</p>
      </div>
    );
  }

  const hasNoMedia = !hero && continueWatching.length === 0 && movies.length === 0 && series.length === 0;

  return (
    <div class="pb-16 select-none">
      {/* Hero Banner */}
      {hero && (
        <HeroBanner
          item={hero}
          onPlay={(item) => onPlay(item, item.playback_position_ticks)}
          onSelect={onSelect}
        />
      )}

      {hasNoMedia && (
        <div class="py-24 px-6 text-center max-w-md mx-auto text-zinc-400">
          <div class="w-12 h-12 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 class="text-base font-semibold text-zinc-100 mb-1">Biblioteca vacía</h3>
          <p class="text-xs text-zinc-400 leading-relaxed mb-4 max-w-sm mx-auto">
            Añade archivos <code class="text-zinc-200 bg-zinc-900 px-1 py-0.2 rounded border border-zinc-800">.mp4</code> o <code class="text-zinc-200 bg-zinc-900 px-1 py-0.2 rounded border border-zinc-800">.mkv</code> a la carpeta <code class="text-zinc-300">media/movies</code> o descarga títulos desde la pestaña Buscar.
          </p>
        </div>
      )}

      {/* Rows Container */}
      <div class="space-y-4 -mt-4 sm:-mt-8 relative z-20">
        {/* Continuar Viendo Row */}
        {continueWatching.length > 0 && (
          <MediaRow
            title="Continuar viendo"
            items={continueWatching}
            onSelect={(item) => onPlay(item, item.playback_position_ticks)}
            aspect="backdrop"
          />
        )}

        {/* Películas Disponibles Row */}
        {movies.length > 0 && (
          <MediaRow
            title="Películas disponibles"
            items={movies}
            onSelect={onSelect}
            aspect="poster"
          />
        )}

        {/* Series Row */}
        {series.length > 0 && (
          <MediaRow
            title="Series de televisión"
            items={series}
            onSelect={onSelect}
            aspect="poster"
          />
        )}
      </div>
    </div>
  );
}
