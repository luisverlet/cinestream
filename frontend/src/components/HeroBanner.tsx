import { MediaItem } from '../types';

interface HeroBannerProps {
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onSelect: (item: MediaItem) => void;
}

export function HeroBanner({ item, onPlay, onSelect }: HeroBannerProps) {
  const backdrop = item.backdrop_url || item.image_url;

  return (
    <div class="relative w-full h-[50vh] md:h-[60vh] min-h-[360px] max-h-[560px] overflow-hidden select-none bg-zinc-950">
      {/* Background Backdrop Image */}
      {backdrop ? (
        <img
          src={backdrop}
          alt={item.name}
          class="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.55] contrast-[1.05]"
          loading="eager"
        />
      ) : (
        <div class="absolute inset-0 bg-zinc-900" />
      )}

      {/* Layered Vignettes for Text Legibility */}
      <div class="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/70 to-transparent w-full md:w-2/3" />

      {/* Content */}
      <div class="relative h-full flex flex-col justify-end px-4 sm:px-[4vw] pb-8 md:pb-12 max-w-3xl">
        {/* Meta Line */}
        <div class="flex items-center gap-2.5 mb-2.5 flex-wrap">
          <span class="px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-700/80">
            {item.type === 'Movie' ? 'Película' : 'Serie'}
          </span>
          {item.year && (
            <span class="text-xs text-zinc-400 font-mono">{item.year}</span>
          )}
          {item.community_rating && item.community_rating > 0 && (
            <span class="flex items-center text-xs text-amber-400 font-medium gap-1">
              ★ {item.community_rating.toFixed(1)}
            </span>
          )}
          {item.runtime_minutes && (
            <span class="text-xs text-zinc-400 font-mono">{item.runtime_minutes} min</span>
          )}
        </div>

        {/* Title */}
        <h1 class="text-2xl sm:text-4xl md:text-5xl font-semibold text-zinc-100 tracking-tight line-clamp-2">
          {item.name}
        </h1>

        {/* Overview */}
        {item.overview && (
          <p class="mt-2.5 text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed max-w-2xl font-normal">
            {item.overview}
          </p>
        )}

        {/* Action Buttons */}
        <div class="mt-5 flex items-center gap-2.5">
          <button
            data-nav="item"
            data-nav-default="true"
            onClick={() => onPlay(item)}
            class="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-md text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Reproducir</span>
          </button>

          <button
            data-nav="item"
            onClick={() => onSelect(item)}
            class="px-4 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 font-medium rounded-md text-xs sm:text-sm transition-colors flex items-center gap-2 border border-zinc-700/80 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ficha técnica</span>
          </button>
        </div>
      </div>
    </div>
  );
}
