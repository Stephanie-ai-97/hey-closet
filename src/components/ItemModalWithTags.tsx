import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api';
import { Info, Item } from '../types';
import { useMetadata } from '../hooks/useMetadata';
import { useTagMetadata } from '../hooks/useTagManagement';
import { CategorySelector } from './CategorySelector';
import { ColorPicker, MultiSelect } from './MultiSelect';
import {
  COLOR_OPTIONS,
  getFitTypesArray,
  getWarmthLevelsArray,
  formatTagLabel,
} from '../lib/tagConstants';
import { getItemCategory, getItemSubcategory } from '../lib/tagFiltering';

interface ItemModalWithTagsProps {
  closetId: number;
  onClose: () => void;
  onSave: (item: Item) => void;
  existingItem?: Item;
}

function getResponseId(response: any, pkField: string): number {
  return response?.data?.[pkField] ?? response?.[pkField] ?? response?.data?.id ?? response?.id;
}

export const ItemModalWithTags: React.FC<ItemModalWithTagsProps> = ({
  closetId,
  onClose,
  onSave,
  existingItem,
}) => {
  const { colours, materials, styles } = useMetadata();
  const { seasons, occasions } = useTagMetadata();

  const [category, setCategory] = useState(existingItem ? getItemCategory(existingItem) : '');
  const [subcategory, setSubcategory] = useState(existingItem ? getItemSubcategory(existingItem) : '');
  const [itemsize, setItemsize] = useState(existingItem?.itemsize || '');
  const [itemcost, setItemcost] = useState(existingItem?.itemcost?.toString() || '');
  const [itemlikerating, setItemlikerating] = useState(existingItem?.itemlikerating || 5);
  const [itemcomment, setItemcomment] = useState(existingItem?.itemcomment || '');
  const [itemwashmethod, setItemwashmethod] = useState(existingItem?.itemwashmethod || '');
  const [primaryColor, setPrimaryColor] = useState(existingItem?.primary_color || '');
  const [secondaryColor, setSecondaryColor] = useState(existingItem?.secondary_color || '');
  const [texture, setTexture] = useState('');
  const [fit, setFit] = useState(existingItem?.fit || '');
  const [warmthLevel, setWarmthLevel] = useState(existingItem?.warmth_level || '');
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<number[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styleOptions = useMemo(
    () =>
      styles
        .filter((style) => style.styletype)
        .map((style) => ({ id: style.id.toString(), label: formatTagLabel(style.styletype) })),
    [styles]
  );

  const seasonOptions = seasons.map((season) => ({
    id: season.id.toString(),
    label: formatTagLabel(season.season_name),
  }));

  const occasionOptions = occasions.map((occasion) => ({
    id: occasion.id.toString(),
    label: formatTagLabel(occasion.occasion_name),
  }));

  const materialOptions = Array.from(
    new Set<string>(
      materials
        .map((material) => material.texture)
        .filter((texture): texture is string => typeof texture === 'string' && texture.length > 0)
    )
  ).map((material) => ({ id: material, label: formatTagLabel(material) }));

  const warmthOptions = getWarmthLevelsArray().map((level) => ({
    id: level,
    label: formatTagLabel(level),
  }));

  const fitOptions = getFitTypesArray().map((fitType) => ({
    id: fitType,
    label: formatTagLabel(fitType),
  }));

  const handleAddCustomTag = () => {
    const nextTag = customTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (nextTag && !customTags.includes(nextTag)) {
      setCustomTags((prev) => [...prev, nextTag]);
    }
    setCustomTagInput('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const itemData = {
        dk_closet: closetId,
        itemtype: subcategory || category,
        itemsize,
        itemcost: itemcost ? parseFloat(itemcost) : 0,
        itemlikerating,
        itemcomment,
        itemwashmethod,
        isoncamera: existingItem?.isoncamera ?? false,
      };

      let savedItem: Item;
      if (existingItem) {
        await api.update<Item>('item', existingItem.id, itemData);
        savedItem = { ...existingItem, ...itemData };
      } else {
        savedItem = await api.create<Item>('item', itemData);
      }

      const itemId = savedItem.id ?? getResponseId(savedItem, 'pk_itemid');

      if (!existingItem) {
        const colourResponse = await api.create<any>('colour', {
          colouroverall: primaryColor,
          majorcolour: primaryColor,
          minorcolour: secondaryColor || primaryColor,
        });

        const materialResponse = await api.create<any>('material', {
          texture,
          softness: '',
          thickness: warmthLevel,
        });

        const selectedStyleId = selectedStyles[0];
        const styleResponse = selectedStyleId
          ? null
          : await api.create<any>('style', {
              styletype: category || subcategory,
              styleyear: new Date().getFullYear(),
              stylefitsize: fit || itemsize,
            });

        await api.create<Info>('info', {
          dk_itemid: itemId,
          dk_styleid: selectedStyleId ?? getResponseId(styleResponse, 'pk_styleid'),
          dk_colourid: getResponseId(colourResponse, 'pk_colourid'),
          dk_material: getResponseId(materialResponse, 'pk_material'),
        });
      }

      for (const seasonId of selectedSeasons) {
        await api.create('itemtag', { dk_itemid: itemId, dk_seasonid: seasonId, tag_source: 'user' });
      }

      for (const styleId of selectedStyles) {
        await api.create('itemtag', { dk_itemid: itemId, dk_styleid: styleId, tag_source: 'user' });
      }

      for (const occasionId of selectedOccasions) {
        await api.create('itemtag', { dk_itemid: itemId, dk_occasionid: occasionId, tag_source: 'user' });
      }

      for (const tagName of customTags) {
        await api.create('customtag', { dk_itemid: itemId, tag_name: tagName, tag_category: 'user_defined' });
      }

      onSave(savedItem);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save item';
      setError(message);
      console.error('[ItemModalWithTags]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-2xl shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-xl font-semibold">{existingItem ? 'Edit Item' : 'Add New Item'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Item</h3>
            <CategorySelector
              selectedCategory={category}
              selectedSubcategory={subcategory}
              onCategoryChange={setCategory}
              onSubcategoryChange={setSubcategory}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Size"
                value={itemsize}
                onChange={(event) => setItemsize(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Cost"
                value={itemcost}
                onChange={(event) => setItemcost(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Normalized Metadata</h3>
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Overall Colour"
                selectedColor={primaryColor}
                colors={COLOR_OPTIONS as unknown as string[]}
                onColorChange={setPrimaryColor}
                allowCustom
              />
              <ColorPicker
                label="Minor Colour"
                selectedColor={secondaryColor}
                colors={COLOR_OPTIONS as unknown as string[]}
                onColorChange={setSecondaryColor}
                allowCustom
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MultiSelect
                label="Material"
                options={materialOptions}
                selectedIds={texture ? [texture] : []}
                onSelectionChange={(ids) => setTexture(ids[0] || '')}
                maxSelections={1}
              />
              <MultiSelect
                label="Warmth"
                options={warmthOptions}
                selectedIds={warmthLevel ? [warmthLevel] : []}
                onSelectionChange={(ids) => setWarmthLevel(ids[0] || '')}
                maxSelections={1}
              />
            </div>
            <MultiSelect
              label="Fit"
              options={fitOptions}
              selectedIds={fit ? [fit] : []}
              onSelectionChange={(ids) => setFit(ids[0] || '')}
              maxSelections={1}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Tags</h3>
            <MultiSelect
              label="Seasons"
              options={seasonOptions}
              selectedIds={selectedSeasons.map(String)}
              onSelectionChange={(ids) => setSelectedSeasons(ids.map(Number))}
            />
            <MultiSelect
              label="Styles"
              options={styleOptions}
              selectedIds={selectedStyles.map(String)}
              onSelectionChange={(ids) => setSelectedStyles(ids.map(Number))}
            />
            <MultiSelect
              label="Occasions"
              options={occasionOptions}
              selectedIds={selectedOccasions.map(String)}
              onSelectionChange={(ids) => setSelectedOccasions(ids.map(Number))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add a custom tag..."
                value={customTagInput}
                onChange={(event) => setCustomTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {customTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCustomTags((prev) => prev.filter((value) => value !== tag))}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {tag}
                  <X size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              placeholder="Comments"
              value={itemcomment}
              onChange={(event) => setItemcomment(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <input
              type="text"
              placeholder="Wash method"
              value={itemwashmethod}
              onChange={(event) => setItemwashmethod(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Like Rating ({itemlikerating}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={itemlikerating}
                onChange={(event) => setItemlikerating(parseInt(event.target.value, 10))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !category || !subcategory || (!existingItem && !primaryColor)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModalWithTags;
