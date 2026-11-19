import { MediaItem } from '../types';

interface MediaCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  aspect?: 'poster' | 'backdrop';
}

export function MediaCard({ item, onSelect, aspect = 'poster' }: MediaCardProps) {
  const imageUrl = aspect === 'backdrop'
    ? (item.backdrop_url || item.image_url)
    : (item.image_url || item.backdrop_url);

  const isWide = aspect === 'backdrop';

  return (
    <div
      data-nav="item"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      class={`group relative rounded-xl overflow-hidden cursor-pointer bg-slate-900 border border-slate-800/80 transition-all duration-200 outline-none select-none w-full ${
        isWide ? 'aspect-video md:w-80 md:flex-none' : 'aspect-[2/3] md:w-48 md:flex-none'
      } hover:ring-2 hover:ring-emerald-400 hover:scale-105 focus:ring-2 focus:ring-emerald-400 focus:scale-105 focus:z-20`}
    >
      {/* Poster / Backdrop Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div class="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500 p-3 text-center">
          <svg class="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <span class="text-xs font-semibold text-slate-400 line-clamp-2">{item.name}</span>
        </div>
      )}

      {/* Gradient Vignette */}
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

      {/* Rating badge */}
      {item.community_rating && item.community_rating > 0 && (
        <div class="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-bold text-amber-400 flex items-center gap-0.5 border border-amber-500/20">
          <span>★</span>
          <span>{item.community_rating.toFixed(1)}</span>
        </div>
      )}

      {/* Series badge */}
      {item.type === 'Series' && (
        <div class="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
          SERIE
        </div>
      )}

      {/* Bottom Information */}
      <div class="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-end">
        <h4 class="text-xs sm:text-sm font-bold text-white truncate drop-shadow-md">
          {item.name}
        </h4>
        <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
          {item.year && <span>{item.year}</span>}
          {item.runtime_minutes && <span>{item.runtime_minutes}m</span>}
          {item.series_name && <span class="truncate">{item.series_name}</span>}
        </div>

        {/* Progress bar for Resume / Continue watching */}
        {item.progress_percentage !== undefined && item.progress_percentage > 0 && (
          <div class="mt-2 w-full h-1 bg-slate-700/80 rounded-full overflow-hidden">
            <div
              class="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, item.progress_percentage)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

