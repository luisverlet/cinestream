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
      class={`group relative rounded-md overflow-hidden cursor-pointer bg-zinc-900 border border-zinc-800/80 transition-colors duration-150 outline-none select-none w-full ${
        isWide ? 'aspect-video md:w-80 md:flex-none' : 'aspect-[2/3] md:w-44 md:flex-none'
      } hover:border-zinc-600 focus:border-zinc-200`}
    >
      {/* Poster / Backdrop Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          class="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div class="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-3 text-center border-b border-zinc-800">
          <svg class="w-6 h-6 mb-2 text-zinc-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <span class="text-xs font-medium text-zinc-400 line-clamp-2">{item.name}</span>
        </div>
      )}

      {/* Subtle Bottom Scrim for Title Legibility */}
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-85" />

      {/* Rating badge */}
      {item.community_rating && item.community_rating > 0 && (
        <div class="absolute top-2 right-2 bg-zinc-950/90 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-400 flex items-center gap-0.5">
          <span>★</span>
          <span>{item.community_rating.toFixed(1)}</span>
        </div>
      )}

      {/* Series badge */}
      {item.type === 'Series' && (
        <div class="absolute top-2 left-2 bg-zinc-950/90 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-zinc-300">
          Serie
        </div>
      )}

      {/* Bottom Information */}
      <div class="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 flex flex-col justify-end">
        <h4 class="text-xs sm:text-sm font-medium text-zinc-100 truncate tracking-tight">
          {item.name}
        </h4>
        <div class="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
          {item.year && <span>{item.year}</span>}
          {item.runtime_minutes && <span>{item.runtime_minutes}m</span>}
          {item.series_name && <span class="truncate">{item.series_name}</span>}
        </div>

        {/* Progress bar for Resume / Continue watching */}
        {item.progress_percentage !== undefined && item.progress_percentage > 0 && (
          <div class="mt-2 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-zinc-200 rounded-full"
              style={{ width: `${Math.min(100, item.progress_percentage)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
