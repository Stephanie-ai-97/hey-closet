import { PageContainer } from '../components/PageContainer';
import { useDashboardData } from '../hooks/useDashboardData';
import { 
  Package, 
  Home as HomeIcon, 
  Warehouse, 
  Clock, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { homes, storages, items, loading, error } = useDashboardData();

  if (loading) return <div className="p-8 animate-pulse dark:text-zinc-400">Loading archive...</div>;
  if (error) return (
    <div className="p-8 flex items-center gap-2 text-red-500">
      <AlertCircle size={20} />
      <span>{error}</span>
    </div>
  );

  const stats = [
    { label: 'Total Items', value: items.length, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Locations', value: homes.length, icon: HomeIcon, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Storage Units', value: storages.length, icon: Warehouse, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
  ];

  return (
    <PageContainer 
      title="Archive Overview" 
      subtitle="Welcome back. Here is the current state of your wardrobe."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className={cn("p-4 rounded-xl", stat.bg)}>
              <stat.icon size={24} className={stat.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Section */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-zinc-400 dark:text-zinc-500" />
              <h2 className="font-semibold">Recently Archived</h2>
            </div>
          </div>
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {items.slice(-5).reverse().map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.itemtype}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Size: {item.itemsize}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                  ID: #{item.id}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">No items archived yet.</div>
            )}
          </div>
        </section>

        {/* Home Distribution */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-zinc-400 dark:text-zinc-500" />
            <h2 className="font-semibold">Collection Distribution</h2>
          </div>
          <div className="space-y-6">
            {homes.map((home) => {
              const homeStorages = storages.filter(s => s.dk_homelocation === home.id);
              const storageIds = homeStorages.map(s => s.id);
              const homeItems = items.filter(i => storageIds.includes(i.dk_closet));
              const percentage = items.length > 0 ? (homeItems.length / items.length) * 100 : 0;

              return (
                <div key={home.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{home.homename}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{homeItems.length} items</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" 
                    />
                  </div>
                </div>
              );
            })}
            {homes.length === 0 && (
              <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">No homes defined in settings.</div>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
