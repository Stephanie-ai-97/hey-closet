import { memo, useMemo } from 'react';
import { Calendar, Heart, Pencil, Shirt, Tag, Trash2 } from 'lucide-react';
import { Item, Outfit, OutfitItem, OutfitSlot } from '../types';
import { ItemSVGIcon } from './ItemSVGIcon';
import { cn } from '../lib/utils';

interface OutfitCardProps {
  outfit: Outfit;
  items: Item[];
  outfitItems: OutfitItem[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const SLOT_LABELS: Record<OutfitSlot, string> = {
  top: 'Top',
  bottom: 'Bottom',
  shoes: 'Shoes',
  outerwear: 'Outerwear',
  accessories: 'Accessories',
};

const SLOT_ORDER: OutfitSlot[] = ['top', 'bottom', 'shoes', 'outerwear', 'accessories'];

function itemForLink(items: Item[], itemId: number): Item | undefined {
  return items.find(item => item.id === itemId);
}

export const OutfitCard = memo(function OutfitCard({
  outfit,
  items,
  outfitItems,
  onEdit,
  onDelete,
  onToggleFavorite,
}: OutfitCardProps) {
  const itemsBySlot = useMemo(() => {
    const grouped = new Map<OutfitSlot, Item[]>();
    SLOT_ORDER.forEach(slot => grouped.set(slot, []));
    outfitItems.forEach(link => {
      if (!link.slot) return;
      const item = itemForLink(items, link.dk_itemid);
      if (item) grouped.get(link.slot)?.push(item);
    });
    return grouped;
  }, [items, outfitItems]);

  const tags = [...(outfit.styles || []), ...(outfit.occasions || [])].filter(Boolean).slice(0, 3);
  const seasons = outfit.seasons?.length ? outfit.seasons : outfit.season ? [outfit.season] : [];

  return (
    <article className="flex min-h-[24rem] flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 grid h-48 grid-cols-3 grid-rows-2 gap-2">
        {SLOT_ORDER.slice(0, 5).map(slot => {
          const slotItems = itemsBySlot.get(slot) || [];
          const primary = slotItems[0];
          return (
            <div
              key={slot}
              className={cn(
                'relative overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800',
                slot === 'top' && 'col-span-2',
                slot === 'accessories' && 'col-span-2'
              )}
              title={primary ? `${SLOT_LABELS[slot]}: ${primary.itemtype}` : SLOT_LABELS[slot]}
            >
              {primary?.photo_url ? (
                <img
                  src={primary.photo_url}
                  alt={primary.itemtype}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : primary ? (
                <div className="flex h-full items-center justify-center">
                  <ItemSVGIcon
                    itemtype={primary.itemtype}
                    size={slot === 'top' ? 58 : 42}
                    color={(primary as any).colour?.majorcolour}
                    majorColour={(primary as any).colour?.majorcolour}
                    minorColour={(primary as any).colour?.minorcolour}
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                  <Shirt size={24} />
                </div>
              )}
              <span className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 shadow-sm dark:bg-zinc-950/85 dark:text-zinc-300">
                {SLOT_LABELS[slot]}
                {slot === 'accessories' && slotItems.length > 1 ? ` +${slotItems.length - 1}` : ''}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-bold text-zinc-900 dark:text-zinc-50">{outfit.outfitname}</h3>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              outfit.favorite
                ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40'
                : 'text-zinc-300 hover:bg-zinc-100 hover:text-rose-500 dark:text-zinc-600 dark:hover:bg-zinc-800'
            )}
            aria-label={outfit.favorite ? 'Remove favorite' : 'Favorite outfit'}
            title={outfit.favorite ? 'Remove favorite' : 'Favorite outfit'}
          >
            <Heart size={17} fill={outfit.favorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {seasons.map(season => (
            <span key={season} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Calendar size={10} />
              {season}
            </span>
          ))}
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          <span>{items.length} item{items.length === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              aria-label="Edit outfit"
              title="Edit outfit"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
              aria-label="Delete outfit"
              title="Delete outfit"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});
