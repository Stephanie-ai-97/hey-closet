import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Home, Storage, Item, Colour, Material, Style, Wash } from '../types';

export function useDashboardData() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [storages, setStorages] = useState<Storage[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.debug('[useDashboardData] Starting data fetch...');
      const [h, s, i] = await Promise.all([
        api.list<Home>('home'),
        api.list<Storage>('storage'),
        api.list<Item>('item'),
      ]);
      console.debug('[useDashboardData] Raw API response - homes:', h);
      console.debug('[useDashboardData] Raw API response - storages:', s);
      console.debug('[useDashboardData] Raw API response - items:', i);
      
      const homesData = Array.isArray(h) ? h : [];
      const storagesData = Array.isArray(s) ? s : [];
      const itemsData = Array.isArray(i) ? i : [];
      
      console.debug('[useDashboardData] After processing - homes:', homesData, 'count:', homesData.length);
      console.debug('[useDashboardData] After processing - storages:', storagesData, 'count:', storagesData.length);
      console.debug('[useDashboardData] After processing - items:', itemsData, 'count:', itemsData.length);
      
      setHomes(homesData);
      setStorages(storagesData);
      setItems(itemsData);
    } catch (err) {
      console.error('[useDashboardData] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { homes, storages, items, loading, error, refetch: fetchData };
}
