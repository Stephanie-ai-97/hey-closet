import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { Outfit, OutfitItem, OutfitSlot } from '../types';
import { api } from '../services/api';
import { ItemSVGIcon } from './ItemSVGIcon';
import { ItemWithColour } from '../hooks/useItemColours';
import { cn } from '../lib/utils';
import { ItemPickerModal } from './ItemPickerModal';
import { OCCASIONS, SEASONS, STYLES } from '../lib/tagConstants';

interface OutfitModalProps {
  isOpen: boolean;
  allItems: ItemWithColour[];
  editingOutfit?: Outfit | null;
  editingItems?: ItemWithColour[];
  editingOutfitItems?: OutfitItem[];
  onClose: () => void;
  onOutfitSaved: () => void;
}

type SingleSlot = Exclude<OutfitSlot, 'accessories'>;
type SlotSelection = Record<SingleSlot, ItemWithColour | null> & { accessories: ItemWithColour[] };

const DEFAULT_SELECTION: SlotSelection = {
  top: null,
  bottom: null,
  shoes: null,
  outerwear: null,
  accessories: [],
};

const SLOT_CONFIG: Array<{
  slot: OutfitSlot;
  label: string;
  required: boolean;
  categories: Array<'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories'>;
}> = [
  { slot: 'top', label: 'Top', required: true, categories: ['tops'] },
  { slot: 'bottom', label: 'Bottom', required: true, categories: ['bottoms'] },
  { slot: 'shoes', label: 'Shoes', required: true, categories: ['shoes'] },
  { slot: 'outerwear', label: 'Outerwear', required: false, categories: ['outerwear'] },
  { slot: 'accessories', label: 'Accessories', required: false, categories: ['accessories'] },
];

function unwrapCreated<T>(value: T): T {
  return ((value as any)?.data ?? value) as T;
}

