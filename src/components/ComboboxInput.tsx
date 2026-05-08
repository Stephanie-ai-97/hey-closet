import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ComboboxInputProps {
  id: string;
  value: string;
  options: string[];
  placeholder: string;
  hasError?: boolean;
  onChange: (value: string) => void;
}

export function ComboboxInput({ id, value, options, placeholder, hasError, onChange }: ComboboxInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    const search = value.trim().toLowerCase();
    if (!search) return options;

    return options.filter((option) => option.toLowerCase().includes(search));
  }, [options, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 pr-9 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 ${
          hasError
            ? 'border-red-500 dark:border-red-500'
            : 'border-zinc-200 dark:border-zinc-700'
        }`}
        autoComplete="off"
        required
      />
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        aria-label="Toggle options"
      >
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg">
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                {option}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">Type a new value</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
