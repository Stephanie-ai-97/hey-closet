import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Item, Wash } from '../types';
import { api } from '../services/api';
import { format } from 'date-fns';

interface WashModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onWashLogged: () => void;
}

export function WashModal({ isOpen, item, onClose, onWashLogged }: WashModalProps) {
  const [washDate, setWashDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsLoading(true);
    setError(null);

    try {
      const washDateTime = new Date(washDate);
      washDateTime.setHours(12, 0, 0, 0);

      await api.create<Wash>('wash', {
        dk_itemid: item.id,
        lastwashdate: washDateTime.toISOString(),
      });

      setWashDate(format(new Date(), 'yyyy-MM-dd'));
      setNotes('');
      onWashLogged();
      onClose();
    } catch (err) {
      console.error('Failed to log wash:', err);
      setError(err instanceof Error ? err.message : 'Failed to log wash');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md mx-4 z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-950 to-zinc-50 dark:to-zinc-900 px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Log Wash</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.itemtype}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest text-xs">
              Wash Date
            </label>
            <input
              type="date"
              value={washDate}
              onChange={(e) => setWashDate(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest text-xs">
              Item Details
            </label>
            <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Type:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.itemtype}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Size:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.itemsize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Wash Method:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.itemwashmethod || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest text-xs">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this wash..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {isLoading ? 'Logging...' : 'Log Wash'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
