import { PageContainer } from '../components/PageContainer';
import { useDashboardData } from '../hooks/useDashboardData';
import { useMetadata } from '../hooks/useMetadata';
import { useItemColours } from '../hooks/useItemColours';
import { useState, useMemo } from 'react';
import { 
  Search as SearchIcon, 
  Tag, 
  Palette, 
  Layers, 
  Zap,
  RotateCcw,
  MapPin,
  LayoutGrid,
  Grid2X2,
  List,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { ItemSVGIcon } from '../components/ItemSVGIcon';

type DisplayMode = 'tile' | 'card' | 'list' | 'icon';

const normalizeColour = (colour: string) => colour.trim().toLocaleLowerCase();

export default function AdvancedSearch() {
  const { items, storages, homes, loading: itemsLoading } = useDashboardData();
  const { itemsWithColours } = useItemColours(items);
  const { colours, materials, styles, infos, forLocations, loading: metaLoading } = useMetadata();
  
  const [selectedColours, setSelectedColours] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');

  const sortedForLocations = useMemo(
    () => [...forLocations].sort((a, b) => a.forlocationtype.localeCompare(b.forlocationtype, undefined, { sensitivity: 'base' })),
    [forLocations]
  );
  const sortedStyles = useMemo(
    () => [...styles].sort((a, b) => {
      const typeCompare = a.styletype.localeCompare(b.styletype, undefined, { sensitivity: 'base' });
      return typeCompare || a.styleyear - b.styleyear;
    }),
    [styles]
  );
  const sortedColours = useMemo(
    () => {
      const coloursByOverall = new Map<string, (typeof colours)[number]>();

      colours.forEach(colour => {
        const key = normalizeColour(colour.colouroverall);
        if (key && !coloursByOverall.has(key)) {
          coloursByOverall.set(key, colour);
        }
      });

      return [...coloursByOverall.values()].sort((a, b) =>
        a.colouroverall.localeCompare(b.colouroverall, undefined, { sensitivity: 'base' })
      );
    },
    [colours]
  );
  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => a.texture.localeCompare(b.texture, undefined, { sensitivity: 'base' })),
    [materials]
  );

  console.debug('[AdvancedSearch] Component rendered with:', {
    itemsCount: itemsWithColours.length,
    infosCount: infos.length,
    coloursCount: colours.length,
    stylesCount: styles.length,
    materialsCount: materials.length,
    forLocationsCount: forLocations.length,
    sampleInfos: infos.slice(0, 3),
    sampleItems: itemsWithColours.slice(0, 3).map(i => ({
      id: i.id,
      itemtype: i.itemtype,
      // Check if metadata might be stored differently on item
      ...Object.keys(i).filter(k => k.includes('colour') || k.includes('material') || k.includes('style')).reduce((acc, key) => {
        acc[key] = (i as any)[key];
        return acc;
      }, {} as any),
    })),
  });

  const toggleFilter = <T,>(list: T[], setList: (l: T[]) => void, id: T) => {
    if (list.includes(id)) {
      console.debug('[AdvancedSearch] Removing filter:', id);
      setList(list.filter(i => i !== id));
    } else {
      console.debug('[AdvancedSearch] Adding filter:', id);
      setList([...list, id]);
    }
  };

  const filteredItems = useMemo(() => {
    console.debug('[AdvancedSearch] Filtering with:', {
      selectedColours,
      selectedStyles,
      selectedMaterials,
      selectedLocations,
      totalItems: itemsWithColours.length,
      totalInfos: infos.length,
      itemIds: itemsWithColours.map(i => i.id),
      infoRecords: infos.slice(0, 3), // Log first 3 info records
    });

    if (selectedColours.length === 0 && selectedStyles.length === 0 && selectedMaterials.length === 0 && selectedLocations.length === 0) {
      console.debug('[AdvancedSearch] No filters selected, returning empty array');
      return [];
    }

    const selectedColourIds = new Set(
      colours
        .filter(colour => selectedColours.includes(normalizeColour(colour.colouroverall)))
        .map(colour => colour.id)
    );

    const result = itemsWithColours.filter(item => {
      const itemInfo = infos.filter(info => {
        const matches = info.dk_itemid === item.id;
        if (!matches) {
          console.debug(`[AdvancedSearch] Info dk_itemid=${info.dk_itemid} doesn't match item.id=${item.id}`);
        }
        return matches;
      });
      
      console.debug('[AdvancedSearch] Item', item.id, '- found', itemInfo.length, 'info records');
      
      if (itemInfo.length === 0) {
        return false;
      }

      const matchesColour = selectedColours.length === 0 || itemInfo.some(info => selectedColourIds.has(info.dk_colourid));
      const matchesStyle = selectedStyles.length === 0 || itemInfo.some(info => selectedStyles.includes(info.dk_styleid));
      const matchesMaterial = selectedMaterials.length === 0 || itemInfo.some(info => selectedMaterials.includes(info.dk_material));
      
      // For locations: check if any of the item's styles are linked to selected locations
      const matchesLocation = selectedLocations.length === 0 || itemInfo.some(info => {
        return forLocations.some(loc => loc.dk_styleid === info.dk_styleid && selectedLocations.includes(loc.id));
      });

      const matches = matchesColour && matchesStyle && matchesMaterial && matchesLocation;
      if (matches) {
        console.debug('[AdvancedSearch] Item', item.id, 'matches filters');
      }
      return matches;
    });
    
    console.debug('[AdvancedSearch] Filtered result count:', result.length);
    return result;
  }, [itemsWithColours, infos, colours, selectedColours, selectedStyles, selectedMaterials, selectedLocations, forLocations]);

  const resetFilters = () => {
    setSelectedColours([]);
    setSelectedStyles([]);
    setSelectedMaterials([]);
    setSelectedLocations([]);
  };

  const displayOptions: Array<{ mode: DisplayMode; label: string; icon: typeof LayoutGrid }> = [
    { mode: 'tile', label: 'Tile', icon: Grid2X2 },
    { mode: 'card', label: 'Card', icon: LayoutGrid },
    { mode: 'list', label: 'List', icon: List },
    { mode: 'icon', label: 'Icon', icon: Tag },
  ];

  if (itemsLoading || metaLoading) return <div className="p-8 animate-pulse dark:text-zinc-400">Initializing neural search...</div>;

  const getLocationPath = (dk_closet: number) => {
    const storage = storages.find(s => s.id === dk_closet);
    const home = homes.find(h => h.id === storage?.dk_homelocation);
    if (!storage) return 'Unknown';
    return `${home?.homename ?? '?'} → ${storage.closet} → ${storage.closetpartition}`;
  };

  return (
    <PageContainer 
      title="Tag Explorer" 
      subtitle="Discover items through multi-dimensional metadata filtering."
      actions={
        <button 
          onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors text-sm font-bold"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-8">
          {/* For Locations */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-zinc-50">
              <MapPin size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Location Type</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedForLocations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => toggleFilter(selectedLocations, setSelectedLocations, loc.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selectedLocations.includes(loc.id)
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                  )}
                >
                  {loc.forlocationtype}
                </button>
              ))}
            </div>
          </section>

          {/* Styles */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-zinc-50">
              <Zap size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Aesthetic Style</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedStyles.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleFilter(selectedStyles, setSelectedStyles, s.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selectedStyles.includes(s.id)
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                  )}
                >
                  {s.styletype} ({s.styleyear})
                </button>
              ))}
            </div>
          </section>

          {/* Colours */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-zinc-50">
              <Palette size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Colour Space</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedColours.map(c => (
                <button
                  key={normalizeColour(c.colouroverall)}
                  onClick={() => toggleFilter(selectedColours, setSelectedColours, normalizeColour(c.colouroverall))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selectedColours.includes(normalizeColour(c.colouroverall))
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                  )}
                >
                  {c.colouroverall}
                </button>
              ))}
            </div>
          </section>

          {/* Materials */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-zinc-50">
              <Layers size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Material Texture</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedMaterials.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleFilter(selectedMaterials, setSelectedMaterials, m.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selectedMaterials.includes(m.id)
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                  )}
                >
                  {m.texture}
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* Results Area */}
        <main className="lg:col-span-3">
          <div className="mb-3 flex justify-end">
            <div className="flex overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
              {displayOptions.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDisplayMode(mode)}
                  title={label}
                  aria-label={`${label} display`}
                  aria-pressed={displayMode === mode}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all',
                    displayMode === mode
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                  )}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-8 min-h-[500px]">
            {filteredItems.length > 0 ? (
              <div
                className={cn(
                  displayMode === 'card' && 'grid grid-cols-1 md:grid-cols-2 gap-4',
                  displayMode === 'tile' && 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3',
                  displayMode === 'list' && 'space-y-3',
                  displayMode === 'icon' && 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3'
                )}
              >
                {filteredItems.map(item => {
                  const itemInfos = infos.filter(info => info.dk_itemid === item.id);
                  const colourDots = (
                    <div className="flex gap-1">
                      {itemInfos.map(info => {
                        const c = colours.find(col => col.id === info.dk_colourid);
                        return c ? (
                          <span key={info.id} className="w-3 h-3 rounded-full border border-zinc-200 dark:border-zinc-700" title={c.colouroverall} style={{ backgroundColor: c.colouroverall.toLowerCase() }} />
                        ) : null;
                      })}
                    </div>
                  );
                  const locationPath = getLocationPath(item.dk_closet);

                  if (displayMode === 'tile') {
                    return (
                      <Link
                        to={`/item/${item.id}`}
                        key={item.id}
                        className="group bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
                      >
                        <div className="relative aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-lg mb-3 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 transition-colors">
                          <ItemSVGIcon 
                            itemtype={item.itemtype} 
                            size={36}
                            majorColour={item.colour?.majorcolour}
                            minorColour={item.colour?.minorcolour}
                            color={item.colour?.majorcolour}
                          />
                          <span className="absolute bottom-1.5 right-1.5 max-w-[70%] truncate rounded bg-white/85 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-700 dark:bg-zinc-900/85 dark:text-zinc-200">
                            {item.itemsize}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{item.itemtype}</h4>
                          <div className="mt-2">{colourDots}</div>
                        </div>
                      </Link>
                    );
                  }

                  if (displayMode === 'list') {
                    return (
                      <Link
                        to={`/item/${item.id}`}
                        key={item.id}
                        className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
                      >
                        <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-lg shrink-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                          <ItemSVGIcon 
                            itemtype={item.itemtype} 
                            size={30}
                            majorColour={item.colour?.majorcolour}
                            minorColour={item.colour?.minorcolour}
                            color={item.colour?.majorcolour}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{item.itemtype}</h4>
                            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{item.itemsize}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                            <MapPin size={10} />
                            <span className="truncate text-[10px]">{locationPath}</span>
                          </div>
                        </div>
                        <div className="hidden sm:block">{colourDots}</div>
                      </Link>
                    );
                  }

                  if (displayMode === 'icon') {
                    return (
                      <Link
                        to={`/item/${item.id}`}
                        key={item.id}
                        className="group bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-28 flex flex-col items-center justify-center gap-2 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
                      >
                        <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-xl shrink-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 transition-colors">
                          <ItemSVGIcon 
                            itemtype={item.itemtype} 
                            size={32}
                            majorColour={item.colour?.majorcolour}
                            minorColour={item.colour?.minorcolour}
                            color={item.colour?.majorcolour}
                          />
                        </div>
                        <div className="w-full min-w-0">
                          <h4 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{item.itemtype}</h4>
                          <p className="truncate text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">{item.itemsize}</p>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      to={`/item/${item.id}`}
                      key={item.id}
                      className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
                    >
                      <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-lg shrink-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                        <ItemSVGIcon 
                          itemtype={item.itemtype} 
                          size={32}
                          majorColour={item.colour?.majorcolour}
                          minorColour={item.colour?.minorcolour}
                          color={item.colour?.majorcolour}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{item.itemtype}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Size: {item.itemsize}</p>
                        <div className="flex items-center gap-1 mt-1 text-zinc-400 dark:text-zinc-500">
                          <MapPin size={10} />
                          <span className="text-[10px] truncate">{locationPath}</span>
                        </div>
                        <div className="mt-2">{colourDots}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 text-center">
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-full mb-6 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50">
                  <SearchIcon size={48} className="opacity-20" />
                </div>
                <h3 className="text-zinc-900 dark:text-zinc-50 font-bold text-lg mb-2">Refine your search</h3>
                <p className="max-w-xs text-sm">
                  Select tags from the sidebar to visualize item intersections across your wardrobe.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </PageContainer>
  );
}
