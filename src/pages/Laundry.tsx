import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/PageContainer';
import { ItemSVGIcon } from '../components/ItemSVGIcon';
import { useDashboardData } from '../hooks/useDashboardData';
import { api } from '../services/api';
import { Item } from '../types';
import { CheckCircle2, AlertCircle, Wind, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

type WashStatus = Item['wash_status'];

const COLUMNS: { status: WashStatus; label: string; description: string; icon: React.ReactNode; color: string; bg: string }[] = [
  {
    status: 'clean',
    label: 'Clean',
    description: 'Ready to wear',
    icon: <CheckCircle2 size={16} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
  },
  {
    status: 'dirty',
    label: 'Dirty',
    description: 'Needs washing',
    icon: <AlertCircle size={16} />,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  },
  {
    status: 'washing',
    label: 'Washing',
    description: 'In the machine',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    ),
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  },
  {
    status: 'drying',
    label: 'Drying',
    description: 'Air drying',
    icon: <Wind size={16} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  },
];

const NEXT_STATUS: Record<WashStatus, WashStatus> = {
  dirty: 'washing',
  washing: 'drying',
  drying: 'clean',
  clean: 'dirty',
};

const NEXT_LABEL: Record<WashStatus, string> = {
  dirty: 'Start Washing',
  washing: 'Move to Drying',
  drying: 'Mark Clean',
  clean: 'Mark Dirty',
};

export default function Laundry() {
  const { items, storages, homes, loading, refetch } = useDashboardData();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const itemsByStatus = useMemo<Record<WashStatus, Item[]>>(() => {
    const map: Record<WashStatus, Item[]> = { clean: [], dirty: [], washing: [], drying: [] };
    for (const item of items) {
      const status: WashStatus = item.wash_status ?? 'clean';
      map[status].push(item);
    }
    return map;
  }, [items]);

  const getLocation = (item: Item) => {
    const storage = storages.find(s => s.id === item.dk_closet);
    const home = homes.find(h => h.id === storage?.dk_homelocation);
    if (!storage) return '';
    return `${home?.homename ?? '?'} / ${storage.closet}`;
  };

  const moveItem = async (item: Item, toStatus: WashStatus) => {
    setUpdatingId(item.id);
    try {
      await api.update<Item>('item', item.id, { wash_status: toStatus });
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-center dark:text-zinc-400">Loading laundry status...</div>;

  const inProgressCount = (itemsByStatus.washing?.length ?? 0) + (itemsByStatus.drying?.length ?? 0);

  return (
    <PageContainer
      title="Laundry Tracker"
      subtitle={`${inProgressCount} item${inProgressCount !== 1 ? 's' : ''} in progress · ${itemsByStatus.dirty.length} waiting to be washed`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {COLUMNS.map(col => {
          const colItems = itemsByStatus[col.status] ?? [];
          return (
            <div key={col.status} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className={cn('flex items-center justify-between px-4 py-3 rounded-xl border', col.bg)}>
                <div className={cn('flex items-center gap-2 font-semibold text-sm', col.color)}>
                  {col.icon}
                  {col.label}
                </div>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', col.color, 'bg-white border', col.bg.split(' ')[1])}>
                  {colItems.length}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 min-h-[120px]">
                {colItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 text-zinc-500 dark:text-zinc-400">
                        <ItemSVGIcon itemtype={item.itemtype} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/item/${item.id}`}
                          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 hover:text-zinc-600 dark:hover:text-zinc-400 truncate block"
                        >
                          {item.itemtype}
                        </Link>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{getLocation(item)}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Size: {item.itemsize}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => moveItem(item, NEXT_STATUS[col.status])}
                      disabled={updatingId === item.id}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
                    >
                      {updatingId === item.id ? 'Moving...' : NEXT_LABEL[col.status]}
                      <ChevronRight size={12} />
                    </button>
                  </div>
                ))}

                {colItems.length === 0 && (
                  <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 text-xs">
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
