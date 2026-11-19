import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { storage } from './services/storage';
import { api } from './services/api';
import { MediaItem, ActiveTorrent, StorageInfo } from './types';
import { useSpatialNav } from './hooks/useSpatialNav';

// Views & Components
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { SearchCatalogView } from './views/SearchCatalogView';
import { ActiveDownloads } from './components/ActiveDownloads';
import { TopImdbView } from './views/TopImdbView';
import { WatchlistView } from './views/WatchlistView';
import { LoginView } from './views/LoginView';
import { MediaDetailModal } from './components/MediaDetailModal';
import { VideoPlayer } from './components/VideoPlayer';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!storage.getSession());
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'downloads' | 'top15' | 'watchlist'>('home');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [playingMedia, setPlayingMedia] = useState<{ item: MediaItem; ticks?: number } | null>(null);
  const [activeDownloads, setActiveDownloads] = useState<ActiveTorrent[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');
  const [catalogKey, setCatalogKey] = useState<number>(0);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  const fetchStorage = useCallback(async () => {
    try {
      const data = await api.getStorageInfo();
      setStorageInfo(data);
    } catch {
      // quiet background ping
    }
  }, []);

  const prevCompletedHashesRef = useRef<Set<string>>(new Set());
  const initialFetchRef = useRef<boolean>(true);

  // Periodic poll for active downloads and server storage
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchDownloads = async () => {
      try {
        const data = await api.getActiveTorrents();
        setActiveDownloads(data);

        // Detect newly finished downloads (transition to 100% or seeding states)
        const completed = new Set(
          data
            .filter(t => t.progress >= 100 || ['uploading', 'stalledUP', 'pausedUP', 'queuedUP', 'forcedUP'].includes(t.state))
            .map(t => t.hash.toLowerCase())
        );

        if (initialFetchRef.current) {
          prevCompletedHashesRef.current = completed;
          initialFetchRef.current = false;
        } else {
          let hasNewCompleted = false;
          for (const h of completed) {
            if (!prevCompletedHashesRef.current.has(h)) {
              hasNewCompleted = true;
              break;
            }
          }
          if (hasNewCompleted) {
            prevCompletedHashesRef.current = completed;
            fetchStorage();
            // Automatically refresh home catalog so the newly downloaded movie appears with poster immediately
            setTimeout(() => setCatalogKey(k => k + 1), 3500);
            setTimeout(() => setCatalogKey(k => k + 1), 8000);
          }
        }
      } catch {
        // quiet background
      }
    };
    fetchDownloads();
    fetchStorage();
    const interval = setInterval(() => {
      fetchDownloads();
      fetchStorage();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchStorage]);

  // Handle Remote Control "Back" key
  const handleNavBack = useCallback(() => {
    if (playingMedia) {
      setPlayingMedia(null);
      return;
    }
    if (selectedMedia) {
      setSelectedMedia(null);
      return;
    }
    if (currentView !== 'home') {
      setCurrentView('home');
      return;
    }
  }, [playingMedia, selectedMedia, currentView]);

  // Spatial Navigation Hook (active when not in video player)
  useSpatialNav({
    active: !playingMedia,
    onBack: handleNavBack
  });

  const handleLogout = () => {
    storage.clearSession();
    setIsAuthenticated(false);
    setSelectedMedia(null);
    setPlayingMedia(null);
  };

  const handlePlayMedia = (item: MediaItem, ticks?: number) => {
    setSelectedMedia(null);
    setPlayingMedia({ item, ticks });
  };

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div class="min-h-full w-full max-w-full flex flex-col bg-[#09090b] text-zinc-100 select-none overflow-x-hidden">
      {/* Global Low Storage Alert Banner */}
      {storageInfo && (storageInfo.is_critical || (storageInfo.is_low_space && !bannerDismissed)) && !playingMedia && (
        <div class={`px-4 sm:px-[4vw] py-2 text-xs font-mono flex items-center justify-between transition-colors z-50 w-full max-w-full border-b ${
          storageInfo.is_critical
            ? 'bg-rose-950/90 text-rose-200 border-rose-800'
            : 'bg-zinc-900 text-zinc-200 border-zinc-800'
        }`}>
          <div class="flex items-center gap-2">
            <span>{storageInfo.is_critical ? '●' : '○'}</span>
            <span>{storageInfo.warning_message}</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedMedia(null);
                setCurrentView('home');
              }}
              class="underline text-xs hover:text-white cursor-pointer"
            >
              Gestionar títulos
            </button>
            {!storageInfo.is_critical && (
              <button
                onClick={() => setBannerDismissed(true)}
                class="text-zinc-400 hover:text-white text-xs p-0.5 cursor-pointer"
                title="Descartar aviso temporalmente"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Header */}
      {!playingMedia && (
        <Navbar
          currentView={currentView}
          onNavigate={(view) => {
            setSelectedMedia(null);
            if (view === 'search') setSearchInitialQuery('');
            if (view === 'home') {
              // Refresh catalog data when clicking Inicio
              setCatalogKey((k) => k + 1);
            }
            setCurrentView(view);
          }}
          onLogout={handleLogout}
          activeDownloads={activeDownloads}
          storageInfo={storageInfo}
        />
      )}

      {/* Main Content Area */}
      <main class="flex-1 w-full max-w-full overflow-x-hidden">
        {currentView === 'home' && (
          <HomeView
            key={catalogKey}
            onPlay={handlePlayMedia}
            onSelect={(item) => setSelectedMedia(item)}
          />
        )}

        {currentView === 'search' && (
          <SearchCatalogView
            initialQuery={searchInitialQuery}
            onSelectLocalMedia={(item) => setSelectedMedia(item)}
            onNavigateToDownloads={() => setCurrentView('downloads')}
          />
        )}

        {currentView === 'downloads' && (
          <ActiveDownloads
            storageInfo={storageInfo}
            onPlayMedia={(item) => {
              handlePlayMedia(item);
            }}
          />
        )}

        {currentView === 'top15' && (
          <TopImdbView
            onSearchMovie={(title) => {
              setSelectedMedia(null);
              setSearchInitialQuery(title);
              setCurrentView('search');
            }}
          />
        )}

        {currentView === 'watchlist' && (
          <WatchlistView
            onSearchMovie={(title) => {
              setSelectedMedia(null);
              setSearchInitialQuery(title);
              setCurrentView('search');
            }}
          />
        )}
      </main>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <MediaDetailModal
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onPlay={handlePlayMedia}
          onReplaceMedia={(title) => {
            setSelectedMedia(null);
            setSearchInitialQuery(title);
            setCurrentView('search');
          }}
          onMediaDeleted={() => {
            setSelectedMedia(null);
            setCatalogKey((k) => k + 1);
            fetchStorage();
          }}
        />
      )}

      {/* Fullscreen Video Player */}
      {playingMedia && (
        <VideoPlayer
          itemId={playingMedia.item.id}
          title={playingMedia.item.name}
          initialTicks={playingMedia.ticks}
          onClose={() => setPlayingMedia(null)}
        />
      )}
    </div>
  );
}

