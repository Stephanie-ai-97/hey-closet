import { useState } from 'react';
import { X } from 'lucide-react';
import { Storage } from '../types';
import { api } from '../services/api';

interface StorageModalProps {
  isOpen: boolean;
  homeId: number | null;
  onClose: () => void;
  onStorageAdded: () => void;
}

export function StorageModal({ isOpen, homeId, onClose, onStorageAdded }: StorageModalProps) {
  const [closetName, setClosetName] = useState('');
  const [partition, setPartition] = useState('');
  const [hasStorageCover, setHasStorageCover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeId || !closetName || !partition) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.create<Storage>('storage', {
        closet: closetName,
        closetpartition: partition,
        hasstoragecover: hasStorageCover,
        dk_homelocation: homeId,
      });

      setClosetName('');
      setPartition('');
      setHasStorageCover(false);
      onStorageAdded();
      onClose();
    } catch (err) {
      console.error('Failed to add storage:', err);
      setError(err instanceof Error ? err.message : 'Failed to add storage');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !homeId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md mx-4 z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-zinc-50 px-6 py-4 flex items-center justify-between border-b border-zinc-200">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Add Storage</h2>
            <p className="text-sm text-zinc-500">Create a new storage unit</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500" />
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
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-widest text-xs">
              Storage Name
            </label>
            <input
              type="text"
              value={closetName}
              onChange={(e) => setClosetName(e.target.value)}
              placeholder="e.g., Front Closet, Bedroom Shelves"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-widest text-xs">
              Partition
            </label>
            <input
              type="text"
              value={partition}
              onChange={(e) => setPartition(e.target.value)}
              placeholder="e.g., Top Shelf, Left Side"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasCover"
              checked={hasStorageCover}
              onChange={(e) => setHasStorageCover(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <label htmlFor="hasCover" className="text-sm font-medium text-zinc-700">
              Has Storage Cover/Door
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !closetName || !partition}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add Storage'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
