import { useState, useEffect, useCallback, useMemo } from 'preact/hooks';
import { api } from '../services/api';
import { WatchlistItem, UserRating } from '../types';

interface WatchlistViewProps {
  onSearchMovie: (title: string) => void;
}

const STORAGE_LAST_NICK_KEY = 'verlet_cine_last_nick';

const REACTION_OPTIONS = [
  { label: '💤 Se durmió', value: '💤 (Se durmió)' },
  { label: '🤢 Regular', value: '🤢 (Regular)' },
  { label: '❤️ Me encantó', value: '❤️ (Me encantó)' },
  { label: '😭 Emotiva', value: '😭 (Emotiva)' },
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
    } catch {
      // quiet
    }
  };

  // Open Rating modal
  const handleOpenRatingModal = (item: WatchlistItem, presetNick?: string) => {
    setRatingModalItem(item);
    let targetNick = presetNick;
    if (!targetNick) {
      try {
        targetNick = localStorage.getItem(STORAGE_LAST_NICK_KEY) || 'Nano';
      } catch {
        targetNick = 'Nano';
      }
    }
    setRatingUser(targetNick);

    // Look for existing rating of this user
    const existing = (item.ratings || []).find(
      (r) => r.user_nick.toLowerCase() === targetNick!.trim().toLowerCase()
    );
    if (existing) {
      setSelectedRating(existing.rating !== undefined ? existing.rating : null);
      setSelectedReaction(existing.reaction || null);
      setRatingComment(existing.comment || '');
    } else {
      setSelectedRating(5.0);
      setSelectedReaction(null);
      setRatingComment('');
    }
  };

  const handleSwitchRatingUser = (newNick: string) => {
    setRatingUser(newNick);
    selectActiveUser(newNick);
    if (!ratingModalItem) return;
    const existing = (ratingModalItem.ratings || []).find(
      (r) => r.user_nick.toLowerCase() === newNick.trim().toLowerCase()
    );
    if (existing) {
      setSelectedRating(existing.rating !== undefined ? existing.rating : null);
      setSelectedReaction(existing.reaction || null);
      setRatingComment(existing.comment || '');
    } else {
      setSelectedRating(5.0);
      setSelectedReaction(null);
      setRatingComment('');
    }
  };

  // Save rating
  const handleSaveRating = async () => {
    if (!ratingModalItem) return;
    const cleanNick = ratingUser.trim() || 'Nano';
    selectActiveUser(cleanNick);
    try {
      setIsRatingSubmitting(true);
      await api.rateWatchlistItem(ratingModalItem.id, {
        user_nick: cleanNick,
        rating: selectedRating !== null ? selectedRating : undefined,
        reaction: selectedReaction || undefined,
        comment: ratingComment.trim() || undefined
      });
      setRatingModalItem(null);
      await fetchItems();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error al guardar calificación'));
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  // Delete specific rating
  const handleDeleteRating = async () => {
    if (!ratingModalItem) return;
    const cleanNick = ratingUser.trim() || 'Nano';
    try {
      setIsRatingSubmitting(true);
      await api.deleteUserRating(ratingModalItem.id, cleanNick);
      setRatingModalItem(null);
      await fetchItems();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error al eliminar calificación'));
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  // Move item between statuses
  const handleToggleStatus = async (item: WatchlistItem) => {
    const nextStatus = item.status === 'completed' ? 'plan_to_watch' : 'completed';
    try {
      await api.updateWatchlistItem(item.id, { status: nextStatus });
      await fetchItems();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error al cambiar estado'));
    }
  };

  // Delete whole item
  const handleDeleteItem = async (item: WatchlistItem) => {
    if (!confirm(`¿Eliminar "${item.title}" de tu lista?`)) return;
    try {
      await api.deleteWatchlistItem(item.id);
      await fetchItems();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error al eliminar'));
    }
  };

  // Open modal for new item
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

  // Open modal for editing
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

  // Save add/edit item
  const handleSaveItem = async (e: Event) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMsg('El título es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const parsedYear = formYear.trim() ? parseInt(formYear.trim(), 10) : undefined;
      const parsedImdb = formImdbRating.trim() ? parseFloat(formImdbRating.trim()) : undefined;
      const cleanNick = formNick.trim() || activeUser || 'Nano';
      selectActiveUser(cleanNick);

      if (editingItem) {
        await api.updateWatchlistItem(editingItem.id, {
          title: formTitle.trim(),
          original_title: formOriginalTitle.trim() || undefined,
          type: formType,
          status: formStatus,
          year: parsedYear,
          imdb_rating: parsedImdb,
          user_rating: formStatus === 'completed' ? formRating : undefined,
          user_nick: cleanNick,
          notes: formNotes.trim() || undefined
        });
      } else {
        await api.addToWatchlist({
          title: formTitle.trim(),
          original_title: formOriginalTitle.trim() || undefined,
          type: formType,
          status: formStatus,
          year: parsedYear,
          imdb_rating: parsedImdb,
          user_rating: formStatus === 'completed' ? formRating : undefined,
          user_nick: cleanNick,
          notes: formNotes.trim() || undefined
        });
      }

      setIsAddModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered items
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
    <div class="px-4 sm:px-[4vw] py-6 max-w-6xl mx-auto select-none w-full max-w-full overflow-x-hidden">
      {/* Header Banner */}
      <div class="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-2">
            <span>Colección personal</span>
            <span class="text-zinc-600">/</span>
            <span class="text-zinc-400">Multi-usuario</span>
          </div>
          <h1 class="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-100 tracking-tight">
            Mi Lista de Títulos
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Organiza películas y series vistas o por ver. Calificaciones independientes para cada perfil.
          </p>
        </div>

        {/* User Switcher & Add Button */}
        <div class="flex flex-wrap items-center gap-2">
          {/* Active User Segmented Toggle */}
          <div class="inline-flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-md">
            <span class="text-[11px] font-mono text-zinc-400 px-2 uppercase">Perfil:</span>
            <button
              data-nav="item"
              onClick={() => selectActiveUser('Nano')}
              class={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeUser.toLowerCase() === 'nano'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Nano
            </button>
            <button
              data-nav="item"
              onClick={() => selectActiveUser('Vane')}
              class={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeUser.toLowerCase() === 'vane'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200'
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
            class="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-md text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <span>+</span>
            <span>Añadir título</span>
          </button>
        </div>
      </div>

      {/* Main Tabs: VISTAS vs POR VER */}
      <div class="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <div class="inline-flex p-0.5 bg-zinc-950 border border-zinc-800 rounded-md">
          <button
            data-nav="item"
            onClick={() => setActiveTab('completed')}
            class={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Vistas</span>
            <span class="px-1.5 py-0.2 rounded font-mono text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400">
              {completedCount}
            </span>
          </button>

          <button
            data-nav="item"
            onClick={() => setActiveTab('plan_to_watch')}
            class={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'plan_to_watch'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Por Ver</span>
            <span class="px-1.5 py-0.2 rounded font-mono text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400">
              {planToWatchCount}
            </span>
          </button>
        </div>
      </div>

      {/* Filters bar: Type + Search */}
      <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div class="inline-flex p-0.5 bg-zinc-950 border border-zinc-800 rounded-md">
          {(['all', 'Movie', 'Series'] as const).map((t) => {
            const isSelected = selectedType === t;
            const labels = { all: 'Todas', Movie: 'Películas', Series: 'Series' };
            return (
              <button
                key={t}
                data-nav="item"
                onClick={() => setSelectedType(t)}
                class={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
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
            placeholder="Filtrar por título, perfil..."
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div class="py-16 text-center text-zinc-500 text-xs font-mono">
          Cargando títulos de la lista...
        </div>
      ) : filteredItems.length === 0 ? (
        <div class="mt-6 p-8 rounded-md bg-zinc-950 border border-zinc-800 text-center flex flex-col items-center justify-center gap-2">
          <h3 class="text-sm font-medium text-zinc-200">
            {searchQuery
              ? 'No hay títulos que coincidan con la búsqueda'
              : activeTab === 'plan_to_watch'
              ? 'No tienes títulos pendientes en esta categoría'
              : 'Aún no has registrado títulos como vistos'}
          </h3>
          <p class="text-xs text-zinc-400 max-w-sm">
            {activeTab === 'plan_to_watch'
              ? 'Añade títulos manualmente o explora el Top 15 IMDb.'
              : 'Marca títulos vistos para guardar calificaciones independientes.'}
          </p>
          <button
            data-nav="item"
            onClick={() => handleOpenAddModal()}
            class="mt-2 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-medium cursor-pointer shadow-sm"
          >
            + Añadir título
          </button>
        </div>
      ) : (
        <div class="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                class="group relative bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-md p-3.5 sm:p-4 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {item.type === 'Series' ? 'Serie' : 'Película'}
                      </span>

                      {item.in_library && (
                        <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-200 border border-zinc-700">
                          En servidor
                        </span>
                      )}
                    </div>

                    <div class="flex items-center gap-1.5 font-mono text-[11px]">
                      {item.year && <span class="text-zinc-400">{item.year}</span>}
                      {item.imdb_rating && (
                        <span class="text-amber-400">
                          ★ {item.imdb_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 class="text-sm sm:text-base font-semibold text-zinc-100 leading-snug">
                    {item.title}
                  </h3>

                  {item.original_title && item.original_title !== item.title && (
                    <p class="text-xs text-zinc-400 mt-0.5 font-normal">
                      {item.original_title}
                    </p>
                  )}

                  {/* Multi-User Ratings */}
                  <div class="mt-3 pt-2 border-t border-zinc-800/80">
                    {hasRatings ? (
                      <div class="flex flex-wrap items-center gap-1.5">
                        {item.ratings!.map((r) => (
                          <div
                            key={r.user_nick}
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300"
                          >
                            <span class="text-zinc-400">{r.user_nick}:</span>
                            {r.reaction ? (
                              <span class="text-zinc-200 font-sans">{r.reaction}</span>
                            ) : r.rating !== undefined && r.rating !== null ? (
                              <span class="text-amber-400 font-medium">★ {r.rating}</span>
                            ) : (
                              <span class="text-zinc-400">Visto</span>
                            )}
                            {r.comment && (
                              <span class="text-zinc-500 text-[10px] truncate max-w-[90px]" title={r.comment}>
                                ({r.comment})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div class="text-[11px] text-zinc-500 font-mono flex items-center justify-between">
                        <span>Sin votos registrados</span>
                        <button
                          data-nav="item"
                          onClick={() => handleOpenRatingModal(item, activeUser)}
                          class="text-zinc-300 hover:underline cursor-pointer"
                        >
                          + Votar como {activeUser}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <p class="mt-2 text-xs text-zinc-400 leading-relaxed bg-zinc-900/60 p-2 rounded border border-zinc-800/80 font-normal">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div class="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-1.5">
                  <div class="flex items-center gap-1.5">
                    {/* Rate / Vote Button */}
                    <button
                      data-nav="item"
                      onClick={() => handleOpenRatingModal(item, activeUser)}
                      class="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
                      title={`Calificar o modificar voto de ${activeUser}`}
                    >
                      {myVote ? `★ Mi voto (${myVote.rating || myVote.reaction})` : `+ Votar (${activeUser})`}
                    </button>

                    {/* Move between tabs */}
                    <button
                      data-nav="item"
                      onClick={() => handleToggleStatus(item)}
                      class="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-xs border border-zinc-800 transition-colors cursor-pointer"
                      title={activeTab === 'plan_to_watch' ? 'Mover a Vistas' : 'Mover a Por Ver'}
                    >
                      {activeTab === 'plan_to_watch' ? '✓ Marcar vista' : '📌 Pasar a Por Ver'}
                    </button>
                  </div>

                  <div class="flex items-center gap-1">
                    {/* Search in Torrents */}
                    <button
                      data-nav="item"
                      onClick={() => onSearchMovie(item.original_title || item.title)}
                      class="p-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs transition-colors cursor-pointer shadow-sm"
                      title="Buscar descargas"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>

                    {/* Edit Title */}
                    <button
                      data-nav="item"
                      onClick={() => handleOpenEditModal(item)}
                      class="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-xs border border-zinc-800 transition-colors cursor-pointer"
                      title="Editar título"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    {/* Delete item */}
                    <button
                      data-nav="item"
                      onClick={() => handleDeleteItem(item)}
                      class="p-1.5 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 rounded text-xs border border-zinc-800 transition-colors cursor-pointer"
                      title="Eliminar de la lista"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: CALIFICAR / VOTAR MULTI-USUARIO ─── */}
      {ratingModalItem && (
        <div
          class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setRatingModalItem(null)}
        >
          <div
            class="bg-zinc-950 border border-zinc-800 rounded-lg max-w-sm w-full p-5 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 class="text-sm font-semibold text-zinc-100">
                Calificar título
              </h3>
              <button
                data-nav="item"
                onClick={() => setRatingModalItem(null)}
                class="text-zinc-400 hover:text-zinc-100 p-1 text-xs rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div class="bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
              <h4 class="text-sm font-medium text-zinc-100">
                {ratingModalItem.title}
              </h4>
              {ratingModalItem.year && (
                <p class="text-xs text-zinc-400 font-mono mt-0.5">
                  {ratingModalItem.year} · {ratingModalItem.type === 'Series' ? 'Serie' : 'Película'}
                </p>
              )}
            </div>

            {/* User Switcher */}
            <div>
              <label class="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                Perfil de votación
              </label>
              <div class="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  data-nav="item"
                  onClick={() => handleSwitchRatingUser('Nano')}
                  class={`py-1.5 px-3 rounded text-xs font-medium transition-colors border cursor-pointer ${
                    ratingUser.toLowerCase() === 'nano'
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Nano
                </button>

                <button
                  type="button"
                  data-nav="item"
                  onClick={() => handleSwitchRatingUser('Vane')}
                  class={`py-1.5 px-3 rounded text-xs font-medium transition-colors border cursor-pointer ${
                    ratingUser.toLowerCase() === 'vane'
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Vane
                </button>
              </div>

              <input
                type="text"
                data-nav="item"
                placeholder="Otro nombre..."
                value={ratingUser}
                onInput={(e) => setRatingUser((e.target as HTMLInputElement).value)}
                class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>

            {/* Star Rating Grid */}
            <div class="p-3 bg-zinc-900/60 border border-zinc-800 rounded space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-mono text-zinc-400 uppercase">
                  Puntuación
                </label>
                <span class="text-xs font-mono text-amber-400 font-medium">
                  {selectedRating !== null ? `★ ${selectedRating} de 5` : 'Sin estrellas'}
                </span>
              </div>

              <div class="grid grid-cols-5 gap-1">
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
                      class={`py-1 rounded text-xs font-mono transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-medium'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      ★ {val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reactions */}
            <div>
              <label class="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                O una reacción
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
                      class={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {react.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label class="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                Comentario de {ratingUser} <span class="text-zinc-600 normal-case">(opcional)</span>
              </label>
              <input
                type="text"
                data-nav="item"
                placeholder="Opinión rápida..."
                value={ratingComment}
                onInput={(e) => setRatingComment((e.target as HTMLInputElement).value)}
                class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Modal Actions */}
            <div class="pt-2 flex items-center justify-between gap-2 border-t border-zinc-800">
              {(ratingModalItem.ratings || []).some(
                (r) => r.user_nick.toLowerCase() === ratingUser.trim().toLowerCase()
              ) ? (
                <button
                  type="button"
                  data-nav="item"
                  onClick={handleDeleteRating}
                  disabled={isRatingSubmitting}
                  class="px-2.5 py-1 text-rose-400 hover:text-rose-300 text-xs cursor-pointer font-medium"
                >
                  Borrar voto
                </button>
              ) : <div></div>}

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-nav="item"
                  onClick={() => setRatingModalItem(null)}
                  class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-medium border border-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  data-nav="item"
                  disabled={isRatingSubmitting}
                  onClick={handleSaveRating}
                  class="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-medium cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isRatingSubmitting ? 'Guardando...' : 'Guardar voto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: AGREGAR O EDITAR TÍTULO ─── */}
      {isAddModalOpen && (
        <div
          class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            class="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 class="text-sm font-semibold text-zinc-100">
                {editingItem ? 'Editar título' : 'Añadir título a la lista'}
              </h3>
              <button
                data-nav="item"
                onClick={() => setIsAddModalOpen(false)}
                class="text-zinc-400 hover:text-zinc-100 p-1 text-xs rounded"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div class="p-2.5 bg-rose-950/40 border border-rose-800/80 rounded text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveItem} class="space-y-3">
              <div>
                <label class="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                  Título <span class="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  data-nav="item"
                  required
                  placeholder="Ej: Interstellar, Breaking Bad..."
                  value={formTitle}
                  onInput={(e) => setFormTitle((e.target as HTMLInputElement).value)}
                  class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label class="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                  Título original <span class="text-zinc-600 normal-case">(opcional)</span>
                </label>
                <input
                  type="text"
                  data-nav="item"
                  placeholder="Ej: The Godfather"
                  value={formOriginalTitle}
                  onInput={(e) => setFormOriginalTitle((e.target as HTMLInputElement).value)}
                  class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-mono text-zinc-400 mb-1 uppercase">Tipo</label>
                  <select
                    data-nav="item"
                    value={formType}
                    onChange={(e) => setFormType((e.target as HTMLSelectElement).value as any)}
                    class="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
                  >
                    <option value="Movie">Película</option>
                    <option value="Series">Serie</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-mono text-zinc-400 mb-1 uppercase">Lista</label>
                  <select
                    data-nav="item"
                    value={formStatus}
                    onChange={(e) => setFormStatus((e.target as HTMLSelectElement).value as any)}
                    class="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
                  >
                    <option value="completed">Vista</option>
                    <option value="plan_to_watch">Por Ver</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-mono text-zinc-400 mb-1 uppercase">Perfil</label>
                  <input
                    type="text"
                    data-nav="item"
                    placeholder="Nano, Vane..."
                    value={formNick}
                    onInput={(e) => setFormNick((e.target as HTMLInputElement).value)}
                    class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>

                <div>
                  <label class="block text-xs font-mono text-zinc-400 mb-1 uppercase">Año</label>
                  <input
                    type="number"
                    data-nav="item"
                    placeholder="2024"
                    value={formYear}
                    onInput={(e) => setFormYear((e.target as HTMLInputElement).value)}
                    class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                  Calificación IMDb <span class="text-zinc-600 normal-case">(opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  data-nav="item"
                  placeholder="8.5"
                  value={formImdbRating}
                  onInput={(e) => setFormImdbRating((e.target as HTMLInputElement).value)}
                  class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              {formStatus === 'completed' && (
                <div class="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded space-y-1.5">
                  <div class="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase">
                    <span>Calificación de {formNick || 'usuario'}</span>
                    <span class="text-amber-400">★ {formRating} / 5</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        data-nav="item"
                        onClick={() => setFormRating(star)}
                        class={`text-xl transition-colors cursor-pointer ${
                          star <= formRating ? 'text-amber-400' : 'text-zinc-700'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label class="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                  Nota personal <span class="text-zinc-600 normal-case">(opcional)</span>
                </label>
                <textarea
                  data-nav="item"
                  rows={2}
                  placeholder="Breve apunte o comentario..."
                  value={formNotes}
                  onInput={(e) => setFormNotes((e.target as HTMLTextAreaElement).value)}
                  class="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div class="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  data-nav="item"
                  onClick={() => setIsAddModalOpen(false)}
                  class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-medium border border-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-nav="item"
                  disabled={isSubmitting}
                  class="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {isSubmitting ? 'Guardando...' : editingItem ? 'Actualizar' : 'Guardar título'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
