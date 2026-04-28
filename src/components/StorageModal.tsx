import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Storage, Home } from '../types';
import { api } from '../services/api';

interface StorageModalProps {
  isOpen: boolean;
  homes: Home[];
  storages: Storage[];
  onClose: () => void;
  onStorageAdded: () => void;
}

export function StorageModal({ isOpen, homes, storages, onClose, onStorageAdded }: StorageModalProps) {
  const [selectedHomeId, setSelectedHomeId] = useState<number | null>(null);
  const [isCreatingNewHome, setIsCreatingNewHome] = useState(false);
  const [newHomeName, setNewHomeName] = useState('');
  const [newHomeAddress, setNewHomeAddress] = useState('');
  
  // Log when modal receives homes prop
  if (isOpen) {
    console.debug('[StorageModal] Modal opened with homes:', homes, 'count:', homes.length);
  }
  
  const [closetName, setClosetName] = useState('');
  const [isCustomClosetName, setIsCustomClosetName] = useState(false);
  const [partition, setPartition] = useState('');
  const [isCustomPartition, setIsCustomPartition] = useState(false);
  
  const [hasStorageCover, setHasStorageCover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get unique storage names for the selected home
  const existingStorageNames = useMemo(() => {
    if (!selectedHomeId) return [];
    const filtered = storages.filter(s => s.dk_homelocation === selectedHomeId);
    const names = [...new Set(filtered.map(s => s.closet))].filter(Boolean);
    console.debug('[StorageModal] Available storage names for home', selectedHomeId, ':', names);
    return names;
  }, [selectedHomeId, storages]);

  // Get partitions for the selected closet (not just the home)
  const existingPartitions = useMemo(() => {
    if (!selectedHomeId || !closetName) return [];
    const filtered = storages.filter(
      s => s.dk_homelocation === selectedHomeId && s.closet === closetName
    );
    const partitions = [...new Set(filtered.map(s => s.closetpartition))].filter(Boolean);
    console.debug('[StorageModal] Available partitions for closet', closetName, ':', partitions);
    return partitions;
  }, [selectedHomeId, closetName, storages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let homeId = selectedHomeId;
    
    console.debug('[StorageModal] Form submission started', {
      isCreatingNewHome,
      selectedHomeId,
      selectedHomeIdType: typeof selectedHomeId,
      selectedHomeIdIsNull: selectedHomeId === null,
      closetName,
      partition,
      hasStorageCover,
    });
    console.debug('[StorageModal] Available homes at submission:', homes.map(h => ({ id: h.id, name: h.homename })));
    
    // Create new home if needed
    if (isCreatingNewHome) {
      if (!newHomeName || !newHomeAddress) {
        setError('Please enter home name and address');
        return;
      }
      try {
        setIsLoading(true);
        console.debug('[StorageModal] Creating new home:', { newHomeName, newHomeAddress });
        const newHome = await api.create<Home>('home', {
          homename: newHomeName,
          homeaddress: newHomeAddress,
        });
        homeId = newHome.id;
        console.debug('[StorageModal] Home created successfully:', newHome);
      } catch (err) {
        console.error('[StorageModal] Failed to create home:', err);
        setError(err instanceof Error ? err.message : 'Failed to create home');
        setIsLoading(false);
        return;
      }
    }

    if (!homeId || !closetName || !partition) {
      const missingFields = [
        !homeId ? 'Home' : null,
        !closetName ? 'Closet/Storage Name' : null,
        !partition ? 'Partition' : null,
      ].filter(Boolean);
      const errorMsg = `Please fill in all required fields: ${missingFields.join(', ')}`;
      setError(errorMsg);
      console.warn('[StorageModal] Validation failed:', errorMsg);
      return;
    }

    setError(null);

    try {
      setIsLoading(true);
      const payload = {
        closet: closetName,
        closetpartition: partition,
        hasstoragecover: hasStorageCover,
        dk_homelocation: homeId,
      };
      
      console.debug('[StorageModal] Sending API request to create storage:', payload);
      
      const result = await api.create<Storage>('storage', payload);
      
      console.debug('[StorageModal] Storage created successfully:', result);

      // Reset form
      setSelectedHomeId(null);
      setIsCreatingNewHome(false);
      setNewHomeName('');
      setNewHomeAddress('');
      setClosetName('');
      setIsCustomClosetName(false);
      setPartition('');
      setIsCustomPartition(false);
      setHasStorageCover(false);
      
      console.debug('[StorageModal] Form reset, calling onStorageAdded callback');
      onStorageAdded();
      onClose();
    } catch (err) {
      console.error('[StorageModal] Failed to add storage:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add storage';
      setError(errorMessage);
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
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md mx-4 z-50 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-zinc-50 px-6 py-4 flex items-center justify-between border-b border-zinc-200 sticky top-0">
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

          {/* Home Selection */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-widest text-xs">
              Home Location
            </label>
            {!isCreatingNewHome ? (
              <div className="space-y-2">
                <select
                  value={selectedHomeId || ''}
                  onChange={(e) => setSelectedHomeId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a home...</option>
                  {homes.map(home => (
                    <option key={home.id} value={home.id}>
                      {home.homename} - {home.homeaddress}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewHome(true)}
                  className="w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                >
                  + Create New Home
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newHomeName}
                  onChange={(e) => setNewHomeName(e.target.value)}
                  placeholder="Home name"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  value={newHomeAddress}
                  onChange={(e) => setNewHomeAddress(e.target.value)}
                  placeholder="Address"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsCreatingNewHome(false)}
                  className="w-full px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors font-medium"
                >
                  ← Back to home list
                </button>
              </div>
            )}
          </div>

          {/* Storage Name */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-widest text-xs">
              Storage Name
            </label>
            {existingStorageNames.length > 0 && !isCustomClosetName ? (
              <div className="space-y-2">
                <select
                  value={closetName}
                  onChange={(e) => setClosetName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select or type new...</option>
                  {existingStorageNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomClosetName(true);
                    setClosetName('');
                  }}
                  className="w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                >
                  + Create New Name
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={closetName}
                  onChange={(e) => setClosetName(e.target.value)}
                  placeholder="e.g., Front Closet, Bedroom Shelves"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                {existingStorageNames.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomClosetName(false);
                      setClosetName('');
                    }}
                    className="w-full px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors font-medium"
                  >
                    ← Back to existing
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Partition */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-widest text-xs">
              Partition
            </label>
            {existingPartitions.length > 0 && !isCustomPartition ? (
              <div className="space-y-2">
                <select
                  value={partition}
                  onChange={(e) => setPartition(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select or type new...</option>
                  {existingPartitions.map(part => (
                    <option key={part} value={part}>{part}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPartition(true);
                    setPartition('');
                  }}
                  className="w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                >
                  + Create New Partition
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={partition}
                  onChange={(e) => setPartition(e.target.value)}
                  placeholder="e.g., Top Shelf, Left Side"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                {existingPartitions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPartition(false);
                      setPartition('');
                    }}
                    className="w-full px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors font-medium"
                  >
                    ← Back to existing
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Storage Cover */}
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
              disabled={isLoading || !closetName || !partition || (!selectedHomeId && !isCreatingNewHome) || (isCreatingNewHome && (!newHomeName || !newHomeAddress))}
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
