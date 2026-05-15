import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { Item, Wash } from '../types';
import { api } from '../services/api';
import { format } from 'date-fns';
import { ItemSVGIcon } from './ItemSVGIcon';
import { cn } from '../lib/utils';

interface BulkWashModalProps {
  isOpen: boolean;
  items: Item[];
  onClose: () => void;
  onWashLogged: () => void;
}

export function BulkWashModal({ isOpen, items, onClose, onWashLogged }: BulkWashModalProps) {
  const [washDate, setWashDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter to only items with in_temp=true
  const tempItems = useMemo(() => {
    return items.filter(item => item.in_temp === true);
  }, [items]);

  const handleToggleItem = (itemId: number) => {
    const newSelected = new Set(selectedItemIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItemIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === tempItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(tempItems.map(item => item.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemIds.size === 0) {
      setError('Please select at least one item to wash');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const washDateTime = new Date(washDate);
      washDateTime.setHours(12, 0, 0, 0);

      // Create wash records for all selected items with the same date
      const selectedItems = Array.from(selectedItemIds);
      
      await Promise.all([
        // Log wash for all selected items
        ...selectedItems.map(itemId =>
          api.create<Wash>('wash', {
            dk_itemid: itemId,
            lastwashdate: washDateTime.toISOString(),
          })
        ),
        // Clear in_temp flag for all selected items
        ...selectedItems.map(itemId =>
          api.update<Item>('item', itemId, {
            in_temp: false,
          })
        ),
      ]);

      setWashDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedItemIds(new Set());
      onWashLogged();
      onClose();
    } catch (err) {
      console.error('Failed to log bulk wash:', err);
      setError(err instanceof Error ? err.message : 'Failed to log wash');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl mx-4 z-50 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 dark:from-blue-950 to-zinc-50 dark:to-zinc-900 px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Bulk Wash Items</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tempItems.length} item{tempItems.length !== 1 ? 's' : ''} in temporary storage</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {tempItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400">No items in temporary storage</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest text-xs">
                    Wash Date
                  </label>
                  <input
                    type="date"
                    value={washDate}
                    onChange={(e) => setWashDate(e.target.value)}
                    className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                    required
                  />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Select Items to Wash</h3>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {selectedItemIds.size === tempItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  {tempItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={cn(
                        "p-3 flex items-center gap-3 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0",
                        selectedItemIds.has(item.id)
                          ? "bg-blue-50 dark:bg-blue-950"
                          : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selectedItemIds.has(item.id)
                          ? "bg-blue-600 border-blue-600"
                          : "border-zinc-300 dark:border-zinc-600"
                      )}>
                        {selectedItemIds.has(item.id) && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>

                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600">
                        <ItemSVGIcon
                          itemtype={item.itemtype}
                          size={20}
                          color={item.itemtype}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-50">{item.itemtype}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Size: {item.itemsize || 'N/A'}</p>
                      </div>

                      <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">#{item.id}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                    <span className="font-bold">{selectedItemIds.size}</span> item{selectedItemIds.size !== 1 ? 's' : ''} selected for washing
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 px-6 py-4 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedItemIds.size === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {isLoading ? 'Logging...' : `Wash ${selectedItemIds.size} Item${selectedItemIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
