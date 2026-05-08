import { PageContainer } from '../components/PageContainer';
import { ItemModal } from '../components/ItemModal';
import { EditItemModal } from '../components/EditItemModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { 
  Search, 
  Filter,
  X,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  LayoutGrid,
  Grid2X2,
  List,
  Tag,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { ItemSVGIcon } from '../components/ItemSVGIcon';
import { Item } from '../types';
import { api } from '../services/api';

type WashStatus = Item['wash_status'];
type DisplayMode = 'tile' | 'compactTile' | 'list' | 'iconName';
type SortField = 'created_at' | 'updated_at' | 'itemcost' | 'itemlikerating';

export default function Inventory() {
  const { items, loading, homes, storages, refetch } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterHome, setFilterHome] = useState<number | null>(null);
  const [filterStorage, setFilterStorage] = useState<number | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<WashStatus | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('tile');

  const itemTypes = useMemo(() => Array.from(new Set(items.map(i => i.itemtype))).sort(), [items]);
  const uniqueStorages = useMemo(() => {
    const storageMap = new Map<number, typeof storages[0]>();
    storages.forEach(s => storageMap.set(s.id, s));
    return Array.from(storageMap.values()).sort((a, b) => a.closet.localeCompare(b.closet));
  }, [storages]);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch =
          item.itemtype.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.itemcomment.toLowerCase().includes(searchTerm.toLowerCase());
        const storage = storages.find(s => s.id === item.dk_closet);
        const matchesHome = filterHome === null || storage?.dk_homelocation === filterHome;
        const matchesStorage = filterStorage === null || item.dk_closet === filterStorage;
        const matchesType = !filterType || item.itemtype === filterType;
        const matchesRating = filterRating === null || item.itemlikerating === filterRating;
        const matchesStatus = filterStatus === null || (item.wash_status ?? 'clean') === filterStatus;
        return matchesSearch && matchesHome && matchesStorage && matchesType && matchesRating && matchesStatus;
      })
      .sort((a, b) => {
        const factor = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'created_at' || sortField === 'updated_at') {
          const aTime = a[sortField] ? new Date(a[sortField] as string).getTime() : 0;
          const bTime = b[sortField] ? new Date(b[sortField] as string).getTime() : 0;
          return (aTime - bTime) * factor;
        }
        if (a[sortField] < b[sortField]) return -1 * factor;
        if (a[sortField] > b[sortField]) return 1 * factor;
        return 0;
      });
  }, [items, searchTerm, sortField, sortOrder, filterHome, filterStorage, filterType, filterRating, filterStatus, storages]);

  if (loading) return <div className="p-8 animate-pulse dark:text-zinc-400">Accessing inventory database...</div>;

  const activeFilterCount = [filterHome, filterStorage, filterType || null, filterRating, filterStatus || null].filter(Boolean).length;

  const clearFilters = () => {
    setFilterHome(null);
    setFilterStorage(null);
    setFilterType('');
    setFilterRating(null);
    setFilterStatus(null);
  };

  const displayOptions: Array<{ mode: DisplayMode; label: string; icon: typeof LayoutGrid }> = [
    { mode: 'tile', label: 'Tile', icon: LayoutGrid },
    { mode: 'compactTile', label: 'Card', icon: Grid2X2 },
    { mode: 'list', label: 'List', icon: List },
    { mode: 'iconName', label: 'Icon', icon: Tag },
  ];

  const sortOptions: Array<{ value: SortField; label: string }> = [
    { value: 'created_at', label: 'Item Created Date' },
    { value: 'updated_at', label: 'Item Modified Date' },
    { value: 'itemcost', label: 'Cost' },
    { value: 'itemlikerating', label: 'Rating' },
  ];

  return (
    <>
      <ItemModal
        isOpen={isModalOpen}
        storages={storages}
        homes={homes}
        onClose={() => setIsModalOpen(false)}
        onItemAdded={() => refetch()}
      />
      {editingItem && (
        <EditItemModal
          isOpen={!!editingItem}
          item={editingItem}
          storages={storages}
          homes={homes}
          onClose={() => setEditingItem(null)}
          onItemUpdated={() => { refetch(); setEditingItem(null); }}
        />
      )}
      {deletingItem && (
        <DeleteConfirmModal
          isOpen={!!deletingItem}
          itemName={`${deletingItem.itemtype} (${deletingItem.itemsize})`}
          onClose={() => setDeletingItem(null)}
          onConfirm={async () => {
            await api.delete('item', deletingItem.id);
            setDeletingItem(null);
            refetch();
          }}
        />
      )}
      <PageContainer 
        title="Global Inventory" 
        subtitle="Comprehensive view of every item in your collection."
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md shadow-black/10"
          >
            <Plus size={18} />
            New Item
          </button>
        }
      >
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by type or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 dark:focus:border-zinc-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:justify-end">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all',
              filterOpen || activeFilterCount > 0
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            )}
          >
            <Filter size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              aria-label="Order items by"
              className="h-8 max-w-[13rem] rounded-lg bg-transparent px-2 text-xs font-bold text-zinc-700 outline-none dark:text-zinc-200 sm:max-w-none"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              aria-label={sortOrder === 'asc' ? 'Ascending order' : 'Descending order'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {sortOrder === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
            </button>
          </div>
          <div className="flex overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
            {displayOptions.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDisplayMode(mode)}
                title={label}
                aria-label={`${label} display`}
                aria-pressed={displayMode === mode}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all',
                  displayMode === mode
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                )}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className="mb-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Filter Options</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Location filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Location</label>
              <select
                value={filterHome ?? ''}
                onChange={(e) => setFilterHome(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              >
                <option value="">All locations</option>
                {homes.map(h => <option key={h.id} value={h.id}>{h.homename}</option>)}
              </select>
            </div>
            {/* Storage filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Storage</label>
              <select
                value={filterStorage ?? ''}
                onChange={(e) => setFilterStorage(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              >
                <option value="">All storages</option>
                {uniqueStorages.map(s => <option key={s.id} value={s.id}>{s.closet} - {s.closetpartition}</option>)}
              </select>
            </div>
            {/* Item Type filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Item Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              >
                <option value="">All types</option>
                {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Rating filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Rating</label>
              <select
                value={filterRating ?? ''}
                onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              >
                <option value="">All ratings</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {/* Laundry Status filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Laundry Status</label>
              <select
                value={filterStatus ?? ''}
                onChange={(e) => setFilterStatus(e.target.value ? e.target.value as WashStatus : null)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              >
                <option value="">Any status</option>
                <option value="clean">Clean</option>
                <option value="dirty">Dirty</option>
                <option value="washing">Washing</option>
                <option value="drying">Drying</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Inventory View */}
      <div
        className={cn(
          displayMode === 'tile' && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
          displayMode === 'compactTile' && 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
          displayMode === 'list' && 'space-y-3',
          displayMode === 'iconName' && 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3'
        )}
      >
        {filteredItems.map(item => {
          const storage = storages.find(s => s.id === item.dk_closet);
          const home = storage ? homes.find(h => h.id === storage.dk_homelocation) : null;
          const locationPath = storage
            ? `${home?.homename ?? '?'} → ${storage.closet} → ${storage.closetpartition}`
            : 'Unknown';

          const actionButtons = (
            <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                onClick={(e) => { e.preventDefault(); setEditingItem(item); }}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                title="Edit item"
              >
                <Pencil size={13} className="text-zinc-500 dark:text-zinc-400" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setDeletingItem(item); }}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                title="Delete item"
              >
                <Trash2 size={13} className="text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>
          );

          if (displayMode === 'compactTile') {
            return (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all"
              >
                <div className="absolute right-2 top-2 z-10">{actionButtons}</div>
                <Link to={`/item/${item.id}`} className="block">
                  <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-3 overflow-hidden flex items-center justify-center text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                    <ItemSVGIcon itemtype={item.itemtype} size={36} />
                    <div className="absolute bottom-1.5 right-1.5 max-w-[70%] truncate px-1.5 py-0.5 bg-white/85 dark:bg-zinc-900/85 backdrop-blur rounded text-[9px] font-bold uppercase dark:text-zinc-50">
                      {item.itemsize}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{item.itemtype}</h3>
                      <span className="shrink-0 text-[9px] font-mono text-zinc-400 dark:text-zinc-500">#{item.id}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] capitalize text-zinc-500 dark:text-zinc-400">{item.wash_status ?? 'clean'}</span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">${item.itemcost.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          }

          if (displayMode === 'list') {
            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <Link to={`/item/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
                      <ItemSVGIcon itemtype={item.itemtype} size={30} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{item.itemtype}</h3>
                        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{item.itemsize}</span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">#{item.id}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {item.itemcomment || "No description provided."}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                        <MapPin size={10} />
                        <span className="truncate text-[10px]">{locationPath}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">${item.itemcost.toFixed(2)}</p>
                    <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{item.wash_status ?? 'clean'}</p>
                  </div>
                  {actionButtons}
                </div>
              </div>
            );
          }

          if (displayMode === 'iconName') {
            return (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all"
              >
                <div className="absolute right-2 top-2 z-10">{actionButtons}</div>
                <Link to={`/item/${item.id}`} className="flex min-h-28 flex-col items-center justify-center gap-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
                    <ItemSVGIcon itemtype={item.itemtype} size={32} />
                  </div>
                  <div className="w-full min-w-0">
                    <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{item.itemtype}</h3>
                    <p className="truncate text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">{item.itemsize}</p>
                  </div>
                </Link>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg transition-all flex flex-col"
            >
              {/* Edit/Delete action buttons */}
              <div className="absolute top-3 right-3 z-10">{actionButtons}</div>
              <Link to={`/item/${item.id}`} className="flex flex-col flex-1">
              <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-4 overflow-hidden flex items-center justify-center text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                <ItemSVGIcon itemtype={item.itemtype} size={48} />
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-tight dark:text-zinc-50">
                  {item.itemsize}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{item.itemtype}</h3>
                  <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-mono">#{item.id}</span>
                </div>
                
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[32px] mb-2">
                  {item.itemcomment || "No description provided."}
                </p>

                <div className="flex items-center gap-1 mb-4 text-zinc-400 dark:text-zinc-500">
                  <MapPin size={10} />
                  <span className="text-[10px] truncate">{locationPath}</span>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-50 dark:border-zinc-800">
                   <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold">Status</span>
                    <span className="text-xs font-semibold capitalize text-zinc-700 dark:text-zinc-300">
                      {item.wash_status ?? 'clean'}
                    </span>
                   </div>
                   <div className="text-right">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold">Cost</span>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">${item.itemcost.toFixed(2)}</p>
                   </div>
                </div>
              </div>
              </Link>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-400 space-y-4">
          <ItemSVGIcon itemtype="shirt" size={48} color="#d4d4d8" />
          <p>No items found matching your criteria.</p>
          <button 
            onClick={() => { setSearchTerm(''); clearFilters(); }}
            className="text-zinc-900 dark:text-zinc-50 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
      </PageContainer>
    </>
  );
}
