import { PageContainer } from '../components/PageContainer';
import { ItemModal } from '../components/ItemModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { 
  Search, 
  Filter,
  X,
  ExternalLink,
  Plus,
  MapPin,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { ItemSVGIcon } from '../components/ItemSVGIcon';
import { Item } from '../types';

type WashStatus = Item['wash_status'];

export default function Inventory() {
  const { items, loading, homes, storages, refetch } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'itemtype' | 'itemcost' | 'itemlikerating'>('itemtype');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterHome, setFilterHome] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<WashStatus | null>(null);
  const [filterType, setFilterType] = useState('');

  const itemTypes = useMemo(() => Array.from(new Set(items.map(i => i.itemtype))).sort(), [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch =
          item.itemtype.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.itemcomment.toLowerCase().includes(searchTerm.toLowerCase());
        const storage = storages.find(s => s.id === item.dk_closet);
        const matchesHome = filterHome === null || storage?.dk_homelocation === filterHome;
        const matchesStatus = filterStatus === null || (item.wash_status ?? 'clean') === filterStatus;
        const matchesType = !filterType || item.itemtype === filterType;
        return matchesSearch && matchesHome && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const factor = sortOrder === 'asc' ? 1 : -1;
        if (a[sortField] < b[sortField]) return -1 * factor;
        if (a[sortField] > b[sortField]) return 1 * factor;
        return 0;
      });
  }, [items, searchTerm, sortField, sortOrder, filterHome, filterStatus, filterType, storages]);

  if (loading) return <div className="p-8 animate-pulse">Accessing inventory database...</div>;

  const activeFilterCount = [filterHome, filterStatus, filterType || null].filter(Boolean).length;

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setFilterHome(null);
    setFilterStatus(null);
    setFilterType('');
  };

  return (
    <>
      <ItemModal
        isOpen={isModalOpen}
        storages={storages}
        homes={homes}
        onClose={() => setIsModalOpen(false)}
        onItemAdded={() => refetch()}
      />
      <PageContainer 
        title="Global Inventory" 
        subtitle="Comprehensive view of every item in your collection."
        actions={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-md shadow-black/10"
          >
            <Plus size={18} />
            New Item
          </button>
        }
      >
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search by type or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all',
              filterOpen || activeFilterCount > 0
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white border-zinc-200 hover:bg-zinc-50'
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
          <div className="flex bg-white border border-zinc-200 rounded-xl p-1">
            {(['itemtype', 'itemcost', 'itemlikerating'] as const).map((field) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  sortField === field ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {field === 'itemtype' ? 'Type' : field === 'itemcost' ? 'Cost' : 'Rating'}
                {sortField === field && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className="mb-6 p-4 bg-white border border-zinc-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">Filter Options</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Home filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Location</label>
              <select
                value={filterHome ?? ''}
                onChange={(e) => setFilterHome(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              >
                <option value="">All locations</option>
                {homes.map(h => <option key={h.id} value={h.id}>{h.homename}</option>)}
              </select>
            </div>
            {/* Wash status filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Laundry Status</label>
              <select
                value={filterStatus ?? ''}
                onChange={(e) => setFilterStatus(e.target.value ? e.target.value as WashStatus : null)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              >
                <option value="">Any status</option>
                <option value="clean">Clean</option>
                <option value="dirty">Dirty</option>
                <option value="washing">Washing</option>
                <option value="drying">Drying</option>
              </select>
            </div>
            {/* Type filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Item Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              >
                <option value="">All types</option>
                {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const storage = storages.find(s => s.id === item.dk_closet);
          const home = storage ? homes.find(h => h.id === storage.dk_homelocation) : null;
          const locationPath = storage
            ? `${home?.homename ?? '?'} → ${storage.closet} → ${storage.closetpartition}`
            : 'Unknown';

          return (
            <Link 
              to={`/item/${item.id}`}
              key={item.id} 
              className="group bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400 hover:shadow-lg transition-all flex flex-col"
            >
              <div className="relative aspect-square bg-zinc-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center text-zinc-400 group-hover:bg-zinc-200 transition-colors">
                <ItemSVGIcon itemtype={item.itemtype} size={48} />
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-tight">
                  {item.itemsize}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-zinc-900">{item.itemtype}</h3>
                  <span className="text-zinc-400 text-[10px] font-mono">#{item.id}</span>
                </div>
                
                <p className="text-xs text-zinc-500 line-clamp-2 min-h-[32px] mb-2">
                  {item.itemcomment || "No description provided."}
                </p>

                <div className="flex items-center gap-1 mb-4 text-zinc-400">
                  <MapPin size={10} />
                  <span className="text-[10px] truncate">{locationPath}</span>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-50">
                   <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Status</span>
                    <span className="text-xs font-semibold capitalize text-zinc-700">
                      {item.wash_status ?? 'clean'}
                    </span>
                   </div>
                   <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Cost</span>
                    <p className="text-sm font-bold text-zinc-900">${item.itemcost.toFixed(2)}</p>
                   </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-400 space-y-4">
          <ItemSVGIcon itemtype="shirt" size={48} color="#d4d4d8" />
          <p>No items found matching your criteria.</p>
          <button 
            onClick={() => { setSearchTerm(''); clearFilters(); }}
            className="text-zinc-900 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
      </PageContainer>
    </>
  );
}
