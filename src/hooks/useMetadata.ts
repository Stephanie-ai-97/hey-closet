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
          api.list<any>('colour'),
          api.list<any>('material'),
          api.list<any>('style'),
          api.list<any>('info'),
        ]);
        
        console.debug('[useMetadata] Raw API responses:', {
          coloursSample: c?.[0],
          materialsSample: m?.[0],
          stylesSample: s?.[0],
          infosSample: i?.[0],
        });
        
        // Remap pk_* fields to id for colours, materials, styles
        const coloursData = Array.isArray(c) ? c.map((item: any) => ({
          ...item,
          id: item.pk_colour ?? item.id,
        })) : [];
        
        const materialsData = Array.isArray(m) ? m.map((item: any) => ({
          ...item,
          id: item.pk_material ?? item.id,
        })) : [];
        
        const stylesData = Array.isArray(s) ? s.map((item: any) => ({
          ...item,
          id: item.pk_style ?? item.id,
        })) : [];
        
        // Remap pk_* fields to expected field names for info
        const infosData = Array.isArray(i) ? i.map((info: any) => ({
          id: info.pk_info ?? info.id,
          dk_itemid: info.pk_item ?? info.dk_itemid ?? info.fk_item,
          dk_styleid: info.pk_style ?? info.dk_styleid ?? info.fk_style,
          dk_colourid: info.pk_colour ?? info.dk_colourid ?? info.fk_colour,
          dk_material: info.pk_material ?? info.dk_material ?? info.fk_material,
          tag_source: info.tag_source ?? 'system',
        })) : [];
        
        console.debug('[useMetadata] After remapping:', {
          coloursCount: coloursData.length,
          coloursData: coloursData.slice(0, 3),
          materialsCount: materialsData.length,
          stylesCount: stylesData.length,
          infosCount: infosData.length,
          infosData: infosData.slice(0, 3),
        });
        
        setColours(coloursData);
        setMaterials(materialsData);
        setStyles(stylesData);
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
