import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Item, Info, Colour } from '../types';

export interface ItemWithColour extends Item {
  colour?: Colour;
}

/**
 * Hook to enrich items with their colour metadata
 * Fetches Info and Colour records for all provided items
 */
export function useItemColours(items: Item[]) {
  const [itemsWithColours, setItemsWithColours] = useState<ItemWithColour[]>(items);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setItemsWithColours([]);
      return;
    }

    const enrichItems = async () => {
      try {
        setLoading(true);
        
        // Fetch all infos and colours
        const [infos, colours] = await Promise.all([
          api.list<Info>('info'),
          api.list<Colour>('colour'),
        ]);

        const infoMap = new Map<number, Info>();
        const colourMap = new Map<number, Colour>();

        infos.forEach(info => {
          infoMap.set(info.dk_itemid, info);
        });

        colours.forEach(colour => {
          colourMap.set(colour.id, colour);
        });

        // Enrich each item with its colour data
        const enriched = items.map(item => {
          const info = infoMap.get(item.id);
          const colour = info?.dk_colourid ? colourMap.get(info.dk_colourid) : undefined;
          return { ...item, colour };
        });

        setItemsWithColours(enriched);
      } catch (err) {
        console.error('Error enriching items with colours:', err);
        setItemsWithColours(items);
      } finally {
        setLoading(false);
      }
    };

    enrichItems();
  }, [items]);

  return { itemsWithColours, loading };
}

/**
 * Get colour for a single item
 */
export const getItemColour = async (itemId: number): Promise<Colour | undefined> => {
  try {
    const infos = await api.list<Info>('info', { dk_itemid: String(itemId) });
    if (infos.length === 0) return undefined;
    
    const info = infos[0];
    if (!info.dk_colourid) return undefined;
    
    return await api.get<Colour>('colour', info.dk_colourid);
  } catch (err) {
    console.error('Error fetching item colour:', err);
    return undefined;
  }
};
