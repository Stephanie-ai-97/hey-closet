import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Item, Storage, Home } from '../types';
import { api } from '../services/api';

interface EditItemModalProps {
  isOpen: boolean;
  item: Item;
  storages: Storage[];
  homes: Home[];
  onClose: () => void;
  onItemUpdated: () => void;
}

export function EditItemModal({ isOpen, item, storages, homes, onClose, onItemUpdated }: EditItemModalProps) {
  const [dk_closet, setDk_closet] = useState<string>(String(item.dk_closet));
  const [itemtype, setItemtype] = useState(item.itemtype);
  const [itemsize, setItemsize] = useState(item.itemsize);
  const [isoncamera, setIsoncamera] = useState(item.isoncamera);
  const [itemlikerating, setItemlikerating] = useState(item.itemlikerating);
  const [itemcost, setItemcost] = useState(String(item.itemcost));
  const [itemcomment, setItemcomment] = useState(item.itemcomment);
  const [itemwashmethod, setItemwashmethod] = useState(item.itemwashmethod);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDk_closet(String(item.dk_closet));
      setItemtype(item.itemtype);
      setItemsize(item.itemsize);
      setIsoncamera(item.isoncamera);
      setItemlikerating(item.itemlikerating);
      setItemcost(String(item.itemcost));
      setItemcomment(item.itemcomment);
      setItemwashmethod(item.itemwashmethod);
      setError(null);
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dk_closet || !itemtype || !itemsize) {
      setError('Storage Location, Item Type, and Size are required.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await api.update<Item>('item', item.id, {
        dk_closet: Number(dk_closet),
        itemtype,
        itemsize,
        isoncamera,
        itemlikerating,
        itemcost: itemcost ? parseFloat(itemcost) : 0,
        itemcomment,
        itemwashmethod,
      });
      onItemUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  const storagesByHome = homes.map(home => ({
    home,
    storages: storages.filter(s => s.dk_homelocation === home.id),
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Edit Item</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Update the details of this wardrobe item</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Storage Location <span className="text-red-500">*</span>
            </label>
            <select
              value={dk_closet}
              onChange={(e) => setDk_closet(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              required
            >
              <option value="">Select a storage location</option>
              {storagesByHome.map(({ home, storages: homeStorages }) => (
                <optgroup key={home.id} label={home.homename}>
                  {homeStorages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage.closet} ({storage.closetpartition})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Item Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={itemtype}
                onChange={(e) => setItemtype(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Size <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={itemsize}
                onChange={(e) => setItemsize(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Cost ($)</label>
              <input
                type="number"
                value={itemcost}
                onChange={(e) => setItemcost(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Rating (1-10)</label>
              <input
                type="number"
                value={itemlikerating}
                onChange={(e) => setItemlikerating(Number(e.target.value))}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Wash Method</label>
            <select
              value={itemwashmethod}
              onChange={(e) => setItemwashmethod(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            >
              <option value="hand wash">Hand Wash</option>
              <option value="machine wash cold">Machine Wash - Cold</option>
              <option value="machine wash warm">Machine Wash - Warm</option>
              <option value="machine wash hot">Machine Wash - Hot</option>
              <option value="dry clean">Dry Clean</option>
              <option value="delicate">Delicate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Description</label>
            <textarea
              value={itemcomment}
              onChange={(e) => setItemcomment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all resize-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="edit-isoncamera"
              checked={isoncamera}
              onChange={(e) => setIsoncamera(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 cursor-pointer"
            />
            <label htmlFor="edit-isoncamera" className="text-sm font-medium text-zinc-900 dark:text-zinc-50 cursor-pointer">
              Item is on camera
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
