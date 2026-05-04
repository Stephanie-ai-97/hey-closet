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
      
      // api.list already unwraps the {data: [...]} envelope
      const homesList = Array.isArray(h) ? h : [];
      const storagesList = Array.isArray(s) ? s : [];
      const itemsList = Array.isArray(i) ? i : [];
      
      const homesData = Array.isArray(homesList) ? homesList.map(home => ({
        id: home.pk_homelocation || home.id,
        homename: home.homename,
        homeaddress: home.homeaddress,
      })) : [];
      const storagesData = Array.isArray(storagesList) ? storagesList.map(storage => ({
        ...storage,
        id: storage.pk_closet ?? storage.id,
      })) : [];
      const itemsData = Array.isArray(itemsList) ? itemsList.map(item => ({
        ...item,
        id: (item as any).pk_itemid ?? item.id,
      })) : [];
      
      console.debug('[useDashboardData] Item IDs:', itemsData.map(i => i.id));
      
      // Debug: try to fetch info for first item to see if endpoint works
      if (itemsData.length > 0) {
        try {
          const firstItemId = itemsData[0].id;
          const itemInfoTest = await api.list<any>('info', { dk_itemid: String(firstItemId) });
          console.debug('[useDashboardData] Test: Fetched info for item', firstItemId, ':', itemInfoTest);
        } catch (err) {
          console.debug('[useDashboardData] Test: Failed to fetch info with query filter:', err);
        }
      }
      
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
