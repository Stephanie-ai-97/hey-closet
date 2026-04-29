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
        api.list<any>('home'),
        api.list<Storage>('storage'),
        api.list<Item>('item'),
      ]);
      console.debug('[useDashboardData] Raw API response - homes:', h);
      console.debug('[useDashboardData] Raw API response - storages:', s);
      console.debug('[useDashboardData] Raw API response - items:', i);
      
      // Map API response to Home interface - API returns pk_homelocation but interface expects id
      const homesData = Array.isArray(h) ? h.map(home => ({
        id: home.pk_homelocation || home.id,
        homename: home.homename,
        homeaddress: home.homeaddress,
      })) : [];
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
