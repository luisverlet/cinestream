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

  // Close mobile menu on Escape key
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
    <header class="sticky top-0 z-40 bg-[#0e141d] border-b border-[#202d3d] px-3 sm:px-[4vw] py-2.5 sm:py-3 w-full max-w-full">
      <div class="flex items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <div
          class="flex items-center gap-2.5 cursor-pointer group flex-none select-none"
          onClick={() => handleNavClick('home')}
        >
          <div class="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded bg-[#162332] border border-[#2a3c52] flex items-center justify-center text-cyan-400 group-hover:border-[#66c0f4] transition-colors flex-none">
            <svg class="w-4 h-4 text-cyan-400 fill-current ml-0.5" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="text-base sm:text-lg font-black tracking-wider text-white">
              VERLET<span class="text-cyan-400">CINE</span>
            </span>
            <span class="hidden sm:block text-[9px] uppercase font-mono tracking-widest text-slate-500 -mt-1">
              Personal Streamer
            </span>
          </div>
        </div>

        {/* ─── DESKTOP & SMART TV NAVIGATION (>= md) ─── */}
        <nav class="hidden md:flex items-center gap-1.5 lg:gap-2.5 flex-none">
          {/* Inicio */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('home')}
            class={`px-3 py-1.5 rounded text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer border ${
              currentView === 'home'
                ? 'bg-[#1b2838] text-cyan-300 border-[#384b61] font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141e2b] border-transparent'
            }`}
          >
            Biblioteca
          </button>

          {/* Top 15 IMDb */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('top15')}
            class={`px-3 py-1.5 rounded text-xs md:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer border ${
              currentView === 'top15'
                ? 'bg-[#242618] text-amber-300 border-amber-600/50 font-bold'
                : 'text-amber-300 hover:text-white hover:bg-[#141e2b] border-transparent'
            }`}
            title="Top 15 mejores películas por género y subgénero"
          >
            <span class="text-xs">⭐</span>
            <span>Top 15</span>
            <span class="font-mono text-[11px] opacity-80">IMDb</span>
          </button>

          {/* Mi Lista: Por Ver & Vistas */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('watchlist')}
            class={`px-3 py-1.5 rounded text-xs md:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer border ${
              currentView === 'watchlist'
                ? 'bg-[#251a30] text-purple-300 border-purple-500/50 font-bold'
                : 'text-purple-300 hover:text-white hover:bg-[#141e2b] border-transparent'
            }`}
            title="Películas y series por ver y vistas (Multi-usuario)"
          >
            <span class="text-xs">🔖</span>
            <span>Mi Lista</span>
          </button>

          {/* Buscar & Torrents */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('search')}
            class={`px-3 py-1.5 rounded text-xs md:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer border ${
              currentView === 'search'
                ? 'bg-[#1b2838] text-cyan-300 border-[#384b61] font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141e2b] border-transparent'
            }`}
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Buscar</span>
            <span class="hidden lg:inline">& Torrents</span>
          </button>

          {/* Descargas */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('downloads')}
            class={`relative px-3 py-1.5 rounded text-xs md:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer border ${
              currentView === 'downloads'
                ? 'bg-[#1b2838] text-cyan-300 border-[#384b61] font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141e2b] border-transparent'
            }`}
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Descargas</span>
            {downloadingCount > 0 && (
              <span class="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-cyan-400 text-slate-950 rounded ml-0.5">
                {downloadingCount}
              </span>
            )}
          </button>

          {/* Storage Badge */}
          {storageInfo && (
            <div
              class={`items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium border ${
                storageInfo.is_critical
                  ? 'flex bg-rose-950/60 text-rose-300 border-rose-700/60'
                  : storageInfo.is_low_space
                  ? 'flex bg-amber-950/60 text-amber-300 border-amber-700/60'
                  : 'hidden xl:flex bg-[#141d27] text-slate-400 border-[#243547]'
              }`}
              title={`Almacenamiento: ${storageInfo.free_gb} GB libres de ${storageInfo.total_gb} GB (${storageInfo.used_percentage}% usado)`}
            >
              <span>{storageInfo.is_critical ? '⚠️' : storageInfo.is_low_space ? '⚠️' : '💾'}</span>
              <span>{storageInfo.free_gb} GB</span>
            </div>
          )}

          {/* Logout */}
          <button
            data-nav="item"
            onClick={handleLogoutClick}
            title="Cerrar sesión"
            class="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1a1215] transition-colors ml-0.5 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </nav>

        {/* ─── MOBILE CONTROLS (< md): QUICK ICONS + HAMBURGER BUTTON ─── */}
        <div class="flex md:hidden items-center gap-2">
          {/* Active downloads pill on mobile (direct shortcut) */}
          {downloadingCount > 0 && (
            <button
              data-nav="item"
              onClick={() => handleNavClick('downloads')}
              class="px-2.5 py-1.5 rounded bg-[#1a2b3c] border border-cyan-600/50 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Descargas activas"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span class="font-mono text-[11px] font-black">{downloadingCount}</span>
            </button>
          )}

          {/* Storage Alert on Mobile (only if low or critical) */}
          {storageInfo && (storageInfo.is_critical || storageInfo.is_low_space) && (
            <div class="px-2 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60 text-[11px] font-mono font-bold flex items-center gap-1">
              <span>⚠️</span>
              <span>{storageInfo.free_gb}G</span>
            </div>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            data-nav="item"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            class={`w-9 h-9 rounded flex items-center justify-center transition-colors cursor-pointer border ${
              isMobileMenuOpen
                ? 'bg-[#1b2838] text-cyan-300 border-[#384b61]'
                : 'bg-[#141d27] text-slate-300 border-[#243547] hover:bg-[#1a2533]'
            }`}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              /* Close Icon (✕) */
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger Icon (☰) */
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ─── MOBILE DRAWER & BACKDROP (< md) ─── */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop (Tapping closes menu) */}
          <div
            class="fixed inset-0 top-[52px] sm:top-[57px] bg-black/80 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel with Solid Opaque Steam-Style Background */}
          <div
            class="fixed top-[52px] sm:top-[57px] left-0 right-0 w-full bg-[#0e141d] border-b border-[#202d3d] z-50 md:hidden px-4 py-3.5 space-y-2 max-h-[calc(100vh-3.5rem)] overflow-y-auto"
          >
            {/* 1. Inicio */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('home')}
              class={`w-full p-2.5 rounded flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'home'
                  ? 'bg-[#1b2838] text-cyan-300 font-bold border-[#384b61]'
                  : 'bg-[#141d27] text-white border-[#243547] hover:bg-[#1a2533]'
              }`}
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded bg-[#1a2533] border border-[#2d3e52] flex items-center justify-center text-sm">
                  🏠
                </div>
                <div>
                  <div class="text-xs font-bold">Biblioteca</div>
                  <div class="text-[10px] text-slate-400">Películas y series</div>
                </div>
              </div>
              <span class="text-xs text-slate-500">→</span>
            </button>

            {/* 2. Top 15 IMDb */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('top15')}
              class={`w-full p-2.5 rounded flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'top15'
                  ? 'bg-[#242618] text-amber-300 font-bold border-amber-600/50'
                  : 'bg-[#141d27] text-white border-[#243547] hover:bg-[#1a2533]'
              }`}
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded bg-[#1a2533] border border-[#2d3e52] flex items-center justify-center text-sm text-amber-300">
                  ⭐
                </div>
                <div>
                  <div class="text-xs font-bold flex items-center gap-1.5">
                    <span>Top 15 IMDb</span>
                  </div>
                  <div class="text-[10px] text-slate-400">Por género y subgénero</div>
                </div>
              </div>
              <span class="text-xs text-slate-500">→</span>
            </button>

            {/* 3. Mi Lista */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('watchlist')}
              class={`w-full p-2.5 rounded flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'watchlist'
                  ? 'bg-[#251a30] text-purple-300 font-bold border-purple-500/50'
                  : 'bg-[#141d27] text-white border-[#243547] hover:bg-[#1a2533]'
              }`}
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded bg-[#1a2533] border border-[#2d3e52] flex items-center justify-center text-sm text-purple-300">
                  🔖
                </div>
                <div>
                  <div class="text-xs font-bold flex items-center gap-1.5">
                    <span>Mi Lista Personal</span>
                    <span class="text-[9px] px-1 py-0.2 rounded bg-purple-950 border border-purple-700/60 text-purple-300 font-mono">
                      Multi-usuario
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400">Por Ver & Vistas</div>
                </div>
              </div>
              <span class="text-xs text-slate-500">→</span>
            </button>

            {/* 4. Buscar & Torrents */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('search')}
              class={`w-full p-2.5 rounded flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'search'
                  ? 'bg-[#1b2838] text-cyan-300 font-bold border-[#384b61]'
                  : 'bg-[#141d27] text-white border-[#243547] hover:bg-[#1a2533]'
              }`}
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded bg-[#1a2533] border border-[#2d3e52] flex items-center justify-center text-sm text-cyan-400">
                  🔍
                </div>
                <div>
                  <div class="text-xs font-bold">Buscar & Torrents</div>
                  <div class="text-[10px] text-slate-400">Explorar y descargar</div>
                </div>
              </div>
              <span class="text-xs text-slate-500">→</span>
            </button>

            {/* 5. Descargas */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('downloads')}
              class={`w-full p-2.5 rounded flex items-center justify-between text-left transition-colors cursor-pointer border ${
                currentView === 'downloads'
                  ? 'bg-[#1b2838] text-cyan-300 font-bold border-[#384b61]'
                  : 'bg-[#141d27] text-white border-[#243547] hover:bg-[#1a2533]'
              }`}
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded bg-[#1a2533] border border-[#2d3e52] flex items-center justify-center text-sm text-cyan-400">
                  📥
                </div>
                <div>
                  <div class="text-xs font-bold flex items-center gap-1.5">
                    <span>Descargas</span>
                    {downloadingCount > 0 && (
                      <span class="px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 text-[10px] font-bold font-mono">
                        {downloadingCount}
                      </span>
                    )}
                  </div>
                  <div class="text-[10px] text-slate-400">
                    {downloadingCount > 0 ? `${downloadingCount} activa(s)` : 'Cola de descargas'}
                  </div>
                </div>
              </div>
              <span class="text-xs text-slate-500">→</span>
            </button>

            {/* 6. Storage Status Panel */}
            {storageInfo && (
              <div class="p-2.5 rounded bg-[#121922] border border-[#202d3d] text-xs space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-slate-400 flex items-center gap-1">
                    <span>💾</span>
                    <span>Disco:</span>
                  </span>
                  <span class="font-mono text-slate-300 font-bold">
                    {storageInfo.free_gb} GB libres ({storageInfo.total_gb} GB)
                  </span>
                </div>
                <div class="w-full h-1 bg-[#1e2a38] rounded-sm overflow-hidden">
                  <div
                    class={`h-full rounded-sm ${
                      storageInfo.is_critical
                        ? 'bg-rose-500'
                        : storageInfo.is_low_space
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, storageInfo.used_percentage))}%` }}
                  />
                </div>
              </div>
            )}

            {/* 7. Cerrar Sesión */}
            <button
              data-nav="item"
              onClick={handleLogoutClick}
              class="w-full p-2.5 rounded bg-[#171216] border border-rose-900/50 hover:bg-rose-950/40 text-rose-300 font-bold flex items-center justify-between text-left transition-colors cursor-pointer text-xs"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-sm">
                  🚪
                </div>
                <div>
                  <div class="text-xs font-bold text-rose-400">Cerrar Sesión</div>
                  <div class="text-[10px] text-slate-400">Salir de esta cuenta</div>
                </div>
              </div>
              <span class="text-xs text-slate-500">→</span>
            </button>
          </div>
        </>
      )}
    </header>
  );
}
