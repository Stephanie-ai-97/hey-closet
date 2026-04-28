import { PageContainer } from '../components/PageContainer';
import { StorageModal } from '../components/StorageModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { useState, useMemo } from 'react';
import { 
  Home as HomeIcon, 
  ChevronRight, 
  Warehouse as ClosetIcon, 
  Grid3X3,
  List,
  Plus,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Storage, Item } from '../types';

type ViewMode = 'grid' | 'list';

export default function Warehouse() {
  const { homes, storages, items, loading, error, refetch } = useDashboardData();
  const [selectedHomeId, setSelectedHomeId] = useState<number | null>(null);
  const [selectedStorageName, setSelectedStorageName] = useState<string | null>(null);
  const [selectedPartition, setSelectedPartition] = useState<string | null>(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const currentHome = homes.find(h => h.id === selectedHomeId);

  // Get storage units for selected home, grouped by storage name
  const storagesByHome = useMemo(() => {
    if (!selectedHomeId) return [];
    const filtered = storages.filter(s => s.dk_homelocation === selectedHomeId);
    return filtered;
  }, [selectedHomeId, storages]);

  // Get unique storage names for selected home
  const uniqueStorageNames = useMemo(() => {
    const names = [...new Set(storagesByHome.map(s => s.closet))];
    return names;
  }, [storagesByHome]);

  // Get partitions for selected storage name
  const partitionsForStorage = useMemo(() => {
    if (!selectedStorageName) return [];
    return [...new Set(storagesByHome
      .filter(s => s.closet === selectedStorageName)
      .map(s => s.closetpartition))];
  }, [selectedStorageName, storagesByHome]);

  // Get items for selected partition
  const itemsForPartition = useMemo(() => {
    if (!selectedPartition || !selectedStorageName) return [];
    const storageIds = storagesByHome
      .filter(s => s.closet === selectedStorageName && s.closetpartition === selectedPartition)
      .map(s => s.id);
    return items.filter(i => storageIds.includes(i.dk_closet));
  }, [selectedPartition, selectedStorageName, storagesByHome, items]);

  // Calculate item statistics
  const itemStats = useMemo(() => {
    const typeCount = itemsForPartition.reduce((acc, item) => {
      acc[item.itemtype] = (acc[item.itemtype] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: itemsForPartition.length,
      byType: typeCount,
    };
  }, [itemsForPartition]);

  if (loading) return <div className="p-8 animate-pulse">Scanning storage facilities...</div>;

  return (
    <PageContainer 
      title="Warehouse Explorer" 
      subtitle="Navigate through your physical storage infrastructure."
      actions={
        <div className="flex gap-2">
          {selectedStorageName && (
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
                title="Grid View"
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
                title="Compact List"
              >
                <List size={18} />
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsStorageModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus size={16} />
            Add Storage
          </button>
        </div>
      }
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-8 text-sm text-zinc-500 overflow-x-auto whitespace-nowrap pb-2">
        <button 
          onClick={() => { setSelectedHomeId(null); setSelectedStorageName(null); setSelectedPartition(null); }}
          className={cn("hover:text-zinc-900", !selectedHomeId && "text-zinc-900 font-semibold")}
        >
          All Locations
        </button>
        {selectedHomeId && (
          <>
            <ChevronRight size={14} className="shrink-0" />
            <button 
              onClick={() => { setSelectedStorageName(null); setSelectedPartition(null); }}
              className={cn("hover:text-zinc-900", !selectedStorageName && "text-zinc-900 font-semibold")}
            >
              {currentHome?.homename}
            </button>
          </>
        )}
        {selectedStorageName && (
          <>
            <ChevronRight size={14} className="shrink-0" />
            <button 
              onClick={() => setSelectedPartition(null)}
              className={cn("hover:text-zinc-900", !selectedPartition && "text-zinc-900 font-semibold")}
            >
              {selectedStorageName}
            </button>
          </>
        )}
        {selectedPartition && (
          <>
            <ChevronRight size={14} className="shrink-0" />
            <span className="text-zinc-900 font-semibold">{selectedPartition}</span>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedHomeId ? (
          // Show Homes
          <motion.div 
            key="homes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {homes.map(home => (
              <button
                key={home.id}
                onClick={() => setSelectedHomeId(home.id)}
                className="group bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm text-left hover:border-zinc-400 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-zinc-100 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                    <HomeIcon size={24} />
                  </div>
                  <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-900" />
                </div>
                <h3 className="text-lg font-bold">{home.homename}</h3>
                <p className="text-zinc-500 text-sm mt-1">{home.homeaddress}</p>
                <div className="mt-4 pt-4 border-t border-zinc-50 flex gap-4 text-xs font-medium text-zinc-400">
                  <span>{storages.filter(s => s.dk_homelocation === home.id).length} Storage Units</span>
                </div>
              </button>
            ))}
          </motion.div>
        ) : !selectedStorageName ? (
          // Show Storage Names (grouped)
          <motion.div 
            key="storages"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {uniqueStorageNames.map(storageName => {
              const storageCount = storagesByHome.filter(s => s.closet === storageName).length;
              const storageItems = items.filter(i => 
                storagesByHome
                  .filter(s => s.closet === storageName)
                  .map(s => s.id)
                  .includes(i.dk_closet)
              );
              return (
                <button
                  key={storageName}
                  onClick={() => setSelectedStorageName(storageName)}
                  className="group bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm text-left hover:border-zinc-400 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-zinc-100 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                      <ClosetIcon size={24} />
                    </div>
                    <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-900" />
                  </div>
                  <h3 className="text-lg font-bold">{storageName}</h3>
                  <p className="text-zinc-500 text-sm mt-1">{storageCount} Partition{storageCount !== 1 ? 's' : ''}</p>
                  <div className="mt-4 pt-4 border-t border-zinc-50 flex gap-4 text-xs font-medium text-zinc-400">
                    <span>{storageItems.length} Total Items</span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        ) : !selectedPartition ? (
          // Show Partitions
          <motion.div 
            key="partitions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-3'
            }
          >
            {partitionsForStorage.map(partition => {
              const partitionItems = itemsForPartition.filter(i => 
                storagesByHome
                  .filter(s => s.closet === selectedStorageName && s.closetpartition === partition)
                  .map(s => s.id)
                  .includes(i.dk_closet)
              );
              const storageUnit = storagesByHome.find(s => s.closet === selectedStorageName && s.closetpartition === partition);
              
              if (viewMode === 'grid') {
                return (
                  <button
                    key={partition}
                    onClick={() => setSelectedPartition(partition)}
                    className="group bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm text-left hover:border-zinc-400 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-zinc-100 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                        <Grid3X3 size={24} />
                      </div>
                      <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-900" />
                    </div>
                    <h3 className="text-lg font-bold">{partition}</h3>
                    <p className="text-zinc-500 text-sm mt-1">{partitionItems.length} Items</p>
                    <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">
                        {partitionItems.length} Item{partitionItems.length !== 1 ? 's' : ''}
                      </span>
                      {storageUnit?.hasstoragecover && (
                        <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Has Cover
                        </span>
                      )}
                    </div>
                  </button>
                );
              } else {
                return (
                  <button
                    key={partition}
                    onClick={() => setSelectedPartition(partition)}
                    className="group bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-left hover:border-zinc-400 hover:bg-zinc-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-zinc-900">{partition}</h3>
                        <p className="text-sm text-zinc-500 mt-1">{partitionItems.length} Items</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {storageUnit?.hasstoragecover && (
                          <span className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Cover
                          </span>
                        )}
                        <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-900" />
                      </div>
                    </div>
                  </button>
                );
              }
            })}
          </motion.div>
        ) : (
          // Show Items with Statistics
          <motion.div 
            key="items"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200">
                <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-2">Total Items</p>
                <p className="text-4xl font-bold text-indigo-900">{itemStats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
                <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider mb-2">Item Types</p>
                <p className="text-4xl font-bold text-emerald-900">{Object.keys(itemStats.byType).length}</p>
              </div>
            </div>

            {/* Items by Type Breakdown */}
            {Object.keys(itemStats.byType).length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-zinc-900 mb-4">Items by Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(itemStats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between bg-zinc-50 p-4 rounded-lg">
                      <span className="font-medium text-zinc-900">{type}</span>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Item</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Details</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Cost</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Rating</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {itemsForPartition.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
                            <Package size={18} />
                          </div>
                          <span className="font-medium">{item.itemtype}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        Size: {item.itemsize}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">
                        ${item.itemcost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{item.itemlikerating}</span>
                          <span className="text-zinc-300">/ 10</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-xs font-bold text-zinc-900 hover:underline">View Details</button>
                      </td>
                    </tr>
                  ))}
                  {itemsForPartition.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-sm italic">
                        This partition is currently empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StorageModal 
        isOpen={isStorageModalOpen}
        homes={homes}
        storages={storages}
        onClose={() => setIsStorageModalOpen(false)}
        onStorageAdded={() => {
          refetch();
          setIsStorageModalOpen(false);
        }}
      />
    </PageContainer>
  );
}
