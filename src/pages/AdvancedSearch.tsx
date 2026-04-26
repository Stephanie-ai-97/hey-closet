import { PageContainer } from '../components/PageContainer';
import { useDashboardData } from '../hooks/useDashboardData';
import { useMetadata } from '../hooks/useMetadata';
import { useState, useMemo } from 'react';
import { 
  Search as SearchIcon, 
  Tag, 
  Palette, 
  Layers, 
  Zap,
  RotateCcw,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function AdvancedSearch() {
  const { items, loading: itemsLoading } = useDashboardData();
  const { colours, materials, styles, infos, loading: metaLoading } = useMetadata();
  
  const [selectedColours, setSelectedColours] = useState<number[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);

  const toggleFilter = (list: number[], setList: (l: number[]) => void, id: number) => {
    if (list.includes(id)) {
      setList(list.filter(i => i !== id));
    } else {
      setList([...list, id]);
    }
  };

  const filteredItems = useMemo(() => {
    if (selectedColours.length === 0 && selectedStyles.length === 0 && selectedMaterials.length === 0) {
      return [];
    }

    return items.filter(item => {
      const itemInfo = infos.filter(info => info.dk_itemid === item.id);
      if (itemInfo.length === 0) return false;

      const matchesColour = selectedColours.length === 0 || itemInfo.some(info => selectedColours.includes(info.dk_colourid));
      const matchesStyle = selectedStyles.length === 0 || itemInfo.some(info => selectedStyles.includes(info.dk_styleid));
      const matchesMaterial = selectedMaterials.length === 0 || itemInfo.some(info => selectedMaterials.includes(info.dk_material));

      return matchesColour && matchesStyle && matchesMaterial;
    });
  }, [items, infos, selectedColours, selectedStyles, selectedMaterials]);

  const resetFilters = () => {
    setSelectedColours([]);
    setSelectedStyles([]);
    setSelectedMaterials([]);
  };

  if (itemsLoading || metaLoading) return <div className="p-8 animate-pulse">Initializing neural search...</div>;

  return (
    <PageContainer 
      title="Tag Explorer" 
      subtitle="Discover items through multi-dimensional metadata filtering."
      actions={
        <button 
          onClick={resetFilters}
          className="flex items-center gap-2 px-3 py-1.5 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-bold"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-8">
          {/* Colours */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-900">
              <Palette size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Colour Space</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {colours.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleFilter(selectedColours, setSelectedColours, c.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selectedColours.includes(c.id)
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                  )}
                >
                  {c.colouroverall}
                </button>
              ))}
            </div>
          </section>

          {/* Styles */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-900">
              <Zap size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Aesthetic Style</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {styles.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleFilter(selectedStyles, setSelectedStyles, s.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selectedStyles.includes(s.id)
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                  )}
                >
                  {s.styletype} ({s.styleyear})
                </button>
              ))}
            </div>
          </section>

          {/* Materials */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-900">
              <Layers size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Material Texture</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {materials.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleFilter(selectedMaterials, setSelectedMaterials, m.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selectedMaterials.includes(m.id)
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
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
          <div className="bg-zinc-100 rounded-2xl p-8 min-h-[500px]">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map(item => (
                  <Link
                    to={`/item/${item.id}`}
                    key={item.id}
                    className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4 hover:border-zinc-400 transition-all"
                  >
                    <div className="w-16 h-16 bg-zinc-50 rounded-lg shrink-0 flex items-center justify-center text-zinc-300">
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{item.itemtype}</h4>
                      <p className="text-xs text-zinc-500">Size: {item.itemsize}</p>
                      <div className="flex gap-1 mt-2">
                        {infos.filter(info => info.dk_itemid === item.id).map(info => {
                          const c = colours.find(col => col.id === info.dk_colourid);
                          return c ? (
                            <span key={info.id} className="w-3 h-3 rounded-full border border-zinc-200" title={c.colouroverall} style={{ backgroundColor: c.colouroverall.toLowerCase() }} />
                          ) : null;
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center">
                <div className="p-6 bg-white rounded-full mb-6 shadow-xl shadow-zinc-200/50">
                  <SearchIcon size={48} className="opacity-20" />
                </div>
                <h3 className="text-zinc-900 font-bold text-lg mb-2">Refine your search</h3>
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
