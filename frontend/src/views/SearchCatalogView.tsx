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
    setToastMessage(`Descarga iniciada: ${torrentTitle.slice(0, 32)}...`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDownloadError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  return (
    <div class="px-4 sm:px-[4vw] py-6 max-w-5xl mx-auto select-none">
      {/* Toast Success */}
      {toastMessage && (
        <div class="fixed top-14 right-5 z-50 bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs px-3.5 py-2 rounded-md shadow-xl flex items-center gap-2.5 font-mono">
          <span class="text-emerald-400">✓</span>
          <span>{toastMessage}</span>
          <button
            onClick={onNavigateToDownloads}
            class="ml-2 underline text-zinc-300 hover:text-white cursor-pointer"
          >
            Ver descargas
          </button>
        </div>
      )}

      {/* Toast Error */}
      {errorMessage && (
        <div class="fixed top-14 right-5 z-50 bg-zinc-950 border border-rose-800 text-rose-300 text-xs px-3.5 py-2 rounded-md shadow-xl flex items-center gap-2 font-mono">
          <span>✕</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} class="relative w-full mb-6">
        <div class="relative flex items-center">
          <input
            ref={inputRef}
            data-nav="item"
            data-nav-default="true"
            type="text"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder="Buscar por título en biblioteca y en la red..."
            class="w-full pl-10 pr-24 py-2.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm outline-none focus:border-zinc-500 transition-colors font-mono"
          />

          <svg
            class="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <button
            data-nav="item"
            type="submit"
            disabled={isSearching || !query.trim()}
            class="absolute right-1.5 px-3 py-1 bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 font-medium rounded text-xs transition-colors cursor-pointer shadow-sm"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {/* Loading state */}
      {isSearching && (
        <div class="py-16 text-center text-zinc-500 text-xs font-mono">
          Consultando servidor local e indexadores...
        </div>
      )}

      {!isSearching && hasSearched && (
        localResults.length === 0 && torrentResults.length === 0 ? (
          <div class="p-6 bg-zinc-950 border border-zinc-800 rounded-md text-center max-w-lg mx-auto my-6 space-y-3">
            <h4 class="text-sm font-semibold text-zinc-200">
              Sin coincidencias para "{query}"
            </h4>
            <p class="text-xs text-zinc-400 leading-relaxed">
              No se encontraron archivos en tu biblioteca ni torrents activos. Prueba buscando con el título original en inglés (ej: <em>"Inception"</em>, <em>"The Dark Knight"</em>) o simplificando a una palabra clave.
            </p>
          </div>
        ) : (
          <div class="space-y-8">
            {/* Section 1: Local Library Results */}
            <div>
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-sm font-semibold text-zinc-100">En tu servidor</h3>
                <span class="text-[11px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {localResults.length}
                </span>
              </div>

              {localResults.length > 0 ? (
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {localResults.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onSelect={onSelectLocalMedia}
                    />
                  ))}
                </div>
              ) : (
                <p class="text-xs text-zinc-500 py-2.5 px-3 rounded bg-zinc-950 border border-zinc-800 font-mono">
                  No hay copias descargadas en este momento. Consulta las opciones de descarga abajo.
                </p>
              )}
            </div>

            {/* Section 2: Torrents Results */}
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold text-zinc-100">Fuentes disponibles</h3>
                  <span class="text-[11px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {torrentResults.length}
                  </span>
                </div>
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
        <div class="py-16 text-center text-zinc-500 space-y-1">
          <p class="text-sm font-medium text-zinc-300">Búsqueda de títulos</p>
          <p class="text-xs text-zinc-500 max-w-sm mx-auto">
            Ingresa un nombre para buscar simultáneamente en tus archivos locales y en la red.
          </p>
        </div>
      )}
    </div>
  );
}
