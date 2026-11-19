import { MediaItem } from '../types';

interface HeroBannerProps {
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onSelect: (item: MediaItem) => void;
}

export function HeroBanner({ item, onPlay, onSelect }: HeroBannerProps) {
  const backdrop = item.backdrop_url || item.image_url;

  return (
    <div class="relative w-full h-[55vh] md:h-[65vh] min-h-[380px] max-h-[600px] overflow-hidden select-none">
      {/* Background Backdrop Image */}
      {backdrop ? (
        <img
          src={backdrop}
          alt={item.name}
          class="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.08] transition-transform duration-700 ease-out"
          loading="eager"
        />
      ) : (
        <div class="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-950" />
      )}

      {/* Multi-layered Gradients for Cinematic Look & TV readability */}
      <div class="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/40 to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-r from-[#090d16] via-[#090d16]/70 to-transparent w-full md:w-3/4" />

      {/* Content */}
      <div class="relative h-full flex flex-col justify-end px-[4vw] pb-8 md:pb-12 max-w-3xl">
        {/* Type / Tag */}
        <div class="flex items-center gap-2.5 mb-2">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
            {item.type === 'Movie' ? 'Película Destacada' : 'Serie Destacada'}
          </span>
          {item.year && (
            <span class="text-xs text-slate-300 font-semibold">{item.year}</span>
          )}
          {item.community_rating && (
            <span class="flex items-center text-xs text-amber-400 font-bold gap-1">
              ★ {item.community_rating.toFixed(1)}
            </span>
          )}
          {item.runtime_minutes && (
            <span class="text-xs text-slate-400">{item.runtime_minutes} min</span>
          )}
        </div>

        {/* Title */}
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight line-clamp-2 drop-shadow-md">
          {item.name}
        </h1>

        {/* Overview */}
        {item.overview && (
          <p class="mt-3 text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed drop-shadow">
            {item.overview}
          </p>
        )}

        {/* Action Buttons */}
        <div class="mt-6 flex items-center gap-3">
          <button
            data-nav="item"
            data-nav-default="true"
            onClick={() => onPlay(item)}
            class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-95"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Reproducir Ahora</span>
          </button>

          <button
            data-nav="item"
            onClick={() => onSelect(item)}
            class="px-5 py-3 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 backdrop-blur-md border border-slate-700/60"
          >
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Detalles</span>
          </button>
        </div>
      </div>
    </div>
  );
}

