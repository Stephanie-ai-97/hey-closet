import { Item } from '../types';
import { ClothingCategory, ColorOption, FitType, SUBCATEGORIES, WarmthLevel } from './tagConstants';

export interface TagFilterOptions {
  categories?: string[];
  subcategories?: string[];
  primaryColors?: ColorOption[];
  secondaryColors?: ColorOption[];
  styles?: string[];
  occasions?: string[];
  warmthLevels?: WarmthLevel[];
  fitTypes?: FitType[];
  brands?: string[];
  customTags?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export type FilterableItem = Item & {
  seasons?: string[];
  styles?: string[];
  occasions?: string[];
  custom_tags?: string[];
};

export function getItemSubcategory(item: Pick<Item, 'itemtype' | 'subcategory'>): string {
  return (item.subcategory || item.itemtype || '').toLowerCase();
}

export function getItemCategory(item: Pick<Item, 'itemtype' | 'category' | 'subcategory'>): string {
  if (item.category) return item.category;

  const subcategory = getItemSubcategory(item);
  const match = Object.entries(SUBCATEGORIES).find(([, subcategories]) =>
    subcategories.includes(subcategory)
  );

  return (match?.[0] as ClothingCategory | undefined) ?? 'accessories';
}

function includesAny<T>(values: T[] | undefined, selected: T[] | undefined): boolean {
  return !selected?.length || Boolean(values?.some((value) => selected.includes(value)));
}

export function filterItemsByTags<T extends FilterableItem>(items: T[], filters: TagFilterOptions): T[] {
  return items.filter((item) => {
    if (filters.categories?.length && !filters.categories.includes(getItemCategory(item))) {
      return false;
    }

    if (filters.subcategories?.length && !filters.subcategories.includes(getItemSubcategory(item))) {
      return false;
    }

    if (filters.primaryColors?.length && !filters.primaryColors.includes(item.primary_color as ColorOption)) {
      return false;
    }

    if (filters.secondaryColors?.length && !filters.secondaryColors.includes(item.secondary_color as ColorOption)) {
      return false;
    }

    if (filters.warmthLevels?.length && !filters.warmthLevels.includes(item.warmth_level as WarmthLevel)) {
      return false;
    }

    if (filters.fitTypes?.length && !filters.fitTypes.includes(item.fit as FitType)) {
      return false;
    }

    if (filters.brands?.length && (!item.brand || !filters.brands.includes(item.brand))) {
      return false;
    }

    if (!includesAny(item.styles, filters.styles)) return false;
    if (!includesAny(item.occasions, filters.occasions)) return false;
    if (!includesAny(item.custom_tags, filters.customTags)) return false;

    if (filters.minPrice !== undefined && (item.itemcost ?? 0) < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && (item.itemcost ?? 0) > filters.maxPrice) return false;
    if (filters.minRating !== undefined && (item.itemlikerating ?? 0) < filters.minRating) return false;

    return true;
  });
}

export function extractUniqueTagValues<T extends FilterableItem>(items: T[], tagType: keyof T): string[] {
  const values = new Set<string>();

  items.forEach((item) => {
    const value = item[tagType];
    if (typeof value === 'string' && value) values.add(value);
  });

  return Array.from(values).sort();
}

export function getTagStatistics<T extends FilterableItem>(items: T[]) {
  const stats = {
    categories: new Map<string, number>(),
    colors: new Map<string, number>(),
    warmthLevels: new Map<string, number>(),
    brands: new Map<string, number>(),
    avgRating: 0,
    avgPrice: 0,
    totalItems: items.length,
  };

  let totalRating = 0;
  let totalPrice = 0;
  let itemsWithRating = 0;
  let itemsWithPrice = 0;

  items.forEach((item) => {
    const category = getItemCategory(item);
    stats.categories.set(category, (stats.categories.get(category) || 0) + 1);

    if (item.primary_color) {
      stats.colors.set(item.primary_color, (stats.colors.get(item.primary_color) || 0) + 1);
    }

    if (item.warmth_level) {
      stats.warmthLevels.set(item.warmth_level, (stats.warmthLevels.get(item.warmth_level) || 0) + 1);
    }

    if (item.brand) {
      stats.brands.set(item.brand, (stats.brands.get(item.brand) || 0) + 1);
    }

    if (item.itemlikerating > 0) {
      totalRating += item.itemlikerating;
      itemsWithRating += 1;
    }

    if (item.itemcost > 0) {
      totalPrice += item.itemcost;
      itemsWithPrice += 1;
    }
  });

  stats.avgRating = itemsWithRating > 0 ? totalRating / itemsWithRating : 0;
  stats.avgPrice = itemsWithPrice > 0 ? totalPrice / itemsWithPrice : 0;

  return stats;
}

export function sortItems<T extends Item>(
  items: T[],
  sortBy: 'name' | 'price' | 'rating' | 'newest' | 'oldest' | 'random'
): T[] {
  const sorted = [...items];

  switch (sortBy) {
    case 'price':
      sorted.sort((a, b) => (a.itemcost ?? 0) - (b.itemcost ?? 0));
      break;
    case 'rating':
      sorted.sort((a, b) => (b.itemlikerating ?? 0) - (a.itemlikerating ?? 0));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      break;
    case 'oldest':
      sorted.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      break;
    case 'random':
      sorted.sort(() => Math.random() - 0.5);
      break;
    case 'name':
    default:
      sorted.sort((a, b) => (a.itemtype ?? '').localeCompare(b.itemtype ?? ''));
      break;
  }

  return sorted;
}

export function searchItems<T extends FilterableItem>(items: T[], query: string): T[] {
  const lowerQuery = query.trim().toLowerCase();
  if (!lowerQuery) return items;

  return items.filter((item) =>
    [
      item.itemtype,
      getItemCategory(item),
      getItemSubcategory(item),
      item.primary_color,
      item.secondary_color,
      item.brand,
      item.fit,
      item.warmth_level,
      item.itemcomment,
    ].some((value) => value?.toLowerCase().includes(lowerQuery))
  );
}

export default {
  filterItemsByTags,
  extractUniqueTagValues,
  getItemCategory,
  getItemSubcategory,
  getTagStatistics,
  sortItems,
  searchItems,
};
