import React, { useState } from 'react';
import { X } from 'lucide-react';
import { formatTagLabel } from '../lib/tagConstants';

interface SelectableOption {
  id: string;
  label: string;
  color?: string;
}

interface MultiSelectProps {
  label: string;
  options: SelectableOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelections?: number;
  showColorPreviews?: boolean;
  className?: string;
}

/**
 * MultiSelect Component
 * Generic multi-select component for seasons, styles, occasions, etc.
 * Supports color previews and max selections
 */
export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selectedIds,
  onSelectionChange,
  maxSelections,
  showColorPreviews = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else if (!maxSelections || selectedIds.length < maxSelections) {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Selected Items */}
      <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-300 min-h-[40px]">
        {selectedOptions.length === 0 ? (
          <span className="text-gray-400 text-sm">None selected</span>
        ) : (
          selectedOptions.map((option) => (
            <div
              key={option.id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {showColorPreviews && option.color && (
                <div
                  className="w-3 h-3 rounded-full border border-blue-400"
                  style={{ backgroundColor: option.color }}
                />
              )}
              <span>{option.label}</span>
              <button
                type="button"
                onClick={() => handleToggle(option.id)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {selectedIds.length === 0
            ? 'Select options...'
            : `${selectedIds.length} selected${maxSelections ? `/${maxSelections}` : ''}`}
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm transition"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => handleToggle(option.id)}
                  disabled={maxSelections && !selectedIds.includes(option.id) && selectedIds.length >= maxSelections}
                  className="w-4 h-4 rounded border-gray-300"
                />
                {showColorPreviews && option.color && (
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {maxSelections && (
        <div className="text-xs text-gray-500 mt-1">
          {selectedIds.length}/{maxSelections} selected
        </div>
      )}
    </div>
  );
};

interface ColorPickerProps {
  label: string;
  selectedColor?: string;
  colors: string[];
  onColorChange: (color: string) => void;
  allowCustom?: boolean;
  className?: string;
}

/**
 * ColorPicker Component
 * Visual color picker with predefined colors and optional custom input
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  selectedColor,
  colors,
  onColorChange,
  allowCustom = false,
  className = '',
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customColor, setCustomColor] = useState('');

  const colorMap: Record<string, string> = {
    white: '#FFFFFF',
    black: '#000000',
    gray: '#808080',
    red: '#FF0000',
    pink: '#FFC0CB',
    magenta: '#FF00FF',
    purple: '#800080',
    blue: '#0000FF',
    navy: '#000080',
    cyan: '#00FFFF',
    teal: '#008080',
    green: '#008000',
    olive: '#808000',
    yellow: '#FFFF00',
    gold: '#FFD700',
    orange: '#FFA500',
    brown: '#A52A2A',
    tan: '#D2B48C',
    beige: '#F5F5DC',
    cream: '#FFFDD0',
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>

      {/* Color Grid */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorChange(color)}
            title={color}
            className={`w-10 h-10 rounded-lg border-2 transition ${
              selectedColor === color ? 'border-gray-900 shadow-md' : 'border-gray-300 hover:border-gray-500'
            }`}
            style={{ backgroundColor: colorMap[color.toLowerCase()] || color }}
          />
        ))}
      </div>

      {/* Selected Color Display */}
      {selectedColor && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
          <div
            className="w-5 h-5 rounded border border-gray-300"
            style={{ backgroundColor: colorMap[selectedColor.toLowerCase()] || selectedColor }}
          />
          <span className="text-gray-700">{formatTagLabel(selectedColor)}</span>
        </div>
      )}

      {/* Custom Color Option */}
      {allowCustom && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showCustom ? 'Hide custom color' : 'Add custom color'}
          </button>
          {showCustom && (
            <input
              type="color"
              value={customColor || '#000000'}
              onChange={(e) => {
                setCustomColor(e.target.value);
                onColorChange(e.target.value);
              }}
              className="mt-2 w-full h-10 rounded-lg cursor-pointer"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
