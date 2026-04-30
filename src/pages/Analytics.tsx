import { PageContainer } from '../components/PageContainer';
import { useAnalytics } from '../hooks/useAnalytics';
import { CPWBadge } from '../components/CPWBadge';
import { ItemSVGIcon } from '../components/ItemSVGIcon';
import { Link } from 'react-router-dom';
import { TrendingDown, BarChart2, Palette, Archive } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Analytics() {
  const { data, loading, error } = useAnalytics();

  if (loading) return <div className="p-8 animate-pulse text-center dark:text-zinc-400">Computing fashion ROI...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;
  if (!data) return null;

  const { cpwItems, spendingByMonth, dominantColors, dormantItems, totalSpend, totalWears, avgCPW } = data;

  const maxMonthTotal = Math.max(...spendingByMonth.map(m => m.total), 1);

  return (
    <PageContainer
      title="Fashion ROI"
      subtitle="Analytics on cost-per-wear, spending trends, and style patterns."
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Spend', value: `$${totalSpend.toFixed(0)}`, sub: 'all items combined' },
          { label: 'Total Wears Logged', value: String(totalWears), sub: 'across all items' },
          { label: 'Avg Cost Per Wear', value: avgCPW > 0 ? `$${avgCPW.toFixed(2)}` : '—', sub: 'for worn items' },
          { label: 'Dormant Items', value: String(dormantItems.length), sub: '6+ months unworn' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{stat.value}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Cost Per Wear Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 rounded-xl">
              <TrendingDown size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Cost Per Wear</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Items sorted by efficiency</p>
            </div>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {cpwItems.slice(0, 20).map(({ item, wearCount, cpw }) => (
              <Link
                to={`/item/${item.id}`}
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                  <ItemSVGIcon itemtype={item.itemtype} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{item.itemtype}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{wearCount > 0 ? `${wearCount} wear${wearCount !== 1 ? 's' : ''}` : 'Never worn'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {wearCount > 0 ? (
                    <CPWBadge cost={item.itemcost} wearCount={wearCount} />
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">$—/wear</span>
                  )}
                  <span className="text-xs text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Spending by Month */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950 rounded-xl">
              <BarChart2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Spending Over Time</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Items added per month by cost</p>
            </div>
          </div>
          {spendingByMonth.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-12">No spending data yet</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {spendingByMonth.slice().reverse().map(month => (
                <div key={month.month} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 w-20 shrink-0">{month.label}</span>
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.max((month.total / maxMonthTotal) * 100, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-16 text-right shrink-0">
                    ${month.total.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Style DNA — dominant colors */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950 rounded-xl">
              <Palette size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Style DNA</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Most-worn colors</p>
            </div>
          </div>
          {dominantColors.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-12">Log wears to see color patterns</p>
          ) : (
            <div className="space-y-3">
              {dominantColors.map(({ colour, count }) => {
                const max = dominantColors[0].count;
                return (
                  <div key={colour} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700 shrink-0"
                      style={{ backgroundColor: colour.toLowerCase() }}
                      title={colour}
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 w-24 truncate">{colour}</span>
                    <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3">
                      <div
                        className="h-full bg-purple-400 rounded-full"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-12 text-right">{count} wear{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dormant Items */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950 rounded-xl">
              <Archive size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Dormant Items</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Not worn in 6+ months</p>
            </div>
          </div>
          {dormantItems.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-12">No dormant items — great rotation!</p>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto">
              {dormantItems.map(item => (
                <Link
                  to={`/item/${item.id}`}
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                    <ItemSVGIcon itemtype={item.itemtype} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{item.itemtype}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{item.itemsize} · ${item.itemcost?.toFixed(2) ?? '0.00'}</p>
                  </div>
                  <span className="text-xs text-amber-500 font-medium shrink-0">Dormant</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
