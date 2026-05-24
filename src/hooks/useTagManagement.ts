import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { Season, Style, Occasion, ItemTag, CustomTag } from '../types';

export function useTagMetadata() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetadata = useCallback(async () => {
    try {
      setLoading(true);
      const [seasonsData, stylesData, occasionsData] = await Promise.all([
        api.list<Season>('season'),
        api.list<Style>('style'),
        api.list<Occasion>('occasion'),
      ]);

      setSeasons(seasonsData);
      setStyles(stylesData);
      setOccasions(occasionsData);
      setError(null);
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error('Failed to fetch tag metadata');
      setError(nextError);
      console.error('[useTagMetadata] Error:', nextError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return { seasons, styles, occasions, loading, error, refetch: fetchMetadata };
}

export function useItemTags(itemId: number) {
  const [itemTags, setItemTags] = useState<ItemTag[]>([]);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchItemTags = useCallback(async () => {
    if (!itemId) {
      setItemTags([]);
      setCustomTags([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [tagsData, customTagsData] = await Promise.all([
        api.list<ItemTag>('itemtag', { dk_itemid: itemId }),
        api.list<CustomTag>('customtag', { dk_itemid: itemId }),
      ]);

      setItemTags(tagsData);
      setCustomTags(customTagsData);
      setError(null);
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error('Failed to fetch item tags');
      setError(nextError);
      console.error('[useItemTags] Error:', nextError);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchItemTags();
  }, [fetchItemTags]);

  const addTag = useCallback(
    async (tag: Partial<Omit<ItemTag, 'id' | 'dk_itemid'>>) => {
      const created = await api.create<ItemTag>('itemtag', {
        ...tag,
        dk_itemid: itemId,
        tag_source: tag.tag_source ?? 'user',
      });
      setItemTags((prev) => [...prev, created]);
      return created;
    },
    [itemId]
  );

  const removeTag = useCallback(async (tagId: number) => {
    await api.delete('itemtag', tagId);
    setItemTags((prev) => prev.filter((tag) => tag.id !== tagId));
  }, []);

  const addCustomTag = useCallback(
    async (tagName: string, category: CustomTag['tag_category'] = 'user_defined') => {
      const created = await api.create<CustomTag>('customtag', {
        dk_itemid: itemId,
        tag_name: tagName.toLowerCase().trim().replace(/\s+/g, '-'),
        tag_category: category,
      });
      setCustomTags((prev) => [...prev, created]);
      return created;
    },
    [itemId]
  );

  const removeCustomTag = useCallback(async (tagId: number) => {
    await api.delete('customtag', tagId);
    setCustomTags((prev) => prev.filter((tag) => tag.id !== tagId));
  }, []);

  return {
    itemTags,
    customTags,
    loading,
    error,
    refetch: fetchItemTags,
    addTag,
    removeTag,
    addCustomTag,
    removeCustomTag,
  };
}

export function useTagFilter() {
  const [seasonIds, setSeasonIds] = useState<number[]>([]);
  const [styleIds, setStyleIds] = useState<number[]>([]);
  const [occasionIds, setOccasionIds] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [warmthFilter, setWarmthFilter] = useState('');

  const buildFilterQuery = useCallback(() => {
    const filters: Record<string, string> = {};

    if (categoryFilter) filters.category = categoryFilter;
    if (colorFilter) filters.primary_color = colorFilter;
    if (warmthFilter) filters.warmth_level = warmthFilter;

    return filters;
  }, [categoryFilter, colorFilter, warmthFilter]);

  const resetFilters = useCallback(() => {
    setSeasonIds([]);
    setStyleIds([]);
    setOccasionIds([]);
    setCategoryFilter('');
    setColorFilter('');
    setWarmthFilter('');
  }, []);

  return {
    seasonIds,
    styleIds,
    occasionIds,
    categoryFilter,
    colorFilter,
    warmthFilter,
    setSeasonIds,
    setStyleIds,
    setOccasionIds,
    setCategoryFilter,
    setColorFilter,
    setWarmthFilter,
    buildFilterQuery,
    resetFilters,
    hasActiveFilters:
      seasonIds.length > 0 ||
      styleIds.length > 0 ||
      occasionIds.length > 0 ||
      Boolean(categoryFilter) ||
      Boolean(colorFilter) ||
      Boolean(warmthFilter),
  };
}

export function useTagSuggestions(itemData: Record<string, unknown>) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const generated = [
        itemData.category,
        itemData.subcategory,
        itemData.primary_color ? `color: ${itemData.primary_color}` : undefined,
        itemData.fit ? `fit: ${itemData.fit}` : undefined,
      ].filter((value): value is string => typeof value === 'string' && value.length > 0);

      setSuggestions(generated);
      setError(null);
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error('Failed to generate suggestions');
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [itemData]);

  useEffect(() => {
    if (Object.keys(itemData).length > 0) generateSuggestions();
  }, [itemData, generateSuggestions]);

  return { suggestions, loading, error, regenerate: generateSuggestions };
}

export default useTagMetadata;
