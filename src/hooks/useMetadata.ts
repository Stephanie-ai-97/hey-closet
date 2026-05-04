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
          api.list<any>('info'),
        ]);
        console.debug('[useMetadata] Raw API response - infos:', i);
        
        // Remap pk_* fields to expected field names
        const infosData = Array.isArray(i) ? i.map((info: any) => ({
          id: info.pk_info || info.id,
          dk_itemid: info.pk_item || info.dk_itemid,
          dk_styleid: info.pk_style || info.dk_styleid,
          dk_colourid: info.pk_colour || info.dk_colourid,
          dk_material: info.pk_material || info.dk_material,
          tag_source: info.tag_source || 'system',
        })) : [];
        
        console.debug('[useMetadata] After remapping - infos:', infosData);
        
        setColours(Array.isArray(c) ? c : []);
        setMaterials(Array.isArray(m) ? m : []);
        setStyles(Array.isArray(s) ? s : []);
        setInfos(infosData);
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
