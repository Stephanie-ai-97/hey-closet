import { useState } from 'react';
import { X, Inbox } from 'lucide-react';
import { Item, Storage } from '../types';
import { api } from '../services/api';

interface TempModalProps {
  isOpen: boolean;
  item: Item;
  storage?: Storage;
  onClose: () => void;
  onTempToggled: () => void;
}

export function TempModal({ isOpen, item, storage, onClose, onTempToggled }: TempModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleTemp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await api.update<Item>('item', item.id, {
        in_temp: !item.in_temp,
      });
      onTempToggled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  const storageName = storage ? `${storage.closet} - ${storage.closetpartition}` : 'Unknown storage';
  const actionText = item.in_temp ? 'Return to storage' : 'Move to temp basket';
  const description = item.in_temp
    ? `This item will be moved back to ${storageName}.`
    : `This item will be temporarily placed in the basket. Original storage (${storageName}) will be saved for reference.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {item.in_temp ? 'Return from Temp' : 'Move to Temp Basket'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-semibold">{item.itemtype}</span> (Size: {item.itemsize})
          </p>
          <p className="text-sm text-gray-700 mb-4">{description}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleToggleTemp}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
          >
            {isLoading ? 'Updating...' : actionText}
          </button>
        </div>
      </div>
    </div>
  );
}
