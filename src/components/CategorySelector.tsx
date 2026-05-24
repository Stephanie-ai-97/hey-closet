import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CLOTHING_CATEGORIES, SUBCATEGORIES, ClothingCategory, formatTagLabel } from '../lib/tagConstants';

interface CategorySelectorProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
  className?: string;
}

/**
 * CategorySelector Component
 * Hierarchical category and subcategory selector
 * Provides a two-step selection process: Category → Subcategory
 */
export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  className = '',
}) => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);

  const categories = Object.values(CLOTHING_CATEGORIES);
  const subcategories = selectedCategory ? SUBCATEGORIES[selectedCategory as ClothingCategory] : [];

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
    onSubcategoryChange(''); // Reset subcategory when category changes
    setCategoryOpen(false);
  };

  const handleSubcategorySelect = (subcategory: string) => {
    onSubcategoryChange(subcategory);
    setSubcategoryOpen(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoryOpen(!categoryOpen)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className={selectedCategory ? 'text-gray-900' : 'text-gray-400'}>
              {selectedCategory ? formatTagLabel(selectedCategory) : 'Select a category...'}
            </span>
            <ChevronDown
              size={18}
              className={`transition-transform ${categoryOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {categoryOpen && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition text-sm ${
                    selectedCategory === category ? 'bg-blue-100 text-blue-900 font-medium' : ''
                  }`}
                >
                  {formatTagLabel(category)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subcategory Selector */}
      {selectedCategory && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSubcategoryOpen(!subcategoryOpen)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className={selectedSubcategory ? 'text-gray-900' : 'text-gray-400'}>
                {selectedSubcategory ? formatTagLabel(selectedSubcategory) : 'Select a subcategory...'}
              </span>
              <ChevronDown
                size={18}
                className={`transition-transform ${subcategoryOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {subcategoryOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {subcategories.map((subcategory) => (
                  <button
                    key={subcategory}
                    type="button"
                    onClick={() => handleSubcategorySelect(subcategory)}
                    className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition text-sm ${
                      selectedSubcategory === subcategory
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : ''
                    }`}
                  >
                    {formatTagLabel(subcategory)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
