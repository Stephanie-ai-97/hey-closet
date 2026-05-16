import { PageContainer } from '../components/PageContainer';
import { useDashboardData } from '../hooks/useDashboardData';
import { useItemColours } from '../hooks/useItemColours';
import { ItemSVGIcon } from '../components/ItemSVGIcon';
import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Wash, Item } from '../types';
import {
  Droplets,
  Calendar,
  BarChart2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { format, differenceInDays, startOfDay, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function WashAnalysis() {
  const { items, loading: itemsLoading } = useDashboardData();
  const { itemsWithColours } = useItemColours(items);
  const [washes, setWashes] = useState<Wash[]>([]);
  const [loadingWashes, setLoadingWashes] = useState(true);

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

  // Compute analytics
  const analytics = useMemo(() => {
    // Unique items that have been washed
    const uniqueItemIds = new Set(washes.map(w => w.dk_itemid));
    const itemsWashed = itemsWithColours.filter(i => uniqueItemIds.has(i.id));

    // Wash count per item
    const washCountByItem = washes.reduce((acc, wash) => {
      acc[wash.dk_itemid] = (acc[wash.dk_itemid] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const itemWashStats = itemsWashed.map(item => ({
      item,
      washCount: washCountByItem[item.id] || 0,
    })).sort((a, b) => b.washCount - a.washCount);

    // Wash by day of week
    const washByDayOfWeek: Record<number, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    washes.forEach(wash => {
      const date = new Date(wash.lastwashdate);
      const dayOfWeek = date.getDay();
      washByDayOfWeek[dayOfWeek] = (washByDayOfWeek[dayOfWeek] || 0) + 1;
    });

    const dayOfWeekStats = dayNames.map((name, index) => ({
      day: name,
      dayIndex: index,
      count: washByDayOfWeek[index] || 0,
    }));

    // Wash by month
    const washByMonth: Record<string, number> = {};
    const monthsOrder: string[] = [];
    washes.forEach(wash => {
      const date = new Date(wash.lastwashdate);
      const monthKey = format(date, 'yyyy-MM');
      if (!washByMonth[monthKey]) {
        monthsOrder.push(monthKey);
      }
      washByMonth[monthKey] = (washByMonth[monthKey] || 0) + 1;
    });

    const monthStats = monthsOrder
      .sort()
      .map(monthKey => {
        const [year, month] = monthKey.split('-');
        return {
          monthKey,
          label: format(new Date(parseInt(year), parseInt(month) - 1), 'MMM yyyy'),
          count: washByMonth[monthKey],
        };
      });

    // Calculate averages
    const totalWashes = washes.length;
    const uniqueItemsWashed = uniqueItemIds.size;
    const uniqueWashBulks = new Set(washes.map(w => w.created_at?.split('T')[0] || 'unknown')).size;
    const avgWashesPerItem = uniqueItemsWashed > 0 ? (totalWashes / uniqueItemsWashed).toFixed(2) : '0';

    return {
      totalWashes: uniqueWashBulks,
      uniqueItemsWashed,
      avgWashesPerItem,
      itemWashStats,
      dayOfWeekStats,
      monthStats,
    };
  }, [washes, itemsWithColours]);

  if (itemsLoading || loadingWashes) {
    return <div className="p-8 animate-pulse text-center dark:text-zinc-400">Computing wash analytics...</div>;
  }

  const maxItemWashCount = Math.max(...analytics.itemWashStats.map(s => s.washCount), 1);
  const maxDayCount = Math.max(...analytics.dayOfWeekStats.map(s => s.count), 1);
  const maxMonthCount = Math.max(...analytics.monthStats.map(s => s.count), 1);

  return (
    <PageContainer
      title="Wash Analysis"
      subtitle="Deep dive into your washing patterns and item care metrics."
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">Total Wash Bulk</p>
          <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{analytics.totalWashes}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Total wash operations performed</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">Total Wash Items</p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{analytics.uniqueItemsWashed}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Unique items washed</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">Avg Per Item</p>
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{analytics.avgWashesPerItem}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Average washes per item</p>
        </div>
      </div>

      {/* Items by Wash Frequency */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 rounded-xl">
            <BarChart2 size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Items by Wash Frequency</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Items ranked by number of washes</p>
          </div>
        </div>

        {analytics.itemWashStats.length === 0 ? (
          <div className="text-center py-8">
            <Droplets size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-zinc-500 dark:text-zinc-400">No wash data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.itemWashStats.slice(0, 20).map(({ item, washCount }) => (
              <Link
                key={item.id}
                to={`/item/${item.id}`}
                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                  <ItemSVGIcon
                    itemtype={item.itemtype}
                    size={20}
                    majorColour={item.colour?.majorcolour}
                    minorColour={item.colour?.minorcolour}
                    color={item.colour?.majorcolour}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{item.itemtype}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">ID: {item.id}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 w-24 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(washCount / maxItemWashCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 w-8 text-right">{washCount}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Layout for Time-based Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Washes by Day of Week */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950 rounded-xl">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Washes by Day of Week</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Distribution across week</p>
            </div>
          </div>

          <div className="space-y-3">
            {analytics.dayOfWeekStats.map(({ day, count }) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-24 shrink-0">{day}</span>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-6 overflow-hidden flex items-center">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${Math.max((count / maxDayCount) * 100, 5)}%` }}
                  >
                    {count > 0 && <span className="text-xs font-bold text-white">{count}</span>}
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Washes by Month */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-green-100 dark:bg-green-950 rounded-xl">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Washes by Month</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Historical trends</p>
            </div>
          </div>

          {analytics.monthStats.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">No historical data</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {analytics.monthStats.map(({ monthKey, label, count }) => (
                <div key={monthKey} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-24 shrink-0">{label}</span>
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-6 overflow-hidden flex items-center">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((count / maxMonthCount) * 100, 5)}%` }}
                    >
                      {count > 0 && <span className="text-xs font-bold text-white">{count}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950 rounded-xl">
              <BarChart2 size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Detailed Item Analysis</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Complete wash history metrics per item</p>
            </div>
          </div>
        </div>

        {analytics.itemWashStats.length === 0 ? (
          <div className="p-8 text-center">
            <Droplets size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-zinc-500 dark:text-zinc-400">No wash data to display</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Item</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">Washes</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">Percentage</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {analytics.itemWashStats.map(({ item, washCount }, index) => {
                  const percentage = ((washCount / analytics.totalWashes) * 100).toFixed(1);
                  const frequency = washCount > 20 ? 'Very High' : washCount > 10 ? 'High' : washCount > 5 ? 'Medium' : 'Low';
                  const frequencyColor = washCount > 20 ? 'text-red-600' : washCount > 10 ? 'text-orange-600' : washCount > 5 ? 'text-yellow-600' : 'text-zinc-600';

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          to={`/item/${item.id}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                            <ItemSVGIcon
                              itemtype={item.itemtype}
                              size={16}
                              majorColour={item.colour?.majorcolour}
                              minorColour={item.colour?.minorcolour}
                              color={item.colour?.majorcolour}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.itemtype}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">#{item.id}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-indigo-600 dark:text-indigo-400">{washCount}</td>
                      <td className="px-6 py-4 text-center">{percentage}%</td>
                      <td className={cn("px-6 py-4 text-right font-semibold", frequencyColor)}>{frequency}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
