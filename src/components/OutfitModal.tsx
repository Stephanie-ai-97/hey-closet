import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Item, Outfit, OutfitItem } from '../types';
import { api } from '../services/api';
import { ItemSVGIcon } from './ItemSVGIcon';
import { cn } from '../lib/utils';

interface OutfitModalProps {
  isOpen: boolean;
  allItems: Item[];
  onClose: () => void;
  onOutfitCreated: () => void;
}

const OCCASIONS = ['Casual', 'Formal', 'Business', 'Sport', 'Evening', 'Beach', 'Travel', 'Other'];
const SEASONS = ['All Season', 'Spring', 'Summer', 'Autumn', 'Winter'];

export function OutfitModal({ isOpen, allItems, onClose, onOutfitCreated }: OutfitModalProps) {
  const [outfitname, setOutfitname] = useState('');
  const [occasion, setOccasion] = useState('Casual');
  const [season, setSeason] = useState('All Season');
  const [notes, setNotes] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = allItems.filter(item =>
    item.itemtype.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (id: number) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitname.trim()) {
      setError('Outfit name is required.');
      return;
    }
    if (selectedItemIds.length < 1) {
      setError('Select at least one item for the outfit.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const createdOutfit = await api.create<Outfit>('outfit', {
        outfitname: outfitname.trim(),
        occasion,
        season,
        notes: notes || undefined,
      });
      const outfitId = (createdOutfit as any).id ?? (createdOutfit as any).pk_outfit;
      await Promise.all(
        selectedItemIds.map(itemId =>
          api.create<OutfitItem>('outfititem', { dk_outfitid: outfitId, dk_itemid: itemId })
        )
      );
      setOutfitname('');
      setOccasion('Casual');
      setSeason('All Season');
      setNotes('');
      setSelectedItemIds([]);
      setSearchTerm('');
      onOutfitCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create outfit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOutfitname('');
    setOccasion('Casual');
    setSeason('All Season');
    setNotes('');
    setSelectedItemIds([]);
    setSearchTerm('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Create Outfit</h2>
            <p className="text-sm text-zinc-500 mt-1">Name your outfit and pick items from your inventory</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">
              Outfit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={outfitname}
              onChange={(e) => setOutfitname(e.target.value)}
              placeholder="e.g., Weekend Brunch Look"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">Occasion</label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              >
                {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              >
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any styling notes..."
              rows={2}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all resize-none"
            />
          </div>

          {/* Item Picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-zinc-900">
                Select Items <span className="text-red-500">*</span>
              </label>
              {selectedItemIds.length > 0 && (
                <span className="text-xs text-zinc-500">{selectedItemIds.length} selected</span>
              )}
            </div>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[240px] overflow-y-auto border border-zinc-100 rounded-xl p-2">
              {filteredItems.map(item => {
                const selected = selectedItemIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center',
                      selected
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', selected ? 'text-white' : 'text-zinc-500 bg-zinc-100')}>
                      <ItemSVGIcon itemtype={item.itemtype} size={24} color={selected ? 'white' : undefined} />
                    </div>
                    <span className="text-[10px] font-medium leading-tight truncate w-full">{item.itemtype}</span>
                    <span className="text-[9px] opacity-60">{item.itemsize}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={handleClose}
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
              {isLoading ? 'Creating...' : 'Create Outfit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
