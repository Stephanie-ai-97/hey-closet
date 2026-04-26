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
        setColours(Array.isArray(c) ? c : []);
        setMaterials(Array.isArray(m) ? m : []);
        setStyles(Array.isArray(s) ? s : []);
        setInfos(Array.isArray(i) ? i : []);
      } catch (err) {
        console.error('Failed to fetch metadata', err);
        setColours([]);
        setMaterials([]);
        setStyles([]);
        setInfos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMetadata();
  }, []);

  return { colours, materials, styles, infos, loading };
}
