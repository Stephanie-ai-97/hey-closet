import { PageContainer } from '../components/PageContainer';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Item, Info, Style, Colour, Material, Wash, Storage, Home } from '../types';
import { 
  ArrowLeft, 
  Tag, 
  Calendar, 
  Droplets, 
  Edit, 
  Trash2,
  MapPin,
  Star,
  Info as InfoIcon,
  CheckCircle2,
  WashingMachine,
  Wind,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { EditItemModal } from '../components/EditItemModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ItemSVGIcon } from '../components/ItemSVGIcon';
import { useDashboardData } from '../hooks/useDashboardData';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { homes, storages } = useDashboardData();
  const [data, setData] = useState<{
    item: Item;
    info?: Info;
    style?: Style;
    colour?: Colour;
    material?: Material;
    washes: Wash[];
    storage?: Storage;
    home?: Home;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function loadItemData() {
      try {
        if (!id) return;
        const itemId = parseInt(id);
        const rawItem = await api.get<any>('item', itemId);
        const item: Item = { ...rawItem, id: rawItem.pk_itemid ?? rawItem.id };
        const storage: Storage | undefined = rawItem.storage
          ? { ...rawItem.storage, id: rawItem.storage.pk_closet ?? rawItem.storage.id }
          : undefined;

        // Fetch relations
        const [infos, washes] = await Promise.all([
          api.list<Info>('info', { dk_itemid: id }),
          api.list<Wash>('wash', { dk_itemid: id }),
        ]);

        let info, style, colour, material, home;
        if (infos.length > 0) {
          info = infos[0];
          [style, colour, material] = await Promise.all([
            info.dk_styleid ? api.get<Style>('style', info.dk_styleid) : Promise.resolve(undefined),
            info.dk_colourid ? api.get<Colour>('colour', info.dk_colourid) : Promise.resolve(undefined),
            info.dk_material ? api.get<Material>('material', info.dk_material) : Promise.resolve(undefined),
          ]);
        }

        if (storage) {
          home = await api.get<Home>('home', storage.dk_homelocation);
        }

        setData({ item, info, style, colour, material, washes, storage, home });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadItemData();
  }, [id]);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const itemId = parseInt(id);
      const rawItem = await api.get<any>('item', itemId);
      const item: Item = { ...rawItem, id: rawItem.pk_itemid ?? rawItem.id };
      const storage: Storage | undefined = rawItem.storage
        ? { ...rawItem.storage, id: rawItem.storage.pk_closet ?? rawItem.storage.id }
        : undefined;
      const [infos, washes] = await Promise.all([
        api.list<Info>('info', { dk_itemid: id }),
        api.list<Wash>('wash', { dk_itemid: id }),
      ]);
      let info, style, colour, material, home;
      if (infos.length > 0) {
        info = infos[0];
        [style, colour, material] = await Promise.all([
          info.dk_styleid ? api.get<Style>('style', info.dk_styleid) : Promise.resolve(undefined),
          info.dk_colourid ? api.get<Colour>('colour', info.dk_colourid) : Promise.resolve(undefined),
          info.dk_material ? api.get<Material>('material', info.dk_material) : Promise.resolve(undefined),
        ]);
      }
      if (storage) home = await api.get<Home>('home', storage.dk_homelocation);
      setData({ item, info, style, colour, material, washes, storage, home });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!data) return;
    await api.delete('item', data.item.id);
    navigate('/inventory');
  };

  const handleWashStatusChange = async (status: Item['wash_status']) => {
    if (!data) return;
    await api.update<Item>('item', data.item.id, { wash_status: status });
    await reload();
  };

  if (loading) return <div className="p-8 animate-pulse text-center">Decrypting item metadata...</div>;
  if (!data) return <div className="p-8 text-center">Item not found in archive.</div>;

  const { item, style, colour, material, washes, storage, home } = data;
  const washStatusConfig: Record<Item['wash_status'], { label: string; color: string; icon: React.ReactNode }> = {
    clean: { label: 'Clean', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    dirty: { label: 'Dirty', color: 'text-red-600 bg-red-50 border-red-200', icon: <AlertCircle size={14} /> },
    washing: { label: 'Washing', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <WashingMachine size={14} /> },
    drying: { label: 'Drying', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Wind size={14} /> },
  };
  const currentStatus = item.wash_status ?? 'clean';

  return (
    <>
      <EditItemModal
        isOpen={editOpen}
        item={item}
        storages={storages}
        homes={homes}
        onClose={() => setEditOpen(false)}
        onItemUpdated={reload}
      />
      <DeleteConfirmModal
        isOpen={deleteOpen}
        itemName={item.itemtype}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    <PageContainer 
      title={item.itemtype} 
      subtitle={`ID: #${item.id}`}
      actions={
        <div className="flex gap-2">
          <button onClick={() => setEditOpen(true)} className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors">
            <Edit size={20} />
          </button>
          <button onClick={() => setDeleteOpen(true)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      }
    >
      <Link to="/inventory" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-8 font-medium">
        <ArrowLeft size={16} />
        Back to Inventory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual & Core Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="aspect-[4/5] bg-zinc-100 rounded-3xl flex items-center justify-center text-zinc-300 overflow-hidden shadow-inner border border-zinc-200">
            <ItemSVGIcon itemtype={item.itemtype} size={80} color="#d4d4d8" />
          </div>
          
          {/* Wash Status */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-3 text-sm uppercase tracking-wider">Laundry Status</h3>
            <div className="flex flex-wrap gap-2">
              {(['clean', 'dirty', 'washing', 'drying'] as Item['wash_status'][]).map(status => {
                const cfg = washStatusConfig[status];
                return (
                  <button
                    key={status}
                    onClick={() => handleWashStatusChange(status)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      currentStatus === status ? cfg.color : 'text-zinc-400 border-zinc-200 bg-white hover:bg-zinc-50'
                    )}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <Star size={18} className="text-amber-400 fill-amber-400" />
              Preference Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Archive Rating</span>
                <span className="text-xl font-bold">{item.itemlikerating ?? '—'}<span className="text-zinc-300 text-sm font-normal">/10</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Archival Cost</span>
                <span className="text-xl font-bold">${(item.itemcost ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metadata */}
        <div className="lg:col-span-2 space-y-8">
          {/* Location Card */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-zinc-900 text-white rounded-2xl">
                <MapPin size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Physical Location</h2>
                <p className="text-sm text-zinc-500">Warehouse coordinates in your infrastructure.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Facility</span>
                <p className="font-semibold text-zinc-900">{home?.homename || 'Unknown'}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Storage Unit</span>
                <p className="font-semibold text-zinc-900">{storage?.closet || 'N/A'}</p>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Partition</span>
                <p className="font-semibold text-zinc-900">{storage?.closetpartition || 'Standard'}</p>
              </div>
            </div>
          </div>

          {/* Tags / Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-6">
                <Tag size={18} className="text-zinc-400" />
                Dimensional Tags
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-zinc-50">
                  <span className="text-sm text-zinc-500">Style Category</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{style?.styletype || 'Default'}</span>
                    {data.info && (
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-medium',
                        data.info.tag_source === 'user' ? 'bg-zinc-100 text-zinc-500' : 'bg-indigo-100 text-indigo-600'
                      )}>
                        {data.info.tag_source === 'user' ? 'Manual' : 'AI'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-50">
                  <span className="text-sm text-zinc-500">Primary Colour</span>
                  <span className="text-sm font-bold">{colour?.colouroverall || 'Neutral'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-50">
                  <span className="text-sm text-zinc-500">Material Base</span>
                  <span className="text-sm font-bold">{material?.texture || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-6">
                <Droplets size={18} className="text-blue-400" />
                Wash Protocol
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-tight mb-1">Instruction</p>
                  <p className="text-sm text-blue-800 font-medium">{item.itemwashmethod}</p>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-zinc-500 font-bold uppercase block mb-2">Wash Cycles</span>
                  <div className="space-y-2">
                    {washes.slice(0, 3).map(w => (
                      <div key={w.id} className="flex items-center gap-2 text-xs text-zinc-600">
                        <Calendar size={12} />
                        <span>{format(new Date(w.lastwashdate), 'MMMM dd, yyyy')}</span>
                      </div>
                    ))}
                    {washes.length === 0 && <p className="text-xs text-zinc-400 italic">No cleaning history recorded.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-xl shadow-zinc-200">
             <div className="flex items-center gap-2 mb-4">
              <InfoIcon size={18} className="text-zinc-400" />
              <h3 className="font-bold uppercase text-xs tracking-widest">Archivist Notes</h3>
             </div>
             <p className="text-zinc-300 leading-relaxed italic">
              "{item.itemcomment || "No special notes for this item in the archive records."}"
             </p>
          </div>
        </div>
      </div>
    </PageContainer>
    </>
  );
}