function toTitle(value: string): string {
  return value.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function arrayWithFallback(values: string[] | undefined, fallback?: string): string[] {
  if (values?.length) return values;
  return fallback ? [fallback] : [];
}

export function OutfitModal({
  isOpen,
  allItems,
  editingOutfit,
  editingItems = [],
  editingOutfitItems = [],
  onClose,
  onOutfitSaved,
}: OutfitModalProps) {
  const [outfitname, setOutfitname] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [selection, setSelection] = useState<SlotSelection>(DEFAULT_SELECTION);
  const [pickerSlot, setPickerSlot] = useState<OutfitSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(editingOutfit);

  useEffect(() => {
    if (!isOpen) return;
    setOutfitname(editingOutfit?.outfitname || '');
    setStyles(arrayWithFallback(editingOutfit?.styles));
    setSeasons(arrayWithFallback(editingOutfit?.seasons, editingOutfit?.season));
    setOccasions(arrayWithFallback(editingOutfit?.occasions, editingOutfit?.occasion));

    const nextSelection: SlotSelection = { ...DEFAULT_SELECTION, accessories: [] };
    editingOutfitItems.forEach(link => {
      const item = editingItems.find(editingItem => editingItem.id === link.dk_itemid);
      if (!item || !link.slot) return;
      if (link.slot === 'accessories') {
        nextSelection.accessories.push(item);
      } else {
        nextSelection[link.slot] = item;
      }
    });
    setSelection(nextSelection);
    setError(null);
  }, [editingItems, editingOutfit, editingOutfitItems, isOpen]);

  const selectedIds = useMemo(() => {
    return [
      selection.top?.id,
      selection.bottom?.id,
      selection.shoes?.id,
      selection.outerwear?.id,
      ...selection.accessories.map(item => item.id),
    ].filter(Boolean) as number[];
  }, [selection]);

  const pickerConfig = SLOT_CONFIG.find(config => config.slot === pickerSlot);

  const toggleValue = useCallback((value: string, setter: (next: string[]) => void, current: string[]) => {
    setter(current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  }, []);

  const handleSelectItem = useCallback((item: ItemWithColour) => {
    if (!pickerSlot) return;
    setSelection(prev => {
      if (pickerSlot === 'accessories') {
        const exists = prev.accessories.some(accessory => accessory.id === item.id);
        return {
          ...prev,
          accessories: exists
            ? prev.accessories.filter(accessory => accessory.id !== item.id)
            : [...prev.accessories, item],
        };
      }
      return { ...prev, [pickerSlot]: item };
    });
    if (pickerSlot !== 'accessories') setPickerSlot(null);
  }, [pickerSlot]);

  const clearSlot = (slot: OutfitSlot) => {
    setSelection(prev => slot === 'accessories' ? { ...prev, accessories: [] } : { ...prev, [slot]: null });
  };

  const selectedLinks = useMemo(() => {
    const links: Array<{ slot: OutfitSlot; itemId: number }> = [];
    if (selection.top) links.push({ slot: 'top', itemId: selection.top.id });
    if (selection.bottom) links.push({ slot: 'bottom', itemId: selection.bottom.id });
    if (selection.shoes) links.push({ slot: 'shoes', itemId: selection.shoes.id });
    if (selection.outerwear) links.push({ slot: 'outerwear', itemId: selection.outerwear.id });
    selection.accessories.forEach(item => links.push({ slot: 'accessories', itemId: item.id }));
    return links;
  }, [selection]);

  const saveOutfitRecord = async () => {
    const payload = {
      outfitname: outfitname.trim(),
      styles,
      seasons,
      occasions,
      favorite: editingOutfit?.favorite ?? false,
      season: seasons[0] || 'all-season',
      occasion: occasions[0] || 'everyday',
    };
    const legacyPayload = {
      outfitname: payload.outfitname,
      season: payload.season,
      occasion: payload.occasion,
    };

    if (editingOutfit) {
      try {
        return unwrapCreated(await api.update<Outfit>('outfit', editingOutfit.id, payload));
      } catch {
        return unwrapCreated(await api.update<Outfit>('outfit', editingOutfit.id, legacyPayload));
      }
    }

    try {
      return unwrapCreated(await api.create<Outfit>('outfit', payload));
    } catch {
      return unwrapCreated(await api.create<Outfit>('outfit', legacyPayload));
    }
  };

  const createOutfitItem = async (outfitId: number, slot: OutfitSlot, itemId: number) => {
    try {
      await api.create<OutfitItem>('outfititem', { dk_outfitid: outfitId, dk_itemid: itemId, slot });
    } catch {
      await api.create<OutfitItem>('outfititem', { dk_outfitid: outfitId, dk_itemid: itemId });
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!outfitname.trim()) {
      setError('Outfit name is required.');
      return;
    }
    if (!selection.top || !selection.bottom || !selection.shoes) {
      setError('Choose a top, bottom, and shoes before saving.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const savedOutfit = await saveOutfitRecord();
      const outfitId = (savedOutfit as any).id ?? (savedOutfit as any).pk_outfitid ?? editingOutfit?.id;
      if (!outfitId) throw new Error('Outfit saved, but no outfit id was returned.');

      if (editingOutfitItems.length) {
        await Promise.all(editingOutfitItems.map(link => api.delete('outfititem', link.id)));
      }
      await Promise.all(selectedLinks.map(link => createOutfitItem(outfitId, link.slot, link.itemId)));

      onOutfitSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save outfit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPickerSlot(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
        <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-t-2xl bg-white dark:bg-zinc-900 sm:rounded-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">{isEditing ? 'Edit Outfit' : 'Build Outfit'}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Create a stable outfit from compatible wardrobe categories.</p>
            </div>
            <button onClick={handleClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_22rem] sm:p-6">
            <div className="space-y-5">
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-900 dark:text-zinc-50">Outfit Name</label>
                <input
                  value={outfitname}
                  onChange={(event) => setOutfitname(event.target.value)}
                  placeholder="Weekend market uniform"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none transition-all focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <TagGroup title="Styles" values={Object.values(STYLES)} selected={styles} onToggle={(value) => toggleValue(value, setStyles, styles)} />
                <TagGroup title="Seasons" values={Object.values(SEASONS)} selected={seasons} onToggle={(value) => toggleValue(value, setSeasons, seasons)} />
                <TagGroup title="Occasions" values={Object.values(OCCASIONS)} selected={occasions} onToggle={(value) => toggleValue(value, setOccasions, occasions)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {SLOT_CONFIG.map(config => {
                  const slotItems = config.slot === 'accessories'
                    ? selection.accessories
                    : selection[config.slot as SingleSlot] ? [selection[config.slot as SingleSlot]!] : [];
                  return (
                    <section key={config.slot} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{config.label}</h3>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{config.required ? 'Required' : 'Optional'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPickerSlot(config.slot)}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          <Plus size={14} />
                          Select
                        </button>
                      </div>
                      <div className="space-y-2">
                        {slotItems.length ? slotItems.map(item => (
                          <div key={item.id}>
                            <SelectedItem item={item} onRemove={() => {
                              if (config.slot === 'accessories') {
                                setSelection(prev => ({ ...prev, accessories: prev.accessories.filter(accessory => accessory.id !== item.id) }));
                              } else {
                                clearSlot(config.slot);
                              }
                            }} />
                          </div>
                        )) : (
                          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-zinc-200 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                            Empty slot
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="mb-4 text-sm font-bold text-zinc-900 dark:text-zinc-50">Outfit Preview</h3>
                <div className="grid h-[28rem] grid-cols-2 grid-rows-5 gap-2">
                  <PreviewTile className="row-span-2" item={selection.top} label="Top" />
                  <PreviewTile className="row-span-2" item={selection.outerwear} label="Outerwear" />
                  <PreviewTile className="row-span-2" item={selection.bottom} label="Bottom" />
                  <PreviewTile className="row-span-2" item={selection.shoes} label="Shoes" />
                  <div className="col-span-2 grid grid-cols-3 gap-2">
                    {(selection.accessories.length ? selection.accessories.slice(0, 3) : [null]).map((item, index) => (
                      <div key={item?.id ?? index}>
                        <PreviewTile item={item} label={index === 0 ? 'Accessories' : ''} compact />
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <Save size={17} />
                  {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Outfit'}
                </button>
              </div>
            </aside>
          </form>
        </div>
      </div>

      {pickerConfig && (
        <ItemPickerModal
          isOpen={!!pickerSlot}
          title={`Select ${pickerConfig.label}`}
          items={allItems}
          allowedCategories={pickerConfig.categories}
          selectedIds={pickerSlot === 'accessories' ? selection.accessories.map(item => item.id) : selectedIds}
          seasons={seasons}
          styles={styles}
          multi={pickerSlot === 'accessories'}
          onSelect={handleSelectItem}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </>
  );
}

function TagGroup({ title, values, selected, onToggle }: { title: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
        {values.map(value => (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn(
              'rounded-full px-2 py-1 text-[11px] font-semibold transition-colors',
              selected.includes(value)
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-50'
            )}
          >
            {toTitle(value)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectedItem({ item, onRemove }: { item: ItemWithColour; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-zinc-900">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.itemtype} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <ItemSVGIcon itemtype={item.itemtype} size={30} majorColour={item.colour?.majorcolour} minorColour={item.colour?.minorcolour} color={item.colour?.majorcolour} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.itemtype}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.itemsize || 'One size'}</p>
      </div>
      <button type="button" onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-50">
        <X size={15} />
      </button>
    </div>
  );
}

function PreviewTile({ item, label, className, compact = false }: { item: ItemWithColour | null; label: string; className?: string; compact?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-white dark:bg-zinc-900', className)}>
      {item?.photo_url ? (
        <img src={item.photo_url} alt={item.itemtype} loading="lazy" className="h-full w-full object-cover" />
      ) : item ? (
        <div className="flex h-full items-center justify-center">
          <ItemSVGIcon itemtype={item.itemtype} size={compact ? 30 : 58} majorColour={item.colour?.majorcolour} minorColour={item.colour?.minorcolour} color={item.colour?.majorcolour} />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-xs font-semibold text-zinc-300 dark:text-zinc-700">{label || 'Add'}</div>
      )}
      {label && (
        <span className="absolute bottom-1 left-1 rounded bg-zinc-950/75 px-1.5 py-0.5 text-[10px] font-bold text-white">{label}</span>
      )}
    </div>
  );
}
