import { useState, useEffect } from 'preact/hooks';
import { ActiveTorrent, StorageInfo } from '../types';

interface NavbarProps {
  currentView: 'home' | 'search' | 'downloads' | 'top15' | 'watchlist';
  onNavigate: (view: 'home' | 'search' | 'downloads' | 'top15' | 'watchlist') => void;
  onLogout: () => void;
  activeDownloads: ActiveTorrent[];
  storageInfo?: StorageInfo | null;
}

export function Navbar({ currentView, onNavigate, onLogout, activeDownloads, storageInfo }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const downloadingCount = activeDownloads.filter((t) => t.progress < 100).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleNavClick = (view: 'home' | 'search' | 'downloads' | 'top15' | 'watchlist') => {
    setIsMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    onLogout();
  };

  return (
    <header class="sticky top-0 z-40 bg-[#09090b] border-b border-zinc-800/90 px-4 sm:px-[4vw] py-2.5 sm:py-3 w-full max-w-full">
      <div class="flex items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <div
          class="flex items-center gap-2.5 cursor-pointer group flex-none select-none"
          onClick={() => handleNavClick('home')}
        >
          <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 flex-none group-hover:border-zinc-500 transition-colors">
            <svg class="w-3.5 h-3.5 fill-current ml-0.5 text-zinc-200" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-sm sm:text-base font-semibold tracking-tight text-zinc-100">
              Verlet Cine
            </span>
            <span class="hidden sm:inline text-[11px] font-mono text-zinc-500 tracking-normal">
              streamer
            </span>
          </div>
        </div>

        {/* ─── DESKTOP & SMART TV NAVIGATION (>= md) ─── */}
        <nav class="hidden md:flex items-center gap-1 flex-none bg-zinc-950/80 p-1 rounded-lg border border-zinc-800/70">
          {/* Inicio */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('home')}
            class={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              currentView === 'home'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            Inicio
          </button>

          {/* Top 15 IMDb */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('top15')}
            class={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentView === 'top15'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
            title="Top 15 por género y subgénero"
          >
            <span>Top 15</span>
            <span class="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-1 py-0.2 rounded border border-zinc-800">
              IMDb
            </span>
          </button>

          {/* Mi Lista */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('watchlist')}
            class={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentView === 'watchlist'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
            title="Películas y series por ver y vistas"
          >
            <span>Mi Lista</span>
          </button>

          {/* Buscar & Torrents */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('search')}
            class={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentView === 'search'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Buscar</span>
          </button>

          {/* Descargas */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('downloads')}
            class={`relative px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentView === 'downloads'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Descargas</span>
            {downloadingCount > 0 && (
              <span class="px-1.5 py-0.2 text-[10px] font-mono font-medium bg-zinc-700 text-zinc-100 rounded ml-0.5 border border-zinc-600">
                {downloadingCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right side controls: Storage + Logout */}
        <div class="hidden md:flex items-center gap-2">
          {storageInfo && (
            <div
              class={`items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-normal transition-colors border ${
                storageInfo.is_critical
                  ? 'flex bg-rose-950/40 text-rose-300 border-rose-800/80'
                  : storageInfo.is_low_space
                  ? 'flex bg-amber-950/40 text-amber-300 border-amber-800/80'
                  : 'hidden xl:flex bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
              title={`Disco: ${storageInfo.free_gb} GB libres de ${storageInfo.total_gb} GB (${storageInfo.used_percentage}% ocupado)`}
            >
              <span class="text-[10px] text-zinc-500 uppercase">Disco</span>
              <span class="text-zinc-200">{storageInfo.free_gb} GB</span>
            </div>
          )}

          <button
            data-nav="item"
            onClick={handleLogoutClick}
            title="Cerrar sesión"
            class="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* ─── MOBILE CONTROLS (< md) ─── */}
        <div class="flex md:hidden items-center gap-2">
          {downloadingCount > 0 && (
            <button
              data-nav="item"
              onClick={() => handleNavClick('downloads')}
              class="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              title="Descargas activas"
            >
              <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span class="font-mono text-[11px]">{downloadingCount}</span>
            </button>
          )}

          {storageInfo && (storageInfo.is_critical || storageInfo.is_low_space) && (
            <div class="px-2 py-1 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/80 text-[11px] font-mono flex items-center gap-1">
              <span>{storageInfo.free_gb}G</span>
            </div>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            data-nav="item"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            class={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${
              isMobileMenuOpen
                ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
            }`}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ─── MOBILE DRAWER & BACKDROP (< md) ─── */}
      {isMobileMenuOpen && (
        <>
          <div
            class="fixed inset-0 top-[49px] bg-black/75 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div
            class="fixed top-[49px] left-0 right-0 w-full bg-[#09090b] border-b border-zinc-800 shadow-xl z-50 md:hidden px-4 py-3 space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto"
          >
            {/* Inicio */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('home')}
              class={`w-full p-2.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'home'
                  ? 'bg-zinc-900 text-zinc-100 font-medium border-zinc-700'
                  : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900/60 hover:text-zinc-200'
              }`}
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-mono text-zinc-500">01</span>
                <span class="text-sm">Inicio</span>
              </div>
              <span class="text-xs text-zinc-600 font-mono">Biblioteca</span>
            </button>

            {/* Top 15 IMDb */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('top15')}
              class={`w-full p-2.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'top15'
                  ? 'bg-zinc-900 text-zinc-100 font-medium border-zinc-700'
                  : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900/60 hover:text-zinc-200'
              }`}
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-mono text-zinc-500">02</span>
                <span class="text-sm">Top 15 IMDb</span>
              </div>
              <span class="text-xs text-zinc-600 font-mono">Por géneros</span>
            </button>

            {/* Mi Lista */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('watchlist')}
              class={`w-full p-2.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'watchlist'
                  ? 'bg-zinc-900 text-zinc-100 font-medium border-zinc-700'
                  : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900/60 hover:text-zinc-200'
              }`}
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-mono text-zinc-500">03</span>
                <span class="text-sm">Mi Lista</span>
              </div>
              <span class="text-xs text-zinc-600 font-mono">Por ver & Vistas</span>
            </button>

            {/* Buscar & Torrents */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('search')}
              class={`w-full p-2.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'search'
                  ? 'bg-zinc-900 text-zinc-100 font-medium border-zinc-700'
                  : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900/60 hover:text-zinc-200'
              }`}
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-mono text-zinc-500">04</span>
                <span class="text-sm">Buscar catálogo</span>
              </div>
              <span class="text-xs text-zinc-600 font-mono">Local & Red</span>
            </button>

            {/* Descargas */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('downloads')}
              class={`w-full p-2.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'downloads'
                  ? 'bg-zinc-900 text-zinc-100 font-medium border-zinc-700'
                  : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900/60 hover:text-zinc-200'
              }`}
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-mono text-zinc-500">05</span>
                <span class="text-sm">Descargas</span>
              </div>
              {downloadingCount > 0 ? (
                <span class="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700 rounded">
                  {downloadingCount} activas
                </span>
              ) : (
                <span class="text-xs text-zinc-600 font-mono">Inactivo</span>
              )}
            </button>

            {/* Storage indicator */}
            {storageInfo && (
              <div class="pt-3 pb-1 px-1 border-t border-zinc-800/80">
                <div class="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1.5">
                  <span>Almacenamiento servidor</span>
                  <span class="text-zinc-200">{storageInfo.free_gb} GB libres</span>
                </div>
                <div class="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    class={`h-full rounded-full ${
                      storageInfo.is_critical
                        ? 'bg-rose-500'
                        : storageInfo.is_low_space
                        ? 'bg-amber-400'
                        : 'bg-zinc-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, storageInfo.used_percentage))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Logout */}
            <div class="pt-2 border-t border-zinc-800/80">
              <button
                data-nav="item"
                onClick={handleLogoutClick}
                class="w-full p-2.5 rounded-md text-left text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors text-xs font-medium flex items-center justify-between cursor-pointer"
              >
                <span>Cerrar sesión</span>
                <span class="text-xs font-mono text-zinc-600">Salir →</span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
