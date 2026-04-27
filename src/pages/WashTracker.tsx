import { PageContainer } from '../components/PageContainer';
import { WashModal } from '../components/WashModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Wash, Item } from '../types';
import { 
  Droplets, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2,
  Plus,
  Clock,
  History
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function WashTracker() {
  const { items, loading: itemsLoading } = useDashboardData();
  const [washes, setWashes] = useState<Wash[]>([]);
  const [loadingWashes, setLoadingWashes] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadWashes = async () => {
    try {
      setLoadingWashes(true);
      const data = await api.list<Wash>('wash');
      setWashes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setWashes([]);
    } finally {
      setLoadingWashes(false);
    }
  };

  useEffect(() => {
    loadWashes();
  }, []);

  const handleOpenModal = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleWashLogged = () => {
    loadWashes();
  };

  if (itemsLoading || loadingWashes) return <div className="p-8 animate-pulse text-center">Syncing cleaning protocol...</div>;

  // Group latest wash by item
  const latestWashes = washes.reduce((acc, current) => {
    if (!acc[current.dk_itemid] || new Date(current.lastwashdate) > new Date(acc[current.dk_itemid].lastwashdate)) {
      acc[current.dk_itemid] = current;
    }
    return acc;
  }, {} as Record<number, Wash>);

  const itemsWithStatus = items.map(item => {
    const lastWash = latestWashes[item.id];
    const daysSince = lastWash ? differenceInDays(new Date(), new Date(lastWash.lastwashdate)) : Infinity;
    const isCritical = daysSince > 30;

    return { ...item, lastWash, daysSince, isCritical };
  });

  return (
    <>
      <WashModal
        isOpen={isModalOpen}
        item={selectedItem}
        onClose={handleCloseModal}
        onWashLogged={handleWashLogged}
      />

      <PageContainer 
        title="Wash Health Protocol" 
        subtitle="Monitoring the hygiene state of your archived collection."
      >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
            <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">Critical (30d+)</p>
            <p className="text-3xl font-bold text-red-900">{itemsWithStatus.filter(i => i.isCritical).length}</p>
         </div>
         <div className="bg-green-50 border border-green-100 p-6 rounded-2xl">
            <p className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">Clean Items</p>
            <p className="text-3xl font-bold text-green-900">{itemsWithStatus.filter(i => !i.isCritical && i.lastWash).length}</p>
         </div>
         <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
            <p className="text-indigo-500 text-xs font-bold uppercase tracking-widest mb-1">Total Washes</p>
            <p className="text-3xl font-bold text-indigo-900">{washes.length}</p>
         </div>
         <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">Never Washed</p>
            <p className="text-3xl font-bold text-amber-900">{itemsWithStatus.filter(i => !i.lastWash).length}</p>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <table className="w-full text-left hidden md:table">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Archived Item</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Last Cleaning</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {itemsWithStatus.sort((a, b) => b.daysSince - a.daysSince).map(item => (
              <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      item.isCritical ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-400"
                    )}>
                      <Droplets size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-zinc-900">{item.itemtype}</p>
                      <p className="text-xs text-zinc-500 font-mono">#{item.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.lastWash ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-700">{format(new Date(item.lastWash.lastwashdate), 'MMM dd, yyyy')}</span>
                      <span className="text-xs text-zinc-400">{item.daysSince} days ago</span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Never cleaned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.isCritical ? (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-2 py-1 rounded-md w-fit">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Requires Wash</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Pristine</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleOpenModal(item)}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={14} />
                    <span className="text-xs font-bold">Log Wash</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-zinc-100">
          {itemsWithStatus.sort((a, b) => b.daysSince - a.daysSince).map(item => (
            <div key={item.id} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    item.isCritical ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-400"
                  )}>
                    <Droplets size={18} />
                  </div>
                  <div>
                    <Link to={`/item/${item.id}`} className="font-bold text-sm text-zinc-900 hover:underline">{item.itemtype}</Link>
                    <p className="text-[10px] text-zinc-500 font-mono">#{item.id}</p>
                  </div>
                </div>
                {item.isCritical ? (
                  <AlertTriangle size={18} className="text-red-500" />
                ) : (
                  <CheckCircle2 size={18} className="text-green-500" />
                )}
              </div>
              
              <div className="flex justify-between items-end">
                <div className="text-xs">
                  <p className="text-zinc-400 uppercase font-bold text-[9px] tracking-widest mb-0.5">Last Wash</p>
                  <p className="font-semibold text-zinc-700">
                    {item.lastWash ? format(new Date(item.lastWash.lastwashdate), 'MMM dd, yyyy') : 'Never'}
                  </p>
                </div>
                <button 
                  onClick={() => handleOpenModal(item)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors"
                >
                  Log Wash
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Wash History Section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <History size={20} className="text-indigo-600" />
          <h2 className="text-xl font-bold text-zinc-900">Recent Wash History</h2>
        </div>
        
        {washes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center">
            <Droplets size={32} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-zinc-500 font-medium">No washing records yet</p>
            <p className="text-zinc-400 text-sm">Start logging washes to track your items' cleaning history</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {washes
              .sort((a, b) => new Date(b.lastwashdate).getTime() - new Date(a.lastwashdate).getTime())
              .slice(0, 6)
              .map((wash) => {
                const item = items.find(i => i.id === wash.dk_itemid);
                return (
                  <div key={wash.id} className="bg-white rounded-2xl border border-zinc-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Droplets size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-zinc-900 truncate">
                          {item?.itemtype || `Item #${wash.dk_itemid}`}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                          <Clock size={12} />
                          <span>{format(new Date(wash.lastwashdate), 'MMM dd, yyyy')}</span>
                        </div>
                        {item && (
                          <p className="text-xs text-zinc-400 mt-2">
                            Size: {item.itemsize} • Method: {item.itemwashmethod || 'Not specified'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </PageContainer>
    </>
  );
}
