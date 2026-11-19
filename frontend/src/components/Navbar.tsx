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
    <header class="sticky top-0 z-40 bg-[#090d16] border-b border-slate-800 px-3 sm:px-[4vw] py-2.5 sm:py-3 w-full max-w-full shadow-lg">
      <div class="flex items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <div
          class="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-none select-none"
          onClick={() => handleNavClick('home')}
        >
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-none">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 fill-current ml-0.5" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="text-base sm:text-lg font-black tracking-wider text-white">
              VERLET<span class="text-emerald-400">CINE</span>
            </span>
            <span class="hidden sm:block text-[10px] uppercase font-mono tracking-widest text-slate-400 -mt-1">
              Personal Streamer
            </span>
          </div>
        </div>

        {/* ─── DESKTOP & SMART TV NAVIGATION (>= md) ─── */}
        <nav class="hidden md:flex items-center gap-1.5 lg:gap-3 flex-none">
          {/* Inicio */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('home')}
            class={`px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              currentView === 'home'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Inicio
          </button>

          {/* Top 15 IMDb */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('top15')}
            class={`px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'top15'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                : 'text-amber-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Top 15 mejores películas por género y subgénero"
          >
            <span class="text-sm">⭐</span>
            <span>Top 15</span>
            <span class="font-mono text-[11px] opacity-80">IMDb</span>
          </button>

          {/* Mi Lista: Por Ver & Vistas */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('watchlist')}
            class={`px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'watchlist'
                ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-900/30'
                : 'text-purple-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Películas y series por ver y vistas (Multi-usuario)"
          >
            <span class="text-sm">🔖</span>
            <span>Mi Lista</span>
          </button>

          {/* Buscar & Torrents */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('search')}
            class={`px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'search'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Buscar</span>
            <span class="hidden lg:inline">& Torrents</span>
          </button>

          {/* Descargas */}
          <button
            data-nav="item"
            onClick={() => handleNavClick('downloads')}
            class={`relative px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'downloads'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Descargas</span>
            {downloadingCount > 0 && (
              <span class="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-400 text-slate-950 rounded-full animate-pulse ml-0.5">
                {downloadingCount}
              </span>
            )}
          </button>

          {/* Storage Badge */}
          {storageInfo && (
            <div
              class={`items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                storageInfo.is_critical
                  ? 'flex bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                  : storageInfo.is_low_space
                  ? 'flex bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'hidden xl:flex bg-slate-800/80 text-slate-300 border border-slate-700/50'
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
            class="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors ml-0.5 cursor-pointer"
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
              class="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-pulse cursor-pointer"
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
            <div class="px-2 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1">
              <span>⚠️</span>
              <span>{storageInfo.free_gb}G</span>
            </div>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            data-nav="item"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            class={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              isMobileMenuOpen
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800/90 text-slate-200 border-slate-700/80 hover:bg-slate-700 hover:text-white'
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
            class="fixed inset-0 top-[52px] sm:top-[57px] bg-black/85 z-40 md:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel with 100% Solid Opaque Background */}
          <div
            class="fixed top-[52px] sm:top-[57px] left-0 right-0 w-full bg-[#090d16] border-b border-slate-700 shadow-2xl z-50 md:hidden px-4 py-4 space-y-2.5 max-h-[calc(100vh-3.5rem)] overflow-y-auto"
          >
            {/* 1. Inicio */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('home')}
              class={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border shadow-sm ${
                currentView === 'home'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-[#131c2e] text-white border-slate-700/80 hover:bg-[#1a253c]'
              }`}
            >
              <div class="flex items-center gap-3">
                <div class={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  currentView === 'home' ? 'bg-black/20 text-slate-950' : 'bg-[#1d2942] border border-slate-700/60 text-emerald-400'
                }`}>
                  🏠
                </div>
                <div>
                  <div class="text-sm font-bold">Inicio</div>
                  <div class={`text-[11px] ${currentView === 'home' ? 'text-slate-950/80 font-medium' : 'text-slate-400'}`}>
                    Películas y series en biblioteca
                  </div>
                </div>
              </div>
              <span class="text-sm">→</span>
            </button>

            {/* 2. Top 15 IMDb */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('top15')}
              class={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border shadow-sm ${
                currentView === 'top15'
                  ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-lg shadow-amber-400/20'
                  : 'bg-[#131c2e] text-white border-slate-700/80 hover:bg-[#1a253c]'
              }`}
            >
              <div class="flex items-center gap-3">
                <div class={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  currentView === 'top15' ? 'bg-black/20 text-slate-950' : 'bg-[#1d2942] border border-slate-700/60 text-amber-300'
                }`}>
                  ⭐
                </div>
                <div>
                  <div class="text-sm font-bold flex items-center gap-1.5">
                    <span>Top 15 IMDb</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-400/20 border border-amber-400/30 text-amber-300 font-mono">
                      IMDb
                    </span>
                  </div>
                  <div class={`text-[11px] ${currentView === 'top15' ? 'text-slate-950/80 font-medium' : 'text-slate-400'}`}>
                    Mejores títulos por género y subgénero
                  </div>
                </div>
              </div>
              <span class="text-sm">→</span>
            </button>

            {/* 3. Mi Lista (Nano & Vane) */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('watchlist')}
              class={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border shadow-sm ${
                currentView === 'watchlist'
                  ? 'bg-purple-600 text-white font-bold border-purple-500 shadow-lg shadow-purple-900/30'
                  : 'bg-[#131c2e] text-white border-slate-700/80 hover:bg-[#1a253c]'
              }`}
            >
              <div class="flex items-center gap-3">
                <div class={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  currentView === 'watchlist' ? 'bg-black/20 text-white' : 'bg-[#1d2942] border border-slate-700/60 text-purple-300'
                }`}>
                  🔖
                </div>
                <div>
                  <div class="text-sm font-bold flex items-center gap-1.5">
                    <span>Mi Lista Personal</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold">
                      Multi-usuario
                    </span>
                  </div>
                  <div class={`text-[11px] ${currentView === 'watchlist' ? 'text-purple-100 font-medium' : 'text-slate-400'}`}>
                    Por Ver & Vistas con votos individuales
                  </div>
                </div>
              </div>
              <span class="text-sm">→</span>
            </button>

            {/* 4. Buscar & Torrents */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('search')}
              class={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border shadow-sm ${
                currentView === 'search'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-[#131c2e] text-white border-slate-700/80 hover:bg-[#1a253c]'
              }`}
            >
              <div class="flex items-center gap-3">
                <div class={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  currentView === 'search' ? 'bg-black/20 text-slate-950' : 'bg-[#1d2942] border border-slate-700/60 text-emerald-400'
                }`}>
                  🔍
                </div>
                <div>
                  <div class="text-sm font-bold">Buscar & Torrents</div>
                  <div class={`text-[11px] ${currentView === 'search' ? 'text-slate-950/80 font-medium' : 'text-slate-400'}`}>
                    Explora biblioteca y descarga torrents
                  </div>
                </div>
              </div>
              <span class="text-sm">→</span>
            </button>

            {/* 5. Descargas */}
            <button
              data-nav="item"
              onClick={() => handleNavClick('downloads')}
              class={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border shadow-sm ${
                currentView === 'downloads'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-[#131c2e] text-white border-slate-700/80 hover:bg-[#1a253c]'
              }`}
            >
              <div class="flex items-center gap-3">
                <div class={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                  currentView === 'downloads' ? 'bg-black/20 text-slate-950' : 'bg-[#1d2942] border border-slate-700/60 text-emerald-400'
                }`}>
                  📥
                </div>
                <div>
                  <div class="text-sm font-bold flex items-center gap-1.5">
                    <span>Descargas Activas</span>
                    {downloadingCount > 0 && (
                      <span class="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold font-mono">
                        {downloadingCount}
                      </span>
                    )}
                  </div>
                  <div class={`text-[11px] ${currentView === 'downloads' ? 'text-slate-950/80 font-medium' : 'text-slate-400'}`}>
                    {downloadingCount > 0 ? `${downloadingCount} descarga(s) en curso` : 'Estado y cola de descargas'}
                  </div>
                </div>
              </div>
              <span class="text-sm">→</span>
            </button>

            {/* 6. Storage Status Panel */}
            {storageInfo && (
              <div class="p-3 rounded-2xl bg-[#0e1422] border border-slate-700/90 text-xs space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 flex items-center gap-1.5 font-semibold">
                    <span>💾</span>
                    <span>Almacenamiento del Servidor:</span>
                  </span>
                  <span class="font-mono text-white font-bold">
                    {storageInfo.free_gb} GB libres ({storageInfo.total_gb} GB)
                  </span>
                </div>
                {/* Progress bar */}
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    class={`h-full rounded-full transition-all ${
                      storageInfo.is_critical
                        ? 'bg-rose-500'
                        : storageInfo.is_low_space
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
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
              class="w-full p-3 rounded-2xl bg-[#160f18] border border-rose-900/60 hover:bg-rose-950/40 text-rose-300 font-bold flex items-center justify-between text-left transition-all cursor-pointer text-xs shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-base">
                  🚪
                </div>
                <div>
                  <div class="text-sm font-bold text-rose-400">Cerrar Sesión</div>
                  <div class="text-[11px] text-slate-400">Salir de esta cuenta</div>
                </div>
              </div>
              <span class="text-sm">→</span>
            </button>
          </div>
        </>
      )}
    </header>
  );
}
