import { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { Item, WearLog } from '../types';
import { api } from '../services/api';

interface WearLogModalProps {
  isOpen: boolean;
  item: Item;
  onClose: () => void;
  onWearLogged: () => void;
}

export function WearLogModal({ isOpen, item, onClose, onWearLogged }: WearLogModalProps) {
  const [wornDate, setWornDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.create<WearLog>('wearlog', {
        dk_itemid: item.id,
        worn_date: wornDate,
        notes: notes || undefined,
      });
      setWornDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      onWearLogged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log wear');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <ShoppingBag size={20} className="text-zinc-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Log Wear</h2>
              <p className="text-xs text-zinc-500">{item.itemtype} · {item.itemsize}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">Date Worn</label>
            <input
              type="date"
              value={wornDate}
              onChange={(e) => setWornDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 mb-2">
              Notes <span className="text-zinc-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., wore to dinner, paired with black jeans..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
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
              {isLoading ? 'Logging...' : 'Log Wear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
