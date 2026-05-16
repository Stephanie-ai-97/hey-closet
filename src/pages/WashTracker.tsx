import { PageContainer } from '../components/PageContainer';
import { WashModal } from '../components/WashModal';
import { BulkWashModal } from '../components/BulkWashModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { useItemColours } from '../hooks/useItemColours';
import { ItemSVGIcon } from '../components/ItemSVGIcon';
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
  History,
  Zap,
  ChevronDown
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function WashTracker() {
  const { items, loading: itemsLoading } = useDashboardData();
  const { itemsWithColours } = useItemColours(items);
  const [washes, setWashes] = useState<Wash[]>([]);
  const [loadingWashes, setLoadingWashes] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkWashModalOpen, setIsBulkWashModalOpen] = useState(false);
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());

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

  if (itemsLoading || loadingWashes) return <div className="p-8 animate-pulse text-center dark:text-zinc-400">Syncing cleaning protocol...</div>;

  // Group latest wash by item
  const latestWashes = washes.reduce((acc, current) => {
    if (!acc[current.dk_itemid] || new Date(current.lastwashdate) > new Date(acc[current.dk_itemid].lastwashdate)) {
      acc[current.dk_itemid] = current;
    }
    return acc;
  }, {} as Record<number, Wash>);

  // Calculate unique wash bulks (by created_at datetime)
  const uniqueWashBulks = new Set(washes.map(w => w.created_at?.split('T')[0] || 'unknown')).size;

  const itemsWithStatus = itemsWithColours.map(item => {
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

      <BulkWashModal
        isOpen={isBulkWashModalOpen}
        items={itemsWithColours}
        onClose={() => setIsBulkWashModalOpen(false)}
        onWashLogged={handleWashLogged}
      />

      <PageContainer 
        title="Wash Health Protocol" 
        subtitle="Monitoring the hygiene state of your archived collection."
      >
      <div className="grid grid-cols-4 gap-2 md:gap-4 mb-8">
         <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 p-3 md:p-6 rounded-2xl min-w-0">
            <p className="text-red-500 text-[9px] md:text-xs font-bold uppercase tracking-wide md:tracking-widest mb-1 leading-tight">Critical (30d+)</p>
            <p className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-300">{itemsWithStatus.filter(i => i.isCritical).length}</p>
         </div>
         <div className="bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 p-3 md:p-6 rounded-2xl min-w-0">
            <p className="text-green-500 text-[9px] md:text-xs font-bold uppercase tracking-wide md:tracking-widest mb-1 leading-tight">Clean Items</p>
            <p className="text-2xl md:text-3xl font-bold text-green-900 dark:text-green-300">{itemsWithStatus.filter(i => !i.isCritical && i.lastWash).length}</p>
         </div>
         <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 p-3 md:p-6 rounded-2xl min-w-0">
            <p className="text-indigo-500 text-[9px] md:text-xs font-bold uppercase tracking-wide md:tracking-widest mb-1 leading-tight">Total Wash Bulk</p>
            <p className="text-2xl md:text-3xl font-bold text-indigo-900 dark:text-indigo-300">{uniqueWashBulks}</p>
         </div>
         <div className={cn("p-3 md:p-6 rounded-2xl border min-w-0", itemsWithStatus.filter(i => i.in_temp).length > 0 ? "bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900" : "bg-amber-50 dark:bg-amber-950 border-amber-100 dark:border-amber-900")}>
            <p className={cn("text-[9px] md:text-xs font-bold uppercase tracking-wide md:tracking-widest mb-1 leading-tight", itemsWithStatus.filter(i => i.in_temp).length > 0 ? "text-blue-500" : "text-amber-500")}>Temporary Storage</p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <p className={cn("text-2xl md:text-3xl font-bold", itemsWithStatus.filter(i => i.in_temp).length > 0 ? "text-blue-900 dark:text-blue-300" : "text-amber-900 dark:text-amber-300")}>{itemsWithStatus.filter(i => i.in_temp).length}</p>
              {itemsWithStatus.filter(i => i.in_temp).length > 0 && (
                <button
                  onClick={() => setIsBulkWashModalOpen(true)}
                  className="px-2 md:px-3 py-1 bg-blue-600 text-white text-[9px] md:text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Zap size={12} />
                  <span className="hidden sm:inline">Bulk Wash</span>
                </button>
              )}
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <table className="w-full text-left hidden md:table">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Archived Item</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Last Cleaning</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {itemsWithStatus.sort((a, b) => b.daysSince - a.daysSince).map(item => (
              <tr key={item.id} className={cn(
                "transition-colors",
                item.in_temp
                  ? "bg-blue-50/50 dark:bg-blue-950/50 hover:bg-blue-50 dark:hover:bg-blue-950"
                  : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
              )}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      item.in_temp 
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600"
                        : item.isCritical ? "bg-red-50 dark:bg-red-950 text-red-500" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400"
                    )}>
                      <ItemSVGIcon
                        itemtype={item.itemtype}
                        size={24}
                        majorColour={item.colour?.majorcolour}
                        minorColour={item.colour?.minorcolour}
                        color={item.colour?.majorcolour}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{item.itemtype}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">#{item.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.lastWash ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{format(new Date(item.lastWash.lastwashdate), 'MMM dd, yyyy')}</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.daysSince} days ago</span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">Never cleaned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.isCritical ? (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950 px-2 py-1 rounded-md w-fit">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Requires Wash</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-md w-fit">
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
        <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {itemsWithStatus.sort((a, b) => b.daysSince - a.daysSince).map(item => (
            <div key={item.id} className={cn(
              "p-4 space-y-4",
              item.in_temp && "bg-blue-50/50 dark:bg-blue-950/50"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    item.in_temp 
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600"
                      : item.isCritical ? "bg-red-50 dark:bg-red-950 text-red-500" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400"
                  )}>
                    <ItemSVGIcon
                      itemtype={item.itemtype}
                      size={24}
                      majorColour={item.colour?.majorcolour}
                      minorColour={item.colour?.minorcolour}
                      color={item.colour?.majorcolour}
                    />
                  </div>
                  <div>
                    <Link to={`/item/${item.id}`} className="font-bold text-sm text-zinc-900 dark:text-zinc-50 hover:underline">{item.itemtype}</Link>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">#{item.id}</p>
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
                  <p className="text-zinc-400 dark:text-zinc-500 uppercase font-bold text-[9px] tracking-widest mb-0.5">Last Wash</p>
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">
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
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Recent Wash History</h2>
        </div>
        
        {washes.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <Droplets size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No washing records yet</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">Start logging washes to track your items' cleaning history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Group washes by created_at to create wash lots
              const washLots = washes.reduce((acc, wash) => {
                const lotKey = wash.created_at ? new Date(wash.created_at).toISOString().split('T')[0] : 'unknown';
                if (!acc[lotKey]) {
                  acc[lotKey] = [];
                }
                acc[lotKey].push(wash);
                return acc;
              }, {} as Record<string, Wash[]>);

              // Sort lots by date (most recent first)
              const sortedLots = (Object.entries(washLots) as [string, Wash[]][])
                .sort((a, b) => {
                  const dateA = new Date(a[0]);
                  const dateB = new Date(b[0]);
                  return dateB.getTime() - dateA.getTime();
                })
                .slice(0, 10); // Show top 10 lots

              return sortedLots.map(([lotDate, lotWashes], lotIndex) => {
                const lotId = lotDate;
                const isExpanded = expandedLots.has(lotId);
                const firstWash = lotWashes[0];
                const lotCreatedTime = firstWash.created_at ? new Date(firstWash.created_at) : null;

                return (
                  <div key={lotId} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Lot Header - Clickable to expand */}
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedLots);
                        if (newExpanded.has(lotId)) {
                          newExpanded.delete(lotId);
                        } else {
                          newExpanded.add(lotId);
                        }
                        setExpandedLots(newExpanded);
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 text-left">
                        {/* Lot Number and Date */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Wash Lot #{10 - lotIndex}</span>
                            <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                              {lotWashes.length} item{lotWashes.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {format(new Date(lotDate), 'EEEE, MMMM dd, yyyy')}
                          </p>
                          {lotCreatedTime && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Logged at {format(lotCreatedTime, 'hh:mm a')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expand/Collapse Icon */}
                      <ChevronDown 
                        size={20} 
                        className={cn(
                          "text-zinc-400 transition-transform shrink-0",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>

                    {/* Expanded Items List */}
                    {isExpanded && (
                      <div className="border-t border-zinc-200 dark:border-zinc-800">
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {lotWashes
                            .sort((a, b) => new Date(b.lastwashdate).getTime() - new Date(a.lastwashdate).getTime())
                            .map((wash) => {
                              const item = itemsWithColours.find(i => i.id === wash.dk_itemid);
                              return (
                                <div key={wash.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
                                      {item ? (
                                        <ItemSVGIcon
                                          itemtype={item.itemtype}
                                          size={24}
                                          majorColour={item.colour?.majorcolour}
                                          minorColour={item.colour?.minorcolour}
                                          color={item.colour?.majorcolour}
                                        />
                                      ) : (
                                        <Droplets size={18} />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <Link to={`/item/${wash.dk_itemid}`} className="font-bold text-sm text-zinc-900 dark:text-zinc-50 hover:underline truncate block">
                                        {item?.itemtype || `Item #${wash.dk_itemid}`}
                                      </Link>
                                      <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        <Clock size={12} />
                                        <span>Washed on {format(new Date(wash.lastwashdate), 'MMM dd, yyyy')}</span>
                                      </div>
                                      {item && (
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                                          Size: {item.itemsize} • Method: {item.itemwashmethod || 'Not specified'}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </PageContainer>
    </>
  );
}
