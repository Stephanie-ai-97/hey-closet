import { PageContainer } from '../components/PageContainer';
import { StorageModal } from '../components/StorageModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { useState } from 'react';
import { 
  Home as HomeIcon, 
  ChevronRight, 
  Warehouse as ClosetIcon, 
  Grid3X3,
  Search,
  Plus,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Storage, Item } from '../types';

export default function Warehouse() {
  const { homes, storages, items, loading, error, refetch } = useDashboardData();
  const [selectedHomeId, setSelectedHomeId] = useState<number | null>(null);
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  if (loading) return <div className="p-8 animate-pulse">Scanning storage facilities...</div>;

  const currentHome = homes.find(h => h.id === selectedHomeId);
  const filteredStorages = selectedHomeId 
    ? storages.filter(s => s.dk_homelocation === selectedHomeId)
    : [];
  
  const currentStorage = storages.find(s => s.id === selectedStorageId);
  const filteredItems = selectedStorageId
    ? items.filter(i => i.dk_closet === selectedStorageId)
    : [];

  return (
    <PageContainer 
      title="Warehouse Explorer" 
      subtitle="Navigate through your physical storage infrastructure."
      actions={
        <div className="flex gap-2">
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
          onClick={() => { setSelectedHomeId(null); setSelectedStorageId(null); }}
          className={cn("hover:text-zinc-900", !selectedHomeId && "text-zinc-900 font-semibold")}
        >
          All Locations
        </button>
        {selectedHomeId && (
          <>
            <ChevronRight size={14} className="shrink-0" />
            <button 
              onClick={() => setSelectedStorageId(null)}
              className={cn("hover:text-zinc-900", !selectedStorageId && "text-zinc-900 font-semibold")}
            >
              {currentHome?.homename}
            </button>
          </>
        )}
        {selectedStorageId && (
          <>
            <ChevronRight size={14} className="shrink-0" />
            <span className="text-zinc-900 font-semibold">{currentStorage?.closet}</span>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedHomeId ? (
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
                  <span>{storages.filter(s => s.dk_homelocation === home.id).length} Units</span>
                </div>
              </button>
            ))}
          </motion.div>
        ) : !selectedStorageId ? (
          <motion.div 
            key="storages"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredStorages.map(storage => (
              <button
                key={storage.id}
                onClick={() => setSelectedStorageId(storage.id)}
                className="group bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm text-left hover:border-zinc-400 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-zinc-100 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                    <ClosetIcon size={24} />
                  </div>
                  <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-900" />
                </div>
                <h3 className="text-lg font-bold">{storage.closet}</h3>
                <p className="text-zinc-500 text-sm mt-1">Partition: {storage.closetpartition}</p>
                <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">
                    {items.filter(i => i.dk_closet === storage.id).length} Items
                  </span>
                  {storage.hasstoragecover && (
                    <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Covers Active
                    </span>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="items"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
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
                  {filteredItems.map(item => (
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
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-sm italic">
                        This storage partition is currently empty.
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
        homeId={selectedHomeId}
        onClose={() => setIsStorageModalOpen(false)}
        onStorageAdded={() => {
          refetch();
          setIsStorageModalOpen(false);
        }}
      />
    </PageContainer>
  );
}
