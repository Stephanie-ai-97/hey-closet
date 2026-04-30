import { PageContainer } from '../components/PageContainer';
import { OutfitModal } from '../components/OutfitModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ItemSVGIcon } from '../components/ItemSVGIcon';
import { useOutfits } from '../hooks/useOutfits';
import { api } from '../services/api';
import { useState } from 'react';
import { Plus, Layers, Tag, Calendar, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Outfits() {
  const { outfits, allItems, loading, error, refetch } = useOutfits();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete('outfit', deleteTarget.id);
    await refetch();
  };

  if (loading) return <div className="p-8 animate-pulse text-center">Loading outfit archive...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <>
      <OutfitModal
        isOpen={modalOpen}
        allItems={allItems}
        onClose={() => setModalOpen(false)}
        onOutfitCreated={refetch}
      />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <PageContainer
        title="Outfit Archive"
        subtitle="Curated combinations from your wardrobe."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-md shadow-black/10"
          >
            <Plus size={18} />
            New Outfit
          </button>
        }
      >
        {outfits.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-400 space-y-4">
            <Layers size={48} className="opacity-20" />
            <p className="text-lg font-medium">No outfits archived yet</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
            >
              Create your first outfit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map(({ outfit, items }) => (
              <div
                key={outfit.id}
                className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Item icons strip */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 min-h-[56px] items-center">
                  {items.length === 0 ? (
                    <div className="text-xs text-zinc-400 italic">No items linked</div>
                  ) : (
                    items.slice(0, 6).map(item => (
                      <div
                        key={item.id}
                        className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-500 shrink-0"
                        title={`${item.itemtype} · ${item.itemsize}`}
                      >
                        <ItemSVGIcon itemtype={item.itemtype} size={26} />
                      </div>
                    ))
                  )}
                  {items.length > 6 && (
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-500 text-xs font-bold shrink-0">
                      +{items.length - 6}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 text-base mb-1">{outfit.outfitname}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
                      <Tag size={9} />
                      {outfit.occasion}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
                      <Calendar size={9} />
                      {outfit.season}
                    </span>
                  </div>
                  {outfit.notes && (
                    <p className="text-xs text-zinc-400 italic line-clamp-2">{outfit.notes}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-50">
                  <span className="text-xs text-zinc-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setDeleteTarget({ id: outfit.id, name: outfit.outfitname })}
                    className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Delete outfit"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
