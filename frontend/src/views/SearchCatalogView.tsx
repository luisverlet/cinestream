import { useState, useRef, useEffect } from 'preact/hooks';
import { MediaItem, TorrentItem } from '../types';
import { api } from '../services/api';
import { MediaCard } from '../components/MediaCard';
import { TorrentResults } from '../components/TorrentResults';

interface SearchCatalogViewProps {
  onSelectLocalMedia: (item: MediaItem) => void;
  onNavigateToDownloads: () => void;
  initialQuery?: string;
}

export function SearchCatalogView({ onSelectLocalMedia, onNavigateToDownloads, initialQuery }: SearchCatalogViewProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [isSearching, setIsSearching] = useState(false);
  const [localResults, setLocalResults] = useState<MediaItem[]>([]);
  const [torrentResults, setTorrentResults] = useState<TorrentItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const executeSearch = async (searchTerm: string) => {
    const cleanQuery = searchTerm.trim();
    if (!cleanQuery) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Parallel search: Local Jellyfin media + Prowlarr torrents
      const [localRes, torrentRes] = await Promise.allSettled([
        api.searchLocal(cleanQuery),
        api.searchTorrents(cleanQuery)
      ]);

      if (localRes.status === 'fulfilled') {
        setLocalResults(localRes.value);
      } else {
        setLocalResults([]);
      }

      if (torrentRes.status === 'fulfilled') {
        setTorrentResults(torrentRes.value.results || []);
      } else {
        setTorrentResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery);
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [initialQuery]);

  const handleSearch = async (e?: Event) => {
    if (e) e.preventDefault();
    executeSearch(query);
  };

  const handleDownloadStarted = (torrentTitle: string) => {
    setToastMessage(`Descarga iniciada: ${torrentTitle.slice(0, 30)}...`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDownloadError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  return (
    <div class="px-[4vw] py-6 max-w-6xl mx-auto select-none">
      {/* Toast Success */}
      {toastMessage && (
        <div class="fixed top-16 right-6 z-50 bg-emerald-600 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400">
          <span>✓</span>
          <span class="text-xs">{toastMessage}</span>
          <button
            onClick={onNavigateToDownloads}
            class="ml-2 text-xs underline font-black text-slate-950 hover:text-white"
          >
            Ver descargas
          </button>
        </div>
      )}

      {/* Toast Error */}
      {errorMessage && (
        <div class="fixed top-16 right-6 z-50 bg-rose-600 text-white font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-rose-400">
          <span>✕</span>
          <span class="text-xs">{errorMessage}</span>
        </div>
      )}

      {/* Search Bar Form */}
      <form onSubmit={handleSearch} class="relative w-full mb-8">
        <div class="relative flex items-center">
          <input
            ref={inputRef}
            data-nav="item"
            data-nav-default="true"
            type="text"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder="Buscar películas o series en tu servidor o en Torrents..."
            class="w-full pl-12 pr-28 py-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm md:text-base outline-none shadow-xl transition-all focus:border-emerald-500"
          />

          <svg
            class="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <button
            data-nav="item"
            type="submit"
            disabled={isSearching || !query.trim()}
            class="absolute right-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs md:text-sm transition-all shadow-md shadow-emerald-500/20"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {/* Loading state */}
      {isSearching && (
        <div class="py-16 text-center text-slate-400">
          <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm font-medium">Buscando en tu biblioteca local y en la red de indexadores...</p>
        </div>
      )}

      {!isSearching && hasSearched && (
        localResults.length === 0 && torrentResults.length === 0 ? (
          <div class="p-6 bg-slate-900/90 border border-amber-500/40 rounded-2xl shadow-xl space-y-4 text-center max-w-2xl mx-auto my-6 animate-scale-up">
            <div class="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <div>
              <h4 class="text-base sm:text-lg font-bold text-white">
                No encontramos resultados para "{query}"
              </h4>
              <p class="text-xs text-slate-400 mt-1">
                No hay coincidencias en tu biblioteca local ni en los indexadores de torrents.
              </p>
            </div>

            <div class="bg-slate-800/60 rounded-xl p-4 text-left border border-slate-700/50 space-y-2">
              <p class="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span>💡</span> Consejos para encontrar tu película:
              </p>
              <ul class="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>
                  <strong>Prueba con el título original en inglés:</strong> Los torrents están catalogados mayormente en su título original (ej: busca <em>"Spider-Man"</em>, <em>"The Dark Knight"</em> o <em>"Dune"</em>).
                </li>
                <li>
                  <strong>Simplifica el término:</strong> Usa una o dos palabras clave principales (ej: <em>"Batman"</em> en vez de <em>"Batman La Película Completa"</em>).
                </li>
                <li>
                  <strong>Quita tildes, símbolos o subtítulos:</strong> Prueba palabras simples sin caracteres especiales.
                </li>
              </ul>
            </div>

            {/* Quick Retry Action if query has multiple words */}
            {query.trim().split(' ').length > 1 && (
              <button
                data-nav="item"
                onClick={() => {
                  const simplified = query.trim().split(' ')[0];
                  setQuery(simplified);
                  executeSearch(simplified);
                }}
                class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95"
              >
                Probar buscando solo "{query.trim().split(' ')[0]}"
              </button>
            )}
          </div>
        ) : (
        <div class="space-y-10">
          {/* Section 1: Local Library Results */}
          <div>
            <div class="flex items-center gap-2 mb-4">
              <h3 class="text-lg font-bold text-white">En tu Servidor Local</h3>
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                {localResults.length} encontrados
              </span>
            </div>

            {localResults.length > 0 ? (
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {localResults.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onSelect={onSelectLocalMedia}
                  />
                ))}
              </div>
            ) : (
              <p class="text-xs text-slate-400 py-3 bg-slate-900/50 rounded-xl px-4 border border-slate-800">
                No hay coincidencias en tu biblioteca local de Jellyfin. Consulta los resultados de torrents abajo para descargar.
              </p>
            )}
          </div>

          {/* Section 2: Torrents Results */}
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-bold text-white">Torrents Disponibles (Prowlarr)</h3>
                <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {torrentResults.length} indexados
                </span>
              </div>
              <span class="text-xs text-slate-400 hidden sm:inline">
                Descarga secuencial optimizada para reproducción rápida
              </span>
            </div>

            <TorrentResults
              results={torrentResults}
              onDownloadStarted={handleDownloadStarted}
              onDownloadError={handleDownloadError}
            />
          </div>
        </div>
        )
      )}

      {!hasSearched && (
        <div class="py-16 text-center text-slate-500">
          <svg class="w-14 h-14 mx-auto mb-3 opacity-30 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p class="text-base font-semibold text-slate-300">Explorador Multimedia Unificado</p>
          <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Escribe el título de cualquier película o serie. El sistema buscará primero en tus discos locales y, simultáneamente, en torrents limpios de alta velocidad.
          </p>
        </div>
      )}
    </div>
  );
}

