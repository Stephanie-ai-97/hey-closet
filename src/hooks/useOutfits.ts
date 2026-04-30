import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Outfit, OutfitItem, Item } from '../types';

export interface OutfitWithItems {
  outfit: Outfit;
  items: Item[];
}

export function useOutfits() {
  const [outfits, setOutfits] = useState<OutfitWithItems[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [outfitsRaw, outfitItemsRaw, itemsRaw] = await Promise.all([
        api.list<Outfit>('outfit'),
        api.list<OutfitItem>('outfititem'),
        api.list<Item>('item'),
      ]);

      const outfitsList: Outfit[] = (outfitsRaw as any)?.data ?? outfitsRaw ?? [];
      const outfitItemsList: OutfitItem[] = (outfitItemsRaw as any)?.data ?? outfitItemsRaw ?? [];
      const itemsList: Item[] = (itemsRaw as any)?.data ?? itemsRaw ?? [];

      const normalizedItems = itemsList.map(i => ({ ...i, id: (i as any).pk_itemid ?? i.id }));
      const normalizedOutfits = outfitsList.map(o => ({ ...o, id: (o as any).pk_outfit ?? o.id }));

      const result: OutfitWithItems[] = normalizedOutfits.map(outfit => {
        const linkedItems = outfitItemsList
          .filter(oi => oi.dk_outfitid === outfit.id)
          .map(oi => normalizedItems.find(i => i.id === oi.dk_itemid))
          .filter(Boolean) as Item[];
        return { outfit, items: linkedItems };
      });

      setOutfits(result);
      setAllItems(normalizedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outfits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { outfits, allItems, loading, error, refetch: load };
}
