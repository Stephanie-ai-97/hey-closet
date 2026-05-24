import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { Season, Style, Occasion, ItemTag, CustomTag } from '../types';

/**
 * Hook for managing tag metadata (seasons, styles, occasions)
 * Caches results to minimize API calls
 */
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

      setSeasons(seasonsData || []);
      setStyles(stylesData || []);
      setOccasions(occasionsData || []);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch tag metadata');
      setError(error);
      console.error('[useTagMetadata] Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return { seasons, styles, occasions, loading, error, refetch: fetchMetadata };
}

/**
 * Hook for managing item tags
 * Handles reading and writing itemtag and customtag records
 */
export function useItemTags(itemId: number) {
  const [itemTags, setItemTags] = useState<ItemTag[]>([]);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchItemTags = useCallback(async () => {
    if (!itemId) return;

    try {
      setLoading(true);
      const [tagsData, customTagsData] = await Promise.all([
        api.list<ItemTag>('itemtag', { dk_itemid: itemId }),
        api.list<CustomTag>('customtag', { dk_itemid: itemId }),
      ]);

      setItemTags(tagsData || []);
      setCustomTags(customTagsData || []);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch item tags');
      setError(error);
      console.error('[useItemTags] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchItemTags();
  }, [fetchItemTags]);

  const addTag = useCallback(
    async (tag: ItemTag) => {
      try {
        const created = await api.create<ItemTag>('itemtag', {
          ...tag,
          dk_itemid: itemId,
        });
        setItemTags((prev) => [...prev, created]);
        return created;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add tag');
        console.error('[useItemTags] Error adding tag:', error);
        throw error;
      }
    },
    [itemId]
  );

  const removeTag = useCallback(async (tagId: number) => {
    try {
      await api.delete('itemtag', tagId);
      setItemTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove tag');
      console.error('[useItemTags] Error removing tag:', error);
      throw error;
    }
  }, []);

  const addCustomTag = useCallback(
    async (tagName: string, category: 'user_defined' | 'ai_generated' = 'user_defined') => {
      try {
        const created = await api.create<CustomTag>('customtag', {\n          dk_itemid: itemId,\n          tag_name: tagName.toLowerCase().replace(/\\s+/g, '-'),\n          tag_category: category,\n        });\n        setCustomTags((prev) => [...prev, created]);\n        return created;\n      } catch (err) {\n        const error = err instanceof Error ? err : new Error('Failed to add custom tag');\n        console.error('[useItemTags] Error adding custom tag:', error);\n        throw error;\n      }\n    },\n    [itemId]\n  );\n\n  const removeCustomTag = useCallback(async (tagId: number) => {\n    try {\n      await api.delete('customtag', tagId);\n      setCustomTags((prev) => prev.filter((t) => t.id !== tagId));\n    } catch (err) {\n      const error = err instanceof Error ? err : new Error('Failed to remove custom tag');\n      console.error('[useItemTags] Error removing custom tag:', error);\n      throw error;\n    }\n  }, []);\n\n  return {\n    itemTags,\n    customTags,\n    loading,\n    error,\n    refetch: fetchItemTags,\n    addTag,\n    removeTag,\n    addCustomTag,\n    removeCustomTag,\n  };\n}\n\n/**\n * Hook for filtering items by tags\n * Generates filter queries based on selected tags\n */\nexport function useTagFilter() {\n  const [seasonIds, setSeasonIds] = useState<number[]>([]);\n  const [styleIds, setStyleIds] = useState<number[]>([]);\n  const [occasionIds, setOccasionIds] = useState<number[]>([]);\n  const [categoryFilter, setCategoryFilter] = useState<string>('');\n  const [colorFilter, setColorFilter] = useState<string>('');\n  const [warmthFilter, setWarmthFilter] = useState<string>('');\n\n  const buildFilterQuery = useCallback(() => {\n    const filters: Record<string, string | number | (string | number)[]> = {};\n\n    if (categoryFilter) filters.category = categoryFilter;\n    if (colorFilter) filters.primary_color = colorFilter;\n    if (warmthFilter) filters.warmth_level = warmthFilter;\n\n    return filters;\n  }, [categoryFilter, colorFilter, warmthFilter]);\n\n  const resetFilters = useCallback(() => {\n    setSeasonIds([]);\n    setStyleIds([]);\n    setOccasionIds([]);\n    setCategoryFilter('');\n    setColorFilter('');\n    setWarmthFilter('');\n  }, []);\n\n  return {\n    // Filter states\n    seasonIds,\n    styleIds,\n    occasionIds,\n    categoryFilter,\n    colorFilter,\n    warmthFilter,\n    // Setters\n    setSeasonIds,\n    setStyleIds,\n    setOccasionIds,\n    setCategoryFilter,\n    setColorFilter,\n    setWarmthFilter,\n    // Utilities\n    buildFilterQuery,\n    resetFilters,\n    hasActiveFilters:\n      seasonIds.length > 0 ||\n      styleIds.length > 0 ||\n      occasionIds.length > 0 ||\n      !!categoryFilter ||\n      !!colorFilter ||\n      !!warmthFilter,\n  };\n}\n\n/**\n * Hook for managing tag suggestions and AI compatibility\n * Prepares data structure for AI tag generation\n */\nexport function useTagSuggestions(itemData: Record<string, any>) {\n  const [suggestions, setSuggestions] = useState<string[]>([]);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<Error | null>(null);\n\n  /**\n   * Generate basic tag suggestions based on item properties\n   * Can be extended to call AI service\n   */\n  const generateSuggestions = useCallback(async () => {\n    try {\n      setLoading(true);\n      const generated: string[] = [];\n\n      // Basic logic for suggestions\n      if (itemData.category) generated.push(itemData.category);\n      if (itemData.subcategory) generated.push(itemData.subcategory);\n      if (itemData.primary_color) generated.push(`color: ${itemData.primary_color}`);\n      if (itemData.brand) generated.push(`brand: ${itemData.brand}`);\n\n      // This is a placeholder for future AI integration\n      // In the future, this could call an AI service:\n      // const aiTags = await generateAITags(itemData);\n      // generated.push(...aiTags);\n\n      setSuggestions(generated);\n      setError(null);\n    } catch (err) {\n      const error = err instanceof Error ? err : new Error('Failed to generate suggestions');\n      setError(error);\n      console.error('[useTagSuggestions] Error:', error);\n    } finally {\n      setLoading(false);\n    }\n  }, [itemData]);\n\n  useEffect(() => {\n    if (itemData && Object.keys(itemData).length > 0) {\n      generateSuggestions();\n    }\n  }, [itemData, generateSuggestions]);\n\n  return { suggestions, loading, error, regenerate: generateSuggestions };\n}\n\nexport default useTagMetadata;\n