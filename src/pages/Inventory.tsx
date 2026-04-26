import { PageContainer } from '../components/PageContainer';
import { useDashboardData } from '../hooks/useDashboardData';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Package,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Inventory() {
  const { items, loading, homes, storages } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'itemtype' | 'itemcost' | 'itemlikerating'>('itemtype');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredItems = useMemo(() => {
    return items
      .filter(item => 
        item.itemtype.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemcomment.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const factor = sortOrder === 'asc' ? 1 : -1;
        if (a[sortField] < b[sortField]) return -1 * factor;
        if (a[sortField] > b[sortField]) return 1 * factor;
        return 0;
      });
  }, [items, searchTerm, sortField, sortOrder]);

  if (loading) return <div className="p-8 animate-pulse">Accessing inventory database...</div>;

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <PageContainer 
      title="Global Inventory" 
      subtitle="Comprehensive view of every item in your collection."
      actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-md shadow-black/10">
          <Plus size={18} />
          New Item
        </button>
      }
    >
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search by type or comment..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50">
            <Filter size={18} />
            Filters
          </button>
          <div className="flex bg-white border border-zinc-200 rounded-xl p-1">
            {['itemtype', 'itemcost', 'itemlikerating'].map((field) => (
              <button
                key={field}
                onClick={() => toggleSort(field as any)}
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

      {/* Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const storage = storages.find(s => s.id === item.dk_closet);
          const home = storage ? homes.find(h => h.id === storage.dk_homelocation) : null;

          return (
            <Link 
              to={`/item/${item.id}`}
              key={item.id} 
              className="group bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400 hover:shadow-lg transition-all flex flex-col"
            >
              <div className="relative aspect-square bg-zinc-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center text-zinc-400 group-hover:bg-zinc-200 transition-colors">
                <Package size={48} strokeWidth={1.5} />
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-tight">
                  {item.itemsize}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-zinc-900">{item.itemtype}</h3>
                  <span className="text-zinc-400 text-[10px] font-mono">#{item.id}</span>
                </div>
                
                <p className="text-xs text-zinc-500 line-clamp-2 min-h-[32px] mb-4">
                  {item.itemcomment || "No description provided."}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-50">
                   <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Location</span>
                    <span className="text-xs font-semibold text-zinc-700 truncate max-w-[120px]">
                      {home?.homename || 'Unknown'}
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
          <Package size={48} className="opacity-20" />
          <p>No items found matching your criteria.</p>
          <button 
            onClick={() => { setSearchTerm(''); }}
            className="text-zinc-900 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </PageContainer>
  );
}
