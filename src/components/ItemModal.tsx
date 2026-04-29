import { useState } from 'react';
import { X } from 'lucide-react';
import { Item, Storage, Home } from '../types';
import { api } from '../services/api';

interface ItemModalProps {
  isOpen: boolean;
  storages: Storage[];
  homes: Home[];
  onClose: () => void;
  onItemAdded: () => void;
}

export function ItemModal({ isOpen, storages, homes, onClose, onItemAdded }: ItemModalProps) {
  const [dk_closet, setDk_closet] = useState<string>('');
  const [itemtype, setItemtype] = useState('');
  const [itemsize, setItemsize] = useState('');
  const [isoncamera, setIsoncamera] = useState(false);
  const [itemlikerating, setItemlikerating] = useState(5);
  const [itemcost, setItemcost] = useState('');
  const [itemcomment, setItemcomment] = useState('');
  const [itemwashmethod, setItemwashmethod] = useState('hand wash');
  const [colouroverall, setColouroverall] = useState('');
  const [texture, setTexture] = useState('');
  const [styletype, setStyletype] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dk_closet || !itemtype || !itemsize) {
      setError('Please fill in all required fields (Storage Location, Item Type, Size)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create item
      const itemData: any = {
        dk_closet: Number(dk_closet),
        itemtype,
        itemsize,
        isoncamera,
        itemlikerating,
        itemcomment,
        itemwashmethod,
      };

      // Only add cost if provided
      if (itemcost) {
        itemData.itemcost = parseFloat(itemcost);
      } else {
        itemData.itemcost = 0;
      }

      const createdItem = await api.create<Item>('item', itemData);

      // Create colour info if provided
      if (colouroverall) {
        await api.create('colour', {
          colouroverall,
          colourinner: '',
          colourouter: '',
        });
      }

      // Create material info if provided
      if (texture) {
        await api.create('material', {
          texture,
          softness: '',
          thickness: '',
        });
      }

      // Create style info if provided
      if (styletype) {
        await api.create('style', {
          styletype,
          styleyear: new Date().getFullYear(),
          stylefitsize: itemsize,
        });
      }

      // Reset form
      setDk_closet('');
      setItemtype('');
      setItemsize('');
      setIsoncamera(false);
      setItemlikerating(5);
      setItemcost('');
      setItemcomment('');
      setItemwashmethod('hand wash');
      setColouroverall('');
      setTexture('');
      setStyletype('');
      
      onItemAdded();
      onClose();
    } catch (err) {
      console.error('Failed to create item:', err);
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setIsLoading(false);
    }
  };

  // Group storages by home
  const storagesByHome = homes.map(home => ({
    home,
    storages: storages.filter(s => s.dk_homelocation === home.id)
  }));

  if (!isOpen) return null;

  // Group storages by home
  const storagesByHome = homes.map(home => ({
    home,
    storages: storages.filter(s => s.dk_homelocation === home.id)
  }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Add New Item</h2>
            <p className="text-sm text-zinc-500 mt-1">Enter the details of your new wardrobe item</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Storage Location - Required */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">
              Storage Location <span className="text-red-500">*</span>
            </label>
            <select
              value={dk_closet}
              onChange={(e) => setDk_closet(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
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
            {/* Item Type - Required */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Item Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={itemtype}
                onChange={(e) => setItemtype(e.target.value)}
                placeholder="e.g., T-shirt, Jeans"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
                required
              />
            </div>

            {/* Item Size - Required */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Size <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={itemsize}
                onChange={(e) => setItemsize(e.target.value)}
                placeholder="e.g., M, L, XL"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Colour and Material Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Colour */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Colour
              </label>
              <input
                type="text"
                value={colouroverall}
                onChange={(e) => setColouroverall(e.target.value)}
                placeholder="e.g., Black, Navy Blue"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              />
            </div>

            {/* Material/Texture */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Material
              </label>
              <input
                type="text"
                value={texture}
                onChange={(e) => setTexture(e.target.value)}
                placeholder="e.g., Cotton, Polyester"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              />
            </div>
          </div>

          {/* Style and Cost */}
          <div className="grid grid-cols-2 gap-4">
            {/* Style */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Style
              </label>
              <input
                type="text"
                value={styletype}
                onChange={(e) => setStyletype(e.target.value)}
                placeholder="e.g., Casual, Formal"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              />
            </div>

            {/* Item Cost - Optional */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Cost ($) <span className="text-zinc-400 text-xs">(optional)</span>
              </label>
              <input
                type="number"
                value={itemcost}
                onChange={(e) => setItemcost(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              />
            </div>
          </div>

          {/* Like Rating and Wash Method */}
          <div className="grid grid-cols-2 gap-4">
            {/* Like Rating */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Rating (1-10)
              </label>
              <input
                type="number"
                value={itemlikerating}
                onChange={(e) => setItemlikerating(Number(e.target.value))}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              />
            </div>

            {/* Wash Method */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">
                Wash Method
              </label>
              <select
                value={itemwashmethod}
                onChange={(e) => setItemwashmethod(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              >
                <option value="hand wash">Hand Wash</option>
                <option value="machine wash cold">Machine Wash - Cold</option>
                <option value="machine wash warm">Machine Wash - Warm</option>
                <option value="machine wash hot">Machine Wash - Hot</option>
                <option value="dry clean">Dry Clean</option>
                <option value="delicate">Delicate</option>
              </select>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">
              Description
            </label>
            <textarea
              value={itemcomment}
              onChange={(e) => setItemcomment(e.target.value)}
              placeholder="Add any notes or details about this item..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all resize-none"
            />
          </div>

          {/* On Camera Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isoncamera"
              checked={isoncamera}
              onChange={(e) => setIsoncamera(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 cursor-pointer"
            />
            <label htmlFor="isoncamera" className="text-sm font-medium text-zinc-900 cursor-pointer">
              Item is on camera
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
