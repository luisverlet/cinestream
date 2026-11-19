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
            // If no hero from API, use first movie as hero
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
      <div class="min-h-[70vh] flex flex-col items-center justify-center text-slate-400 gap-4">
        <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs tracking-wider uppercase font-mono">Cargando catálogo multimedia...</p>
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
        <div class="py-24 px-6 text-center max-w-lg mx-auto text-slate-400">
          <div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto mb-4 text-emerald-400 text-2xl">
            🎬
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Tu biblioteca está vacía</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-6">
            Agrega archivos <code class="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">.mp4</code> o <code class="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">.mkv</code> a la carpeta <code class="text-slate-300">./media/movies</code> o descarga contenido usando la pestaña de Torrents.
          </p>
        </div>
      )}

      {/* Rows Container */}
      <div class="space-y-4 -mt-6 sm:-mt-10 relative z-20">
        {/* Continuar Viendo Row */}
        {continueWatching.length > 0 && (
          <MediaRow
            title="Continuar Viendo"
            items={continueWatching}
            onSelect={(item) => onPlay(item, item.playback_position_ticks)}
            aspect="backdrop"
          />
        )}

        {/* Películas Disponibles Row */}
        {movies.length > 0 && (
          <MediaRow
            title="Películas"
            items={movies}
            onSelect={onSelect}
            aspect="poster"
          />
        )}

        {/* Series Row */}
        {series.length > 0 && (
          <MediaRow
            title="Series de TV"
            items={series}
            onSelect={onSelect}
            aspect="poster"
          />
        )}
      </div>
    </div>
  );
}

