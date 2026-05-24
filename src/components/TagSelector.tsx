import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';

interface TagSelectorProps {
  label: string;
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
  allowCustom?: boolean;
  placeholder?: string;
  maxTags?: number;
  searchable?: boolean;
  className?: string;
}

/**
 * TagSelector Component
 * A reusable, searchable tag selector with custom tag support
 * Supports single and multi-select operations
 */
export const TagSelector: React.FC<TagSelectorProps> = ({
  label,
  selectedTags,
  availableTags,
  onTagsChange,
  allowCustom = false,
  placeholder = 'Search or add tags...',
  maxTags = 10,
  searchable = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [customInput, setCustomInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(searchInput.toLowerCase()) &&
      !selectedTags.includes(tag)
  );

  const handleSelectTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = maxTags ? selectedTags.slice(0, maxTags - 1).concat(tag) : [...selectedTags, tag];
      onTagsChange(newTags);
    }
    setSearchInput('');
  };

  const handleAddCustomTag = () => {
    if (customInput.trim() && allowCustom) {
      const newTag = customInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (!selectedTags.includes(newTag)) {
        const newTags = maxTags ? selectedTags.slice(0, maxTags - 1).concat(newTag) : [...selectedTags, newTag];
        onTagsChange(newTags);
      }
      setCustomInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-50 rounded-lg border border-gray-300 min-h-[40px]">
        {selectedTags.length === 0 ? (
          <span className="text-gray-400 text-sm">No tags selected</span>
        ) : (
          selectedTags.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Search and Add Input */}
      <div className="relative">
        <div className="flex gap-2 mb-3">
          {searchable && (
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder={placeholder}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {allowCustom && (
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Add custom tag..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomTag();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="absolute right-2 top-2 text-green-600 hover:text-green-700"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Menu */}
        {isOpen && searchable && filteredTags.length > 0 && (
          <div className="absolute top-14 left-0 right-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelectTag(tag)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm transition"
              >
                <div className="w-4 h-4 border border-gray-300 rounded checked:bg-blue-500 flex items-center justify-center" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tag Count Info */}
      {maxTags && (
        <div className="text-xs text-gray-500 mt-2">
          {selectedTags.length}/{maxTags} tags selected
        </div>
      )}
    </div>
  );
};

export default TagSelector;
