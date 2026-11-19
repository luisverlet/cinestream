import { useState, useEffect, useCallback, useMemo } from 'preact/hooks';
import { api } from '../services/api';
import { WatchlistItem, UserRating } from '../types';

interface WatchlistViewProps {
  onSearchMovie: (title: string) => void;
}

const STORAGE_LAST_NICK_KEY = 'verlet_cine_last_nick';

const REACTION_OPTIONS = [
  { label: '💤 Se durmió', value: '💤 (Se durmió)' },
  { label: '🤢 Asco', value: '🤢 (Asco)' },
  { label: '❤️ Me encantó', value: '❤️ (Me encantó)' },
  { label: '😭 Lloré', value: '😭 (Lloré)' },
  { label: '🔥 Obra maestra', value: '🔥 (Obra maestra)' }
];

const STAR_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function WatchlistView({ onSearchMovie }: WatchlistViewProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plan_to_watch' | 'completed'>('completed');
  const [selectedType, setSelectedType] = useState<'all' | 'Movie' | 'Series'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active user memory (defaults to whatever was last saved in localStorage or Nano)
  const [activeUser, setActiveUser] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAST_NICK_KEY) || localStorage.getItem('cineluisverlet_last_nick');
      return (saved && saved.trim()) ? saved.trim() : 'Nano';
    } catch {
      return 'Nano';
    }
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [ratingModalItem, setRatingModalItem] = useState<WatchlistItem | null>(null);

  // Rating Modal Specific Form (starts with activeUser)
  const [ratingUser, setRatingUser] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAST_NICK_KEY) || localStorage.getItem('cineluisverlet_last_nick');
      return (saved && saved.trim()) ? saved.trim() : 'Nano';
    } catch {
      return 'Nano';
    }
  });
  const [selectedRating, setSelectedRating] = useState<number | null>(5.0);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  // Form states for Add/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formOriginalTitle, setFormOriginalTitle] = useState('');
  const [formType, setFormType] = useState<'Movie' | 'Series'>('Movie');
  const [formStatus, setFormStatus] = useState<'plan_to_watch' | 'completed'>('plan_to_watch');
  const [formYear, setFormYear] = useState<string>('');
  const [formImdbRating, setFormImdbRating] = useState<string>('');
  const [formNick, setFormNick] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAST_NICK_KEY) || localStorage.getItem('cineluisverlet_last_nick');
      return (saved && saved.trim()) ? saved.trim() : 'Nano';
    } catch {
      return 'Nano';
    }
  });
  const [formRating, setFormRating] = useState<number>(5);
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getWatchlist();
      setItems(data);
    } catch (err: any) {
      console.warn('Error loading watchlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectActiveUser = (nick: string) => {
    const trimmed = nick.trim() || 'Nano';
    setActiveUser(trimmed);
    setRatingUser(trimmed);
    setFormNick(trimmed);
    try {
      localStorage.setItem(STORAGE_LAST_NICK_KEY, trimmed);
    } catch { }
  };

  // Open multi-rating modal for a title
  const handleOpenRatingModal = (item: WatchlistItem, presetNick?: string) => {
    // Priority: explicit presetNick > current activeUser > localStorage > fallback
    let targetNick = presetNick || activeUser;
    if (!targetNick) {
      try {
        targetNick = localStorage.getItem(STORAGE_LAST_NICK_KEY) || 'Nano';
      } catch {
        targetNick = 'Nano';
      }
    }
    targetNick = targetNick.trim();

    setRatingModalItem(item);
    setRatingUser(targetNick);

    // Find existing rating for this user
    const existing = (item.ratings || []).find(
      (r) => r.user_nick.trim().toLowerCase() === targetNick.toLowerCase()
    );

    if (existing) {
      setSelectedRating(existing.rating !== undefined && existing.rating !== null ? existing.rating : null);
      setSelectedReaction(existing.reaction || null);
      setRatingComment(existing.comment || '');
    } else {
      setSelectedRating(5.0);
      setSelectedReaction(null);
      setRatingComment('');
    }
  };

  // When user switches inside rating modal (e.g. from Nano to Vane)
  const handleSwitchRatingUser = (newNick: string) => {
    selectActiveUser(newNick);

    if (!ratingModalItem) return;
    const existing = (ratingModalItem.ratings || []).find(
      (r) => r.user_nick.trim().toLowerCase() === newNick.trim().toLowerCase()
    );

    if (existing) {
      setSelectedRating(existing.rating !== undefined && existing.rating !== null ? existing.rating : null);
      setSelectedReaction(existing.reaction || null);
      setRatingComment(existing.comment || '');
    } else {
      setSelectedRating(5.0);
      setSelectedReaction(null);
      setRatingComment('');
    }
  };

  // Submit User Rating
  const handleSaveRating = async () => {
    if (!ratingModalItem || !ratingUser.trim()) return;

    try {
      setIsRatingSubmitting(true);
      selectActiveUser(ratingUser.trim());

      await api.rateWatchlistItem(ratingModalItem.id, {
        user_nick: ratingUser.trim(),
        rating: selectedRating !== null ? selectedRating : undefined,
        reaction: selectedReaction || undefined,
        comment: ratingComment.trim() || undefined
      });

      setRatingModalItem(null);
      await fetchItems();
    } catch (err: any) {
      alert('Error al guardar calificación: ' + (err.message || 'Error'));
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  // Delete User Rating
  const handleDeleteRating = async () => {
    if (!ratingModalItem || !ratingUser.trim()) return;
    if (!confirm(`¿Eliminar la calificación de ${ratingUser} para "${ratingModalItem.title}"?`)) return;

    try {
      setIsRatingSubmitting(true);
      await api.deleteUserRating(ratingModalItem.id, ratingUser.trim());
      setRatingModalItem(null);
      await fetchItems();
    } catch (err: any) {
      alert('Error al eliminar calificación: ' + (err.message || 'Error'));
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  // Open modal to add
  const handleOpenAddModal = (presetStatus?: 'plan_to_watch' | 'completed') => {
    setEditingItem(null);
    setFormTitle('');
    setFormOriginalTitle('');
    setFormType('Movie');
    setFormStatus(presetStatus || activeTab);
    setFormYear('');
    setFormImdbRating('');
    setFormNick(activeUser || 'Nano');
    setFormRating(5);
    setFormNotes('');
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  // Open modal to edit basic title info
  const handleOpenEditModal = (item: WatchlistItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormOriginalTitle(item.original_title || '');
    setFormType(item.type);
    setFormStatus(item.status);
    setFormYear(item.year ? String(item.year) : '');
    setFormImdbRating(item.imdb_rating ? String(item.imdb_rating) : '');
    setFormNick(activeUser || 'Nano');
    setFormRating(item.user_rating || 5);
    setFormNotes(item.notes || '');
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  // Submit Add or Edit
  const handleSaveItem = async (e: Event) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMsg('El título es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      if (formNick.trim()) {
        selectActiveUser(formNick);
      }

      const payload: Partial<WatchlistItem> = {
        title: formTitle.trim(),
        original_title: formOriginalTitle.trim() || undefined,
        type: formType,
        status: formStatus,
        year: formYear ? parseInt(formYear, 10) : undefined,
        imdb_rating: formImdbRating ? parseFloat(formImdbRating) : undefined,
        user_nick: formNick.trim() || undefined,
        user_rating: formStatus === 'completed' ? formRating : undefined,
        notes: formNotes.trim() || undefined
      };

      if (editingItem) {
        await api.updateWatchlistItem(editingItem.id, payload);
      } else {
        await api.addToWatchlist(payload);
      }

      setIsAddModalOpen(false);
      setEditingItem(null);
      await fetchItems();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el título');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick move to plan to watch
  const handleMoveToPlanToWatch = async (item: WatchlistItem) => {
    try {
      await api.updateWatchlistItem(item.id, {
        status: 'plan_to_watch'
      });
      await fetchItems();
    } catch (err: any) {
      alert('Error al mover a Por Ver: ' + (err.message || 'Error'));
    }
  };

  // Delete entire item
  const handleDeleteItem = async (item: WatchlistItem) => {
    if (!confirm(`¿Eliminar "${item.title}" de la lista?`)) return;
    try {
      await api.deleteWatchlistItem(item.id);
      await fetchItems();
    } catch (err: any) {
      alert('Error al eliminar: ' + (err.message || 'Error'));
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.status !== activeTab) return false;
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesOrig = (item.original_title || '').toLowerCase().includes(q);
        const matchesNick = (item.ratings || []).some((r) => r.user_nick.toLowerCase().includes(q)) ||
          (item.user_nick || '').toLowerCase().includes(q);
        const matchesReaction = (item.ratings || []).some((r) => (r.reaction || '').toLowerCase().includes(q));
        if (!matchesTitle && !matchesOrig && !matchesNick && !matchesReaction) return false;
      }
      return true;
    });
  }, [items, activeTab, selectedType, searchQuery]);

  // Counts
  const planToWatchCount = useMemo(() => items.filter((i) => i.status === 'plan_to_watch').length, [items]);
  const completedCount = useMemo(() => items.filter((i) => i.status === 'completed').length, [items]);

  return (
    <div class="px-3 sm:px-[4vw] py-5 sm:py-8 max-w-7xl mx-auto select-none w-full max-w-full overflow-x-hidden">
      {/* Header Banner */}
      <div class="mb-5 sm:mb-6 flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-[#202d3d] pb-4">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#1c1426] border border-purple-800/60 text-purple-300 text-[11px] font-bold mb-1.5 font-mono">
            <span>🔖 MI LISTA</span>
            <span class="text-slate-500">•</span>
            <span>Vane & Nano</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight font-sans">
            Colección de Títulos
          </h1>
          <p class="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Películas y series para ver juntos y vistas con calificaciones independientes.
          </p>
        </div>

        {/* User Switcher Pill & Add Button */}
        <div class="flex flex-wrap items-center gap-2.5">
          {/* Quick Active User Pill */}
          <div class="flex items-center gap-1 bg-[#141d27] border border-[#243547] p-1 rounded">
            <span class="text-xs text-slate-400 px-1.5 font-bold flex items-center gap-1">
              <span>👤</span>
              <span>Vota:</span>
            </span>
            <button
              data-nav="item"
              onClick={() => selectActiveUser('Nano')}
              class={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeUser.toLowerCase() === 'nano'
                  ? 'bg-[#251a30] text-purple-300 border border-purple-500/60 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nano
            </button>
            <button
              data-nav="item"
              onClick={() => selectActiveUser('Vane')}
              class={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeUser.toLowerCase() === 'vane'
                  ? 'bg-[#2c1422] text-pink-300 border border-pink-500/60 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vane
            </button>
          </div>

          {/* Action Button: Add new title */}
          <button
            data-nav="item"
            data-nav-default="true"
            onClick={() => handleOpenAddModal()}
            class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-500"
          >
            <span class="text-sm font-black">+</span>
            <span>Agregar Título</span>
          </button>
        </div>
      </div>

      {/* Main Tabs: VISTAS vs POR VER */}
      <div class="flex items-center gap-2 border-b border-[#202d3d] pb-3">
        <button
          data-nav="item"
          onClick={() => setActiveTab('completed')}
          class={`px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
            activeTab === 'completed'
              ? 'bg-[#13221b] text-emerald-300 border-emerald-600/60'
              : 'bg-[#141d27] hover:bg-[#192433] text-slate-400 border-[#243547]'
          }`}
        >
          <span>✓ Vistas</span>
          <span class="px-1.5 py-0.2 rounded bg-black/40 text-[11px] font-mono">
            {completedCount}
          </span>
        </button>

        <button
          data-nav="item"
          onClick={() => setActiveTab('plan_to_watch')}
          class={`px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
            activeTab === 'plan_to_watch'
              ? 'bg-[#251a30] text-purple-300 border-purple-600/60'
              : 'bg-[#141d27] hover:bg-[#192433] text-slate-400 border-[#243547]'
          }`}
        >
          <span>📌 Por Ver</span>
          <span class="px-1.5 py-0.2 rounded bg-black/40 text-[11px] font-mono">
            {planToWatchCount}
          </span>
        </button>
      </div>

      {/* Filters bar: Type + Search */}
      <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Type pills */}
        <div class="flex items-center gap-1.5">
          {(['all', 'Movie', 'Series'] as const).map((t) => {
            const isSelected = selectedType === t;
            const labels = { all: 'Todas', Movie: '🎬 Películas', Series: '📺 Series' };
            return (
              <button
                key={t}
                data-nav="item"
                onClick={() => setSelectedType(t)}
                class={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1b2838] text-cyan-300 font-bold border-[#384b61]'
                    : 'bg-[#141d27] hover:bg-[#192433] text-slate-400 border-[#243547]'
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Quick search input */}
        <div class="relative w-full sm:w-64">
          <input
            type="text"
            data-nav="item"
            placeholder="Filtrar por título, nick o reacción..."
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            class="w-full bg-[#141d27] border border-[#243547] rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#66c0f4] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div class="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs font-mono">Cargando títulos...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div class="mt-8 p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
          <span class="text-4xl">{activeTab === 'plan_to_watch' ? '📌' : '🎬'}</span>
          <h3 class="text-base font-bold text-white">
            {searchQuery
              ? 'No se encontraron títulos con ese filtro'
              : activeTab === 'plan_to_watch'
                ? 'No tienes títulos por ver en esta categoría'
                : 'Aún no has marcado títulos como vistos'}
          </h3>
          <p class="text-xs text-slate-400 max-w-sm">
            {activeTab === 'plan_to_watch'
              ? 'Agrega títulos que quieran ver o explora el Top 15 IMDb.'
              : 'Marca películas como vistas y califícalas con notas independientes.'}
          </p>
          <button
            data-nav="item"
            onClick={() => handleOpenAddModal()}
            class="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            + Agregar título ahora
          </button>
        </div>
      ) : (
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {filteredItems.map((item) => {
            const hasRatings = item.ratings && item.ratings.length > 0;
            const nanoVote = (item.ratings || []).find((r) => r.user_nick.toLowerCase() === 'nano');
            const vaneVote = (item.ratings || []).find((r) => r.user_nick.toLowerCase() === 'vane');

            const isVaneActive = activeUser.toLowerCase() === 'vane';
            const myVote = isVaneActive ? vaneVote : nanoVote;
            const partnerVote = isVaneActive ? nanoVote : vaneVote;
            const partnerName = isVaneActive ? 'Nano' : 'Vane';
            const myName = isVaneActive ? 'Vane' : 'Nano';

            return (
              <div
                key={item.id}
                class="group relative bg-[#141d27] border border-[#243547] hover:border-[#384b61] rounded-md p-3.5 sm:p-4 transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div class="flex items-start justify-between gap-2 mb-2.5">
                    <div class="flex flex-wrap items-center gap-1.5">
                      {/* Type Badge */}
                      <span class="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                        {item.type === 'Series' ? '📺 Serie' : '🎬 Película'}
                      </span>

                      {/* IN LIBRARY BADGE */}
                      {item.in_library && (
                        <span class="text-[10px] px-2 py-0.5 rounded-md font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span>✓</span>
                          <span>EN BIBLIOTECA</span>
                        </span>
                      )}
                    </div>

                    {/* Year & IMDb */}
                    <div class="flex items-center gap-2">
                      {item.year && (
                        <span class="text-[11px] text-slate-400 font-mono">
                          {item.year}
                        </span>
                      )}
                      {item.imdb_rating && (
                        <span class="inline-flex items-center gap-1 bg-amber-400/15 border border-amber-400/30 text-amber-300 font-black text-[11px] px-2 py-0.5 rounded-lg">
                          <span>⭐</span>
                          <span>{item.imdb_rating.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 class="text-base sm:text-lg font-bold text-white leading-snug group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>

                  {item.original_title && item.original_title !== item.title && (
                    <p class="text-xs text-slate-400 italic mt-0.5">
                      {item.original_title}
                    </p>
                  )}

                  {/* Multi-User Ratings Badges */}
                  <div class="mt-3 pt-2.5 border-t border-slate-800/80">
                    {hasRatings ? (
                      <div class="flex flex-wrap items-center gap-2">
                        {item.ratings!.map((r) => {
                          const isNano = r.user_nick.toLowerCase() === 'nano';
                          const isVane = r.user_nick.toLowerCase() === 'vane';
                          const badgeColor = isNano
                            ? 'bg-purple-950/60 border-purple-800/60 text-purple-300'
                            : isVane
                              ? 'bg-pink-950/60 border-pink-800/60 text-pink-300'
                              : 'bg-slate-950 border-slate-800 text-slate-300';

                          return (
                            <div
                              key={r.user_nick}
                              class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold shadow-sm ${badgeColor}`}
                            >
                              <span class="font-bold">👤 {r.user_nick}:</span>
                              {r.reaction ? (
                                <span class="text-amber-300 font-bold">{r.reaction}</span>
                              ) : r.rating !== undefined && r.rating !== null ? (
                                <span class="text-amber-400 font-black flex items-center gap-0.5">
                                  <span>★</span>
                                  <span>{r.rating}</span>
                                </span>
                              ) : (
                                <span class="text-slate-400">Visto</span>
                              )}
                              {r.comment && (
                                <span class="text-slate-400 text-[11px] italic" title={r.comment}>
                                  💬
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : item.status === 'completed' && item.user_rating ? (
                      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        {item.user_nick && <span class="text-purple-300 font-bold">👤 {item.user_nick}:</span>}
                        <span class="text-amber-400 font-bold">★ {item.user_rating}</span>
                      </div>
                    ) : (
                      <span class="text-slate-500 italic text-[11px]">
                        {item.status === 'plan_to_watch' ? '📌 Pendiente por ver' : 'Sin calificar'}
                      </span>
                    )}
                  </div>

                  {/* Notes / Comments */}
                  {item.notes && (
                    <p class="mt-2.5 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div class="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  {/* Calificar / Votar button - automatically geared to active user */}
                  <button
                    data-nav="item"
                    onClick={() => handleOpenRatingModal(item, activeUser)}
                    class={`flex-1 py-2 px-3 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${isVaneActive
                      ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-950/30'
                      : 'bg-purple-600 hover:bg-purple-500 shadow-purple-950/30'
                      }`}
                    title={`Calificar como ${myName}`}
                  >
                    <span>⭐</span>
                    <span>{myVote ? `Editar mi voto (${myName})` : `Calificar como ${myName}`}</span>
                  </button>

                  {/* Partner vote shortcut if partner hasn't voted yet */}
                  {!partnerVote && (
                    <button
                      data-nav="item"
                      onClick={() => handleOpenRatingModal(item, partnerName)}
                      class="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                      title={`Votar como ${partnerName}`}
                    >
                      <span class="text-[11px]">+ {partnerName}</span>
                    </button>
                  )}

                  {/* Move back to Por Ver if completed */}
                  {item.status === 'completed' && (
                    <button
                      data-nav="item"
                      onClick={() => handleMoveToPlanToWatch(item)}
                      class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors border border-slate-700 flex items-center justify-center cursor-pointer"
                      title="Mover a Por Ver"
                    >
                      ↩
                    </button>
                  )}

                  {/* Search in Torrents */}
                  <button
                    data-nav="item"
                    onClick={() => onSearchMovie(item.original_title || item.title)}
                    class="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs transition-colors border border-slate-700 flex items-center justify-center cursor-pointer"
                    title="Buscar en Torrents"
                  >
                    <svg class="w-4 h-4 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>

                  {/* Edit basic info */}
                  <button
                    data-nav="item"
                    onClick={() => handleOpenEditModal(item)}
                    class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors border border-slate-700 flex items-center justify-center cursor-pointer"
                    title="Editar detalles"
                  >
                    ✏️
                  </button>

                  {/* Delete */}
                  <button
                    data-nav="item"
                    onClick={() => handleDeleteItem(item)}
                    class="p-2 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-xl text-xs transition-colors border border-slate-700 flex items-center justify-center cursor-pointer"
                    title="Eliminar de la lista"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: CALIFICAR / VOTAR MULTI-USUARIO (Nano & Vane) ─── */}
      {ratingModalItem && (
        <div
          class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setRatingModalItem(null)}
        >
          <div
            class="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span>⭐ Calificar Título</span>
              </h3>
              <button
                data-nav="item"
                onClick={() => setRatingModalItem(null)}
                class="text-slate-400 hover:text-white p-1 text-sm rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Title Info */}
            <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <h4 class="text-base font-bold text-white">
                {ratingModalItem.title}
              </h4>
              {ratingModalItem.year && (
                <p class="text-xs text-slate-400 font-mono mt-0.5">
                  {ratingModalItem.year} • {ratingModalItem.type === 'Series' ? 'Serie' : 'Película'}
                </p>
              )}
            </div>

            {/* User Switcher Buttons */}
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">
                ¿Quién está votando?
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-nav="item"
                  onClick={() => handleSwitchRatingUser('Nano')}
                  class={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${ratingUser.toLowerCase() === 'nano'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                >
                  <span>👤</span>
                  <span>Nano</span>
                </button>

                <button
                  type="button"
                  data-nav="item"
                  onClick={() => handleSwitchRatingUser('Vane')}
                  class={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${ratingUser.toLowerCase() === 'vane'
                    ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-900/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                >
                  <span>👤</span>
                  <span>Vane</span>
                </button>
              </div>

              {/* Custom Nick input if someone else */}
              <div class="mt-2">
                <input
                  type="text"
                  data-nav="item"
                  placeholder="O escribe otro nombre (ej: Invitado)..."
                  value={ratingUser}
                  onInput={(e) => setRatingUser((e.target as HTMLInputElement).value)}
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Existing Votes of other users for reference */}
            {ratingModalItem.ratings && ratingModalItem.ratings.length > 0 && (
              <div class="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs">
                <span class="text-slate-400 text-[11px] block font-semibold mb-1">Votos actuales en este título:</span>
                <div class="flex flex-wrap gap-2">
                  {ratingModalItem.ratings.map((r) => (
                    <span
                      key={r.user_nick}
                      class="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px]"
                    >
                      <strong>{r.user_nick}:</strong> {r.reaction || (r.rating ? `★ ${r.rating}` : 'Visto')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Star Rating Grid */}
            <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-amber-300">
                  Calificación en estrellas:
                </label>
                <span class="text-xs font-mono text-amber-300 font-bold">
                  {selectedRating !== null ? `★ ${selectedRating} de 5` : 'Sin estrellas'}
                </span>
              </div>

              {/* Quick Star Buttons */}
              <div class="grid grid-cols-5 gap-1.5">
                {STAR_OPTIONS.map((val) => {
                  const isSelected = selectedRating === val && !selectedReaction;
                  return (
                    <button
                      type="button"
                      key={val}
                      data-nav="item"
                      onClick={() => {
                        setSelectedRating(val);
                        setSelectedReaction(null);
                      }}
                      class={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isSelected
                        ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                    >
                      ★ {val}
                    </button>
                  );
                })}
                <button
                  type="button"
                  data-nav="item"
                  onClick={() => {
                    setSelectedRating(6.0);
                    setSelectedReaction(null);
                  }}
                  class={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedRating === 6.0 && !selectedReaction
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800'
                    }`}
                  title="¡6 estrellas legendarias!"
                >
                  ★ 6!
                </button>
              </div>
            </div>

            {/* Fun Reactions Row */}
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">
                O una reacción especial:
              </label>
              <div class="flex flex-wrap gap-1.5">
                {REACTION_OPTIONS.map((react) => {
                  const isSelected = selectedReaction === react.value;
                  return (
                    <button
                      type="button"
                      key={react.value}
                      data-nav="item"
                      onClick={() => {
                        setSelectedReaction(isSelected ? null : react.value);
                        if (!isSelected) {
                          setSelectedRating(0.0);
                        }
                      }}
                      class={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${isSelected
                        ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                    >
                      {react.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment / Note */}
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">
                Comentario de {ratingUser} <span class="text-slate-500 font-normal">(Opcional)</span>:
              </label>
              <input
                type="text"
                data-nav="item"
                placeholder="Ej: Me encantó el final, muy recomendada..."
                value={ratingComment}
                onInput={(e) => setRatingComment((e.target as HTMLInputElement).value)}
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Modal Actions */}
            <div class="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
              {/* Delete rating button if this user has already voted */}
              {(ratingModalItem.ratings || []).some(
                (r) => r.user_nick.toLowerCase() === ratingUser.trim().toLowerCase()
              ) ? (
                <button
                  type="button"
                  data-nav="item"
                  onClick={handleDeleteRating}
                  disabled={isRatingSubmitting}
                  class="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Quitar mi voto
                </button>
              ) : <div></div>}

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-nav="item"
                  onClick={() => setRatingModalItem(null)}
                  class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  data-nav="item"
                  disabled={isRatingSubmitting}
                  onClick={handleSaveRating}
                  class="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/40 cursor-pointer disabled:opacity-50"
                >
                  {isRatingSubmitting ? 'Guardando...' : `Guardar voto de ${ratingUser}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: AGREGAR O EDITAR TÍTULO ─── */}
      {isAddModalOpen && (
        <div
          class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{editingItem ? '✏️ Editar Título' : '➕ Agregar a Mi Lista'}</span>
              </h3>
              <button
                data-nav="item"
                onClick={() => setIsAddModalOpen(false)}
                class="text-slate-400 hover:text-white p-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div class="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveItem} class="space-y-3.5">
              {/* Title */}
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">
                  Título <span class="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  data-nav="item"
                  required
                  placeholder="Ej: Interstellar, El Padrino, Breaking Bad..."
                  value={formTitle}
                  onInput={(e) => setFormTitle((e.target as HTMLInputElement).value)}
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Original Title (Optional) */}
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">
                  Título Original <span class="text-slate-500 font-normal">(Opcional, para búsquedas en inglés)</span>
                </label>
                <input
                  type="text"
                  data-nav="item"
                  placeholder="Ej: The Godfather"
                  value={formOriginalTitle}
                  onInput={(e) => setFormOriginalTitle((e.target as HTMLInputElement).value)}
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Type & Status selection */}
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Tipo</label>
                  <select
                    data-nav="item"
                    value={formType}
                    onChange={(e) => setFormType((e.target as HTMLSelectElement).value as any)}
                    class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Movie">🎬 Película</option>
                    <option value="Series">📺 Serie</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Lista destino</label>
                  <select
                    data-nav="item"
                    value={formStatus}
                    onChange={(e) => setFormStatus((e.target as HTMLSelectElement).value as any)}
                    class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="completed">✓ Vista</option>
                    <option value="plan_to_watch">📌 Por Ver</option>
                  </select>
                </div>
              </div>

              {/* Nick & Year */}
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">
                    Tu Nick:
                  </label>
                  <input
                    type="text"
                    data-nav="item"
                    placeholder="Ej: Nano, Vane..."
                    value={formNick}
                    onInput={(e) => setFormNick((e.target as HTMLInputElement).value)}
                    class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Año</label>
                  <input
                    type="number"
                    data-nav="item"
                    placeholder="Ej: 2024"
                    value={formYear}
                    onInput={(e) => setFormYear((e.target as HTMLInputElement).value)}
                    class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* IMDb rating (optional) */}
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">
                  Calificación IMDb <span class="text-slate-500 font-normal">(Opcional, 1.0 a 10.0)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  data-nav="item"
                  placeholder="Ej: 8.8"
                  value={formImdbRating}
                  onInput={(e) => setFormImdbRating((e.target as HTMLInputElement).value)}
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* Star Rating (1 to 5) - shown especially if completed */}
              {formStatus === 'completed' && (
                <div class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <label class="block text-xs font-bold text-amber-300 mb-1.5 flex items-center justify-between">
                    <span>Calificación de {formNick || 'usuario'}:</span>
                    <span class="font-mono text-sm font-black">{formRating} / 5 estrellas</span>
                  </label>
                  <div class="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        data-nav="item"
                        onClick={() => setFormRating(star)}
                        class={`text-2xl sm:text-3xl transition-transform hover:scale-125 cursor-pointer ${star <= formRating ? 'text-amber-400' : 'text-slate-700'
                          }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">
                  Comentario o nota <span class="text-slate-500 font-normal">(Opcional)</span>
                </label>
                <textarea
                  data-nav="item"
                  rows={2}
                  placeholder="Opinión rápida o motivo para verla..."
                  value={formNotes}
                  onInput={(e) => setFormNotes((e.target as HTMLTextAreaElement).value)}
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div class="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  data-nav="item"
                  onClick={() => setIsAddModalOpen(false)}
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-nav="item"
                  disabled={isSubmitting}
                  class="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-purple-900/40"
                >
                  {isSubmitting ? 'Guardando...' : editingItem ? 'Actualizar' : 'Guardar en Mi Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
