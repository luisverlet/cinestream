import { useRef } from 'preact/hooks';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  aspect?: 'poster' | 'backdrop';
}

export function MediaRow({ title, items, onSelect, aspect = 'poster' }: MediaRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section class="py-3 sm:py-4 select-none">
      <div class="px-3 sm:px-[4vw] flex items-center justify-between mb-2.5 sm:mb-3">
        <h3 class="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>{title}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-normal">
            {items.length}
          </span>
        </h3>

        {/* Carousel buttons for desktop mouse/remote users */}
        <div class="hidden md:flex items-center gap-1.5">
          <button
            data-nav-ignore="true"
            onClick={() => scroll('left')}
            class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Desplazar a la izquierda"
          >
            ←
          </button>
          <button
            data-nav-ignore="true"
            onClick={() => scroll('right')}
            class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Desplazar a la derecha"
          >
            →
          </button>
        </div>
      </div>

      {/* 
        Responsive Catalog Layout:
        - Mobile (< md): 2 columns vertical grid, centered, scrolling down ("de dos en dos, centradas, hacia abajo")
        - Desktop / Smart TV (>= md): Horizontal smooth-scroll carousel
      */}
      <div
        ref={scrollContainerRef}
        class="grid grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-[4vw] max-w-xl sm:max-w-2xl mx-auto md:max-w-none md:flex md:flex-row md:overflow-x-auto md:pb-3 md:no-scrollbar md:scroll-smooth"
      >
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onSelect={onSelect}
            aspect={aspect}
          />
        ))}
      </div>
    </section>
  );
}

