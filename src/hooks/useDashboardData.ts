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
      const [h, s, i] = await Promise.all([
        api.list<Home>('home'),
        api.list<Storage>('storage'),
        api.list<Item>('item'),
      ]);
      setHomes(Array.isArray(h) ? h : []);
      setStorages(Array.isArray(s) ? s : []);
      setItems(Array.isArray(i) ? i : []);
    } catch (err) {
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
