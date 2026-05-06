import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Colour, Material, Style, Info, ForLocation } from '../types';

export function useMetadata() {
  const [colours, setColours] = useState<Colour[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [infos, setInfos] = useState<Info[]>([]);
  const [forLocations, setForLocations] = useState<ForLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        setLoading(true);
        const [c, m, s, i, f] = await Promise.all([
          api.list<any>('colour'),
          api.list<any>('material'),
          api.list<any>('style'),
          api.list<any>('info'),
          api.list<any>('for_location'),
        ]);
        
        console.debug('[useMetadata] Raw API responses:', {
          coloursSample: c?.[0],
          materialsSample: m?.[0],
          stylesSample: s?.[0],
          infosSample: i?.[0],
          forLocationsSample: f?.[0],
        });
        
        // Remap pk_* fields to id for colours, materials, styles
        const coloursData = Array.isArray(c) ? c.map((item: any) => ({
          ...item,
          id: item.pk_colourid ?? item.id,
        })) : [];
        
        const materialsData = Array.isArray(m) ? m.map((item: any) => ({
          ...item,
          id: item.pk_material ?? item.id,
        })) : [];
        
        const stylesData = Array.isArray(s) ? s.map((item: any) => ({
          ...item,
          id: item.pk_styleid ?? item.id,
        })) : [];
        
        // Remap pk_* fields to expected field names for info
        const infosData = Array.isArray(i) ? i.map((info: any) => ({
          id: info.pk_infoid ?? info.id,
          dk_itemid: info.dk_itemid,
          dk_styleid: info.dk_styleid,
          dk_colourid: info.dk_colourid,
          dk_material: info.dk_material,
          tag_source: info.tag_source ?? 'system',
        })) : [];
        
        // Remap pk_* fields to id for for_location
        const forLocationsData = Array.isArray(f) ? f.map((item: any) => ({
          ...item,
          id: item.pk_forlocationid ?? item.id,
        })) : [];
        
        console.debug('[useMetadata] After remapping:', {
          coloursCount: coloursData.length,
          coloursData: coloursData.slice(0, 3),
          materialsCount: materialsData.length,
          stylesCount: stylesData.length,
          infosCount: infosData.length,
          infosData: infosData.slice(0, 3),
          forLocationsCount: forLocationsData.length,
          forLocationsData: forLocationsData.slice(0, 3),
        });
        
        setColours(coloursData);
        setMaterials(materialsData);
        setStyles(stylesData);
        setInfos(infosData);
        setForLocations(forLocationsData);
      } catch (err) {
        console.error('Failed to fetch metadata', err);
        setColours([]);
        setMaterials([]);
        setStyles([]);
        setInfos([]);
        setForLocations([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMetadata();
  }, []);

  return { colours, materials, styles, infos, forLocations, loading };
}
