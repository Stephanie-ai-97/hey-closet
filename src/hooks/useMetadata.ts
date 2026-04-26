import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Colour, Material, Style, Info } from '../types';

export function useMetadata() {
  const [colours, setColours] = useState<Colour[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [infos, setInfos] = useState<Info[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        setLoading(true);
        const [c, m, s, i] = await Promise.all([
          api.list<Colour>('colour'),
          api.list<Material>('material'),
          api.list<Style>('style'),
          api.list<Info>('info'),
        ]);
        setColours(c);
        setMaterials(m);
        setStyles(s);
        setInfos(i);
      } catch (err) {
        console.error('Failed to fetch metadata', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetadata();
  }, []);

  return { colours, materials, styles, infos, loading };
}
