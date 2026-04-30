import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Home } from '../types';
import { api } from '../services/api';

interface EditHomeModalProps {
  isOpen: boolean;
  home: Home;
  onClose: () => void;
  onHomeUpdated: () => void;
}

export function EditHomeModal({ isOpen, home, onClose, onHomeUpdated }: EditHomeModalProps) {
  const [homename, setHomename] = useState(home.homename);
  const [homeaddress, setHomeaddress] = useState(home.homeaddress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHomename(home.homename);
      setHomeaddress(home.homeaddress);
      setError(null);
    }
  }, [isOpen, home]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homename.trim() || !homeaddress.trim()) {
      setError('Home name and address are required.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await api.update<Home>('home', home.id, { homename: homename.trim(), homeaddress: homeaddress.trim() });
      onHomeUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update home');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Edit Home</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Update home location details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Home Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={homename}
              onChange={(e) => setHomename(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={homeaddress}
              onChange={(e) => setHomeaddress(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
