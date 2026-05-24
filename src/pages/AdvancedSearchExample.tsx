import React, { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { CategorySelector } from '../components/CategorySelector';
import { ColorPicker, MultiSelect } from '../components/MultiSelect';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTagFilter, useTagMetadata } from '../hooks/useTagManagement';
import { COLOR_OPTIONS, formatTagLabel, getWarmthLevelsArray } from '../lib/tagConstants';
import {
  filterItemsByTags,
  getItemCategory,
  getTagStatistics,
  searchItems,
  sortItems,
} from '../lib/tagFiltering';

export const AdvancedSearchExample: React.FC = () => {
  const { items = [], loading, error } = useDashboardData();
  const { seasons, styles, occasions } = useTagMetadata();
  const filter = useTagFilter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'rating'>('newest');

  const filteredItems = useMemo(() => {
    const filtered = filterItemsByTags(items, {
      categories: filter.categoryFilter ? [filter.categoryFilter] : undefined,
      primaryColors: filter.colorFilter ? [filter.colorFilter] : undefined,
      warmthLevels: filter.warmthFilter ? [filter.warmthFilter] : undefined,
    });

    return sortItems(searchItems(filtered, searchQuery), sortBy);
  }, [items, filter.categoryFilter, filter.colorFilter, filter.warmthFilter, searchQuery, sortBy]);

  const stats = useMemo(() => getTagStatistics(items), [items]);

  const reset = () => {
    filter.resetFilters();
    setSearchQuery('');
    setSortBy('newest');
  };

  if (loading) return <div className="p-6 text-gray-500">Loading items...</div>;
  if (error) return <div className="p-6 text-red-700">Error loading items: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
          <p className="text-gray-600">Filters use derived item metadata and normalized tag tables.</p>
        </div>
        {filter.hasActiveFilters && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:text-blue-900"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Item type, color, notes..."
              />
            </div>
          </div>

          <CategorySelector
            selectedCategory={filter.categoryFilter}
            selectedSubcategory=""
            onCategoryChange={filter.setCategoryFilter}
            onSubcategoryChange={() => undefined}
          />

          <ColorPicker
            label="Colour"
            selectedColor={filter.colorFilter}
            colors={COLOR_OPTIONS as unknown as string[]}
            onColorChange={filter.setColorFilter}
          />

          <MultiSelect
            label="Warmth"
            options={getWarmthLevelsArray().map((value) => ({ id: value, label: formatTagLabel(value) }))}
            selectedIds={filter.warmthFilter ? [filter.warmthFilter] : []}
            onSelectionChange={(ids) => filter.setWarmthFilter(ids[0] || '')}
            maxSelections={1}
          />
        </aside>

        <main className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Results ({filteredItems.length})</h2>
              <p className="text-sm text-gray-500">
                {stats.totalItems} items, {seasons.length} seasons, {styles.length} styles, {occasions.length} occasions
              </p>
            </div>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <article key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">{item.itemtype}</h3>
                    <p className="text-sm text-gray-500">{formatTagLabel(getItemCategory(item))}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">${item.itemcost?.toFixed(2) || 'N/A'}</span>
                </div>
                {item.itemcomment && <p className="mt-3 text-sm text-gray-600">{item.itemcomment}</p>}
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdvancedSearchExample;
