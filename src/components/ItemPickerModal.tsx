import { memo, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { ItemWithColour } from '../hooks/useItemColours';
import { getItemCategory, searchItems } from '../lib/tagFiltering';
import { ClothingCategory } from '../lib/tagConstants';
import { cn } from '../lib/utils';
import { ItemSVGIcon } from './ItemSVGIcon';

interface ItemPickerModalProps {
  isOpen: boolean;
  title: string;
  items: ItemWithColour[];
  allowedCategories: ClothingCategory[];
  selectedIds: number[];
  seasons: string[];
  styles: string[];
  multi?: boolean;
  onSelect: (item: ItemWithColour) => void;
  onClose: () => void;
}

function matchesAny(values: string[] | undefined, filters: string[]): boolean {
  return filters.length === 0 || !values?.length || values.some(value => filters.includes(value));
}

export const ItemPickerModal = memo(function ItemPickerModal({
  isOpen,
  title,
  items,
  allowedCategories,
  selectedIds,
  seasons,
  styles,
  multi = false,
  onSelect,
  onClose,
}: ItemPickerModalProps) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    return searchItems(items, query)
      .filter(item => allowedCategories.includes(getItemCategory(item) as ClothingCategory))
      .filter(item => matchesAny(item.seasons, seasons))
      .filter(item => matchesAny(item.styles, styles))
      .sort((a, b) => (a.itemtype || '').localeCompare(b.itemtype || ''));
  }, [allowedCategories, items, query, seasons, styles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-zinc-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800 sm:p-5">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {filteredItems.length} compatible item{filteredItems.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Close picker"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search compatible items..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 outline-none transition-all focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          <div className="grid max-h-[56vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
            {filteredItems.map(item => {
              const selected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={cn(
                    'relative flex min-h-[9rem] flex-col rounded-xl border p-3 text-left transition-all',
                    selected
                      ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800'
                      : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500'
                  )}
                >
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                      <Check size={14} />
                    </span>
                  )}
                  <div className="mb-3 flex h-20 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.itemtype}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ItemSVGIcon
                        itemtype={item.itemtype}
                        size={46}
                        majorColour={item.colour?.majorcolour}
                        minorColour={item.colour?.minorcolour}
                        color={item.colour?.majorcolour}
                      />
                    )}
                  </div>
                  <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.itemtype}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.itemsize || 'One size'}</span>
                  {multi && selected && (
                    <span className="mt-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Selected</span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
              No compatible items found
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
