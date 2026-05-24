import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Item, ItemPhoto, ItemTag, Occasion, Outfit, OutfitItem, Season, Style } from '../types';
import { getItemCategory } from '../lib/tagFiltering';

export interface OutfitWithItems {
  outfit: Outfit;
  items: Item[];
  outfitItems: OutfitItem[];
}

function normalizeArray(value: unknown, fallback?: string): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return fallback ? [fallback] : [];
}

function inferSlot(item: Item): OutfitItem['slot'] {
  const category = getItemCategory(item);
  if (category === 'tops' || category === 'dresses') return 'top';
  if (category === 'bottoms') return 'bottom';
  if (category === 'shoes') return 'shoes';
  if (category === 'outerwear') return 'outerwear';
  return 'accessories';
}

export function useOutfits() {
  const [outfits, setOutfits] = useState<OutfitWithItems[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [
        outfitsRaw,
        outfitItemsRaw,
        itemsRaw,
        itemTagsRaw,
        seasonsRaw,
        stylesRaw,
        occasionsRaw,
        photosRaw,
      ] = await Promise.all([
        api.list<Outfit>('outfit'),
        api.list<OutfitItem>('outfititem'),
        api.list<Item>('item'),
        api.list<ItemTag>('itemtag').catch(() => []),
        api.list<Season>('season').catch(() => []),
        api.list<Style>('style').catch(() => []),
        api.list<Occasion>('occasion').catch(() => []),
        api.list<ItemPhoto>('itemphoto').catch(() => []),
      ]);

      const seasonsById = new Map<number, string>(seasonsRaw.map(season => [season.id, season.season_name] as const));
      const stylesById = new Map<number, string>(stylesRaw.map(style => [style.id, style.styletype || style.style_name || ''] as const));
      const occasionsById = new Map<number, string>(occasionsRaw.map(occasion => [occasion.id, occasion.occasion_name] as const));
      const photosByItem = new Map<number, ItemPhoto>();

      photosRaw.forEach(photo => {
        const normalizedPhoto = { ...photo, id: (photo as any).pk_itemphotoid ?? photo.id };
        const existing = photosByItem.get(normalizedPhoto.dk_itemid);
        if (!existing || normalizedPhoto.is_primary) photosByItem.set(normalizedPhoto.dk_itemid, normalizedPhoto);
      });

      const tagsByItem = new Map<number, { seasons: Set<string>; styles: Set<string>; occasions: Set<string> }>();
      itemTagsRaw.forEach(tag => {
        const itemId = tag.dk_itemid;
        if (!tagsByItem.has(itemId)) {
          tagsByItem.set(itemId, { seasons: new Set(), styles: new Set(), occasions: new Set() });
        }
        const itemTags = tagsByItem.get(itemId)!;
        if (tag.dk_seasonid) itemTags.seasons.add(seasonsById.get(tag.dk_seasonid) || '');
        if (tag.dk_styleid) itemTags.styles.add(stylesById.get(tag.dk_styleid) || '');
        if (tag.dk_occasionid) itemTags.occasions.add(occasionsById.get(tag.dk_occasionid) || '');
      });

      const normalizedItems = itemsRaw.map(item => {
        const id = (item as any).pk_itemid ?? item.id;
        const itemTags = tagsByItem.get(id);
        const photo = photosByItem.get(id);
        return {
          ...item,
          id,
          seasons: itemTags ? Array.from(itemTags.seasons).filter(Boolean) : [],
          styles: itemTags ? Array.from(itemTags.styles).filter(Boolean) : [],
          occasions: itemTags ? Array.from(itemTags.occasions).filter(Boolean) : [],
          photo_url: photo ? api.getPhotoUrl(photo.storage_path) : undefined,
        };
      });
      const normalizedOutfitItems = outfitItemsRaw.map(outfitItem => ({
        ...outfitItem,
        id: (outfitItem as any).pk_outfititemid ?? outfitItem.id,
      }));
      const normalizedOutfits = outfitsRaw.map(outfit => ({
        ...outfit,
        id: (outfit as any).pk_outfitid ?? outfit.id,
        styles: normalizeArray(outfit.styles),
        seasons: normalizeArray(outfit.seasons, outfit.season),
        occasions: normalizeArray(outfit.occasions, outfit.occasion),
        favorite: Boolean(outfit.favorite),
        createdAt: outfit.createdAt || outfit.created_at,
      }));

      const result: OutfitWithItems[] = normalizedOutfits.map(outfit => {
        const links = normalizedOutfitItems.filter(outfitItem => outfitItem.dk_outfitid === outfit.id);
        const linkedItems = links
          .map(outfitItem => normalizedItems.find(item => item.id === outfitItem.dk_itemid))
          .filter(Boolean) as Item[];
        const outfitItemsWithSlots = links.map(link => {
          if (link.slot) return link;
          const linkedItem = linkedItems.find(item => item.id === link.dk_itemid);
          return linkedItem ? { ...link, slot: inferSlot(linkedItem) } : link;
        });
        return { outfit, items: linkedItems, outfitItems: outfitItemsWithSlots };
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
