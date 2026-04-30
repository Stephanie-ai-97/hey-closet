import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Item, WearLog, Info, Colour } from '../types';
import { differenceInMonths, parseISO } from 'date-fns';

export interface ItemCPW {
  item: Item;
  wearCount: number;
  cpw: number;
}

export interface SpendingMonth {
  label: string; // "Jan 2025"
  month: string; // "2025-01"
  total: number;
  count: number;
}

export interface ColorFrequency {
  colour: string;
  count: number;
}

export interface AnalyticsData {
  cpwItems: ItemCPW[];
  spendingByMonth: SpendingMonth[];
  dominantColors: ColorFrequency[];
  dormantItems: Item[];
  totalSpend: number;
  totalWears: number;
  avgCPW: number;
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [items, wearLogs, infos, colours] = await Promise.all([
          api.list<Item>('item'),
          api.list<WearLog>('wearlog'),
          api.list<Info>('info'),
          api.list<Colour>('colour'),
        ]);

        const itemsList: Item[] = (items as any)?.data ?? items ?? [];
        const wearList: WearLog[] = (wearLogs as any)?.data ?? wearLogs ?? [];
        const infosList: Info[] = (infos as any)?.data ?? infos ?? [];
        const coloursList: Colour[] = (colours as any)?.data ?? colours ?? [];

        // CPW per item
        const cpwItems: ItemCPW[] = itemsList
          .map(item => {
            const wearCount = wearList.filter(w => w.dk_itemid === item.id).length;
            const normalizedItem = { ...item, id: (item as any).pk_item ?? item.id };
            const cpw = wearCount > 0 ? normalizedItem.itemcost / wearCount : Infinity;
            return { item: normalizedItem, wearCount, cpw };
          })
          .sort((a, b) => {
            if (a.cpw === Infinity && b.cpw === Infinity) return 0;
            if (a.cpw === Infinity) return 1;
            if (b.cpw === Infinity) return -1;
            return a.cpw - b.cpw;
          });

        // Spending by month (from item created_at)
        const monthMap = new Map<string, SpendingMonth>();
        for (const item of itemsList) {
          if (!item.created_at) continue;
          const d = parseISO(item.created_at);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const key = `${year}-${month}`;
          const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
          const existing = monthMap.get(key) ?? { label, month: key, total: 0, count: 0 };
          existing.total += item.itemcost ?? 0;
          existing.count += 1;
          monthMap.set(key, existing);
        }
        const spendingByMonth = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

        // Dominant colors from wear logs
        const wornItemIds = new Set(wearList.map(w => w.dk_itemid));
        const colorCount = new Map<string, number>();
        for (const info of infosList) {
          if (!wornItemIds.has(info.dk_itemid)) continue;
          const colour = coloursList.find(c => c.id === info.dk_colourid);
          if (!colour?.colouroverall) continue;
          const key = colour.colouroverall;
          colorCount.set(key, (colorCount.get(key) ?? 0) + wearList.filter(w => w.dk_itemid === info.dk_itemid).length);
        }
        const dominantColors: ColorFrequency[] = Array.from(colorCount.entries())
          .map(([colour, count]) => ({ colour, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        // Dormant items: no wear log in last 6 months
        const now = new Date();
        const dormantItems = itemsList
          .map(i => ({ ...i, id: (i as any).pk_item ?? i.id }))
          .filter(item => {
            const lastWear = wearList
              .filter(w => w.dk_itemid === item.id)
              .sort((a, b) => new Date(b.worn_date).getTime() - new Date(a.worn_date).getTime())[0];
            if (!lastWear) return true; // never worn
            return differenceInMonths(now, parseISO(lastWear.worn_date)) >= 6;
          });

        const totalSpend = itemsList.reduce((sum, i) => sum + (i.itemcost ?? 0), 0);
        const totalWears = wearList.length;
        const wornItems = cpwItems.filter(c => c.cpw !== Infinity);
        const avgCPW = wornItems.length > 0
          ? wornItems.reduce((s, c) => s + c.cpw, 0) / wornItems.length
          : 0;

        setData({ cpwItems, spendingByMonth, dominantColors, dormantItems, totalSpend, totalWears, avgCPW });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, loading, error };
}
