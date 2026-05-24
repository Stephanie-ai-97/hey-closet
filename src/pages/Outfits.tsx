import { useMemo, useState } from 'react';
import { Filter, Heart, Layers, Plus, X } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { OutfitModal } from '../components/OutfitModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { OutfitCard } from '../components/OutfitCard';
import { useOutfits, OutfitWithItems } from '../hooks/useOutfits';
import { useItemColours } from '../hooks/useItemColours';
import { api } from '../services/api';
import { Outfit } from '../types';
import { cn } from '../lib/utils';

function unwrap<T>(value: T): T {
  return ((value as any)?.data ?? value) as T;
}

export default function Outfits() {
  const { outfits, allItems, loading, error, refetch } = useOutfits();
  const { itemsWithColours } = useItemColours(allItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OutfitWithItems | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OutfitWithItems | null>(null);
  const [seasonFilter, setSeasonFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const seasonOptions = useMemo(() => {
    return Array.from(new Set(outfits.flatMap(({ outfit }) => outfit.seasons || []))).filter(Boolean).sort();
  }, [outfits]);

  const styleOptions = useMemo(() => {
    return Array.from(new Set(outfits.flatMap(({ outfit }) => outfit.styles || []))).filter(Boolean).sort();
  }, [outfits]);

  const filteredOutfits = useMemo(() => {
    return outfits.filter(({ outfit }) => {
      const matchesSeason = !seasonFilter || outfit.seasons?.includes(seasonFilter);
      const matchesStyle = !styleFilter || outfit.styles?.includes(styleFilter);
      const matchesFavorite = !favoritesOnly || outfit.favorite;
      return matchesSeason && matchesStyle && matchesFavorite;
    });
  }, [favoritesOnly, outfits, seasonFilter, styleFilter]);

  const getColouredItems = (items: OutfitWithItems['items']) => {
    const ids = new Set(items.map(item => item.id));
    return itemsWithColours.filter(item => ids.has(item.id));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await Promise.all(deleteTarget.outfitItems.map(link => api.delete('outfititem', link.id)));
    await api.delete('outfit', deleteTarget.outfit.id);
    setDeleteTarget(null);
    await refetch();
  };

  const handleToggleFavorite = async (outfit: Outfit) => {
    const nextFavorite = !outfit.favorite;
    try {
      unwrap(await api.update<Outfit>('outfit', outfit.id, { favorite: nextFavorite }));
    } catch {
      await api.update<Outfit>('outfit', outfit.id, {
        outfitname: outfit.outfitname,
        season: outfit.season || outfit.seasons?.[0] || 'all-season',
        occasion: outfit.occasion || outfit.occasions?.[0] || 'everyday',
      });
    }
    await refetch();
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  if (loading) return <div className="p-8 text-center text-zinc-400 dark:text-zinc-500">Loading outfit gallery...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <>
      <OutfitModal
        isOpen={modalOpen}
        allItems={itemsWithColours}
        editingOutfit={editing?.outfit}
        editingItems={editing ? getColouredItems(editing.items) : []}
        editingOutfitItems={editing?.outfitItems}
        onClose={closeModal}
        onOutfitSaved={refetch}
      />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.outfit.outfitname ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <PageContainer
        title="Outfit Gallery"
        subtitle="Build and manage complete outfits from your wardrobe."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus size={18} />
            New Outfit
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <Filter size={16} />
            Filters
          </div>
          <select
            value={seasonFilter}
            onChange={(event) => setSeasonFilter(event.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            aria-label="Filter outfits by season"
          >
            <option value="">All seasons</option>
            {seasonOptions.map(season => <option key={season} value={season}>{season}</option>)}
          </select>
          <select
            value={styleFilter}
            onChange={(event) => setStyleFilter(event.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            aria-label="Filter outfits by style"
          >
            <option value="">All styles</option>
            {styleOptions.map(style => <option key={style} value={style}>{style}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setFavoritesOnly(prev => !prev)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
              favoritesOnly
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-50'
            )}
          >
            <Heart size={16} fill={favoritesOnly ? 'currentColor' : 'none'} />
            Favorites
          </button>
          {(seasonFilter || styleFilter || favoritesOnly) && (
            <button
              type="button"
              onClick={() => {
                setSeasonFilter('');
                setStyleFilter('');
                setFavoritesOnly(false);
              }}
              className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <X size={15} />
              Clear
            </button>
          )}
        </div>

        {outfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-24 text-zinc-400 dark:text-zinc-500">
            <Layers size={48} className="opacity-20" />
            <p className="text-lg font-medium">No outfits saved yet</p>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Build your first outfit
            </button>
          </div>
        ) : filteredOutfits.length === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            No outfits match these filters
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredOutfits.map(outfitWithItems => (
              <OutfitCard
                key={outfitWithItems.outfit.id}
                outfit={outfitWithItems.outfit}
                items={getColouredItems(outfitWithItems.items)}
                outfitItems={outfitWithItems.outfitItems}
                onEdit={() => {
                  setEditing(outfitWithItems);
                  setModalOpen(true);
                }}
                onDelete={() => setDeleteTarget(outfitWithItems)}
                onToggleFavorite={() => handleToggleFavorite(outfitWithItems.outfit)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
