import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Storage, Home, Info } from '../types';
import { api } from '../services/api';
import { useMetadata } from '../hooks/useMetadata';
import { RATING_OPTIONS, SIZE_OPTION_GROUPS, SIZE_OPTIONS, WASH_METHOD_OPTIONS } from '../lib/itemOptions';
import { ComboboxInput } from './ComboboxInput';

interface ItemModalProps {
  isOpen: boolean;
  storages: Storage[];
  homes: Home[];
  onClose: () => void;
  onItemAdded: () => void;
}

export function ItemModal({ isOpen, storages, homes, onClose, onItemAdded }: ItemModalProps) {
  const { colours, materials, styles } = useMetadata();
  
  const [dk_closet, setDk_closet] = useState<string>('');
  const [itemtype, setItemtype] = useState('');
  const [itemsize, setItemsize] = useState('');
  const [isoncamera, setIsoncamera] = useState(false);
  const [itemlikerating, setItemlikerating] = useState(5);
  const [itemcost, setItemcost] = useState('');
  const [itemcomment, setItemcomment] = useState('');
  const [itemwashmethod, setItemwashmethod] = useState('hand wash');
  const [colouroverall, setColouroverall] = useState('');
  const [isMultiColour, setIsMultiColour] = useState(false);
  const [majorcolour, setMajorcolour] = useState('');
  const [minorcolour, setMinorcolour] = useState('');
  const [texture, setTexture] = useState('');
  const [styletype, setStyletype] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Get unique values from metadata
  const existingColours = Array.from(new Set<string>(
    colours.map(c => c.colouroverall).filter((colour): colour is string => typeof colour === 'string' && Boolean(colour))
  )).sort();
  const existingTextures = Array.from(new Set<string>(
    materials.map(m => m.texture).filter((texture): texture is string => typeof texture === 'string' && Boolean(texture))
  )).sort();
  const existingStyles = Array.from(new Set<string>(
    styles.map(s => s.styletype).filter((style): style is string => typeof style === 'string' && Boolean(style))
  )).sort();
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    // Validate all required fields
    if (!dk_closet) errors.dk_closet = 'Storage location is required';
    if (!itemtype) errors.itemtype = 'Item type is required';
    if (!itemsize) errors.itemsize = 'Size is required';
    if (!colouroverall) errors.colouroverall = 'Colour is required';
    if (isMultiColour) {
      if (!majorcolour) errors.majorcolour = 'Major colour is required for multi-colour items';
      if (!minorcolour) errors.minorcolour = 'Minor colour is required for multi-colour items';
    }
    if (!texture) errors.texture = 'Material is required';
    if (!styletype) errors.styletype = 'Style is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fill in all required fields marked with *');
      return;
    }

    setFieldErrors({});
    setError(null);

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create item
      const itemResponse = await api.create<any>('item', {
        dk_closet: Number(dk_closet),
        itemtype,
        itemsize,
        isoncamera,
        itemlikerating,
        itemcomment,
        itemwashmethod,
        itemcost: itemcost ? parseFloat(itemcost) : 0,
      });

      // Step 2: Create colour
      const colourData = {
        colouroverall,
        majorcolour: isMultiColour ? majorcolour : colouroverall,
        minorcolour: isMultiColour ? minorcolour : colouroverall,
      };
      const colourResponse = await api.create<any>('colour', colourData);

      // Step 3: Create material
      const materialResponse = await api.create<any>('material', {
        texture,
        softness: '',
        thickness: '',
      });

      // Step 4: Create style
      const styleResponse = await api.create<any>('style', {
        styletype,
        styleyear: new Date().getFullYear(),
        stylefitsize: itemsize,
      });

      // Step 5: Create info junction using pk_* fields from each response
      await api.create<Info>('info', {
        dk_itemid: itemResponse.data?.pk_itemid ?? itemResponse.pk_itemid,
        dk_styleid: styleResponse.data?.pk_styleid ?? styleResponse.pk_styleid,
        dk_colourid: colourResponse.data?.pk_colourid ?? colourResponse.pk_colourid,
        dk_material: materialResponse.data?.pk_material ?? materialResponse.pk_material,
      });

      // Reset form
      setDk_closet('');
      setItemtype('');
      setItemsize('');
      setIsoncamera(false);
      setItemlikerating(5);
      setItemcost('');
      setItemcomment('');
      setItemwashmethod('hand wash');
      setColouroverall('');
      setIsMultiColour(false);
      setMajorcolour('');
      setMinorcolour('');
      setTexture('');
      setStyletype('');
      setFieldErrors({});
      setError(null);
      
      onItemAdded();
      onClose();
    } catch (err) {
      console.error('Failed to create item:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item';
      setError(errorMessage);
      setFieldErrors({});
    } finally {
      setIsLoading(false);
    }
  };

  // Group storages by home
  const storagesByHome = homes.map(home => ({
    home,
    storages: storages.filter(s => s.dk_homelocation === home.id)
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Add New Item</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Enter the details of your new wardrobe item</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Storage Location - Required */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Storage Location <span className="text-red-500">*</span>
            </label>
            <select
              value={dk_closet}
              onChange={(e) => setDk_closet(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 ${
                fieldErrors.dk_closet
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
              required
            >
              <option value="">Select a storage location</option>
              {storagesByHome.map(({ home, storages: homeStorages }) => (
                <optgroup key={home.id} label={home.homename}>
                  {homeStorages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage.closet} ({storage.closetpartition})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {fieldErrors.dk_closet && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.dk_closet}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Item Type - Required */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Item Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={itemtype}
                onChange={(e) => setItemtype(e.target.value)}
                placeholder="e.g., T-shirt, Jeans"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 ${
                  fieldErrors.itemtype
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
                required
              />
              {fieldErrors.itemtype && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.itemtype}</p>
              )}
            </div>

            {/* Item Size - Required */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Size <span className="text-red-500">*</span>
              </label>
              <select
                value={itemsize}
                onChange={(e) => setItemsize(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 ${
                  fieldErrors.itemsize
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
                required
              >
                <option value="">Select size</option>
                {itemsize && !SIZE_OPTIONS.includes(itemsize) && (
                  <option value={itemsize}>{itemsize}</option>
                )}
                {SIZE_OPTION_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((size) => (
                      <option key={`${group.label}-${size}`} value={size}>
                        {size}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {fieldErrors.itemsize && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.itemsize}</p>
              )}
            </div>
          </div>

          {/* Colour - Required */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Colour <span className="text-red-500">*</span>
            </label>
            <ComboboxInput
              id="item-colour"
              value={colouroverall}
              onChange={setColouroverall}
              options={existingColours}
              placeholder={existingColours.length ? 'Select or type colour' : 'Type colour'}
              hasError={Boolean(fieldErrors.colouroverall)}
            />
            {fieldErrors.colouroverall && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.colouroverall}</p>
            )}
          </div>

          {/* Colour Mode Toggle */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <input
              type="checkbox"
              id="multicolour"
              checked={isMultiColour}
              onChange={(e) => setIsMultiColour(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 cursor-pointer"
            />
            <label htmlFor="multicolour" className="text-sm font-medium text-zinc-900 dark:text-zinc-50 cursor-pointer">
              Multi-colour item (major + minor colours)
            </label>
          </div>

          {/* Major and Minor Colour Fields - Show when multi-colour */}
          {isMultiColour && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Major Colour <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={majorcolour}
                  onChange={(e) => setMajorcolour(e.target.value)}
                  placeholder="e.g., Blue"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 ${
                    fieldErrors.majorcolour
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
                {fieldErrors.majorcolour && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.majorcolour}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Minor Colour <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={minorcolour}
                  onChange={(e) => setMinorcolour(e.target.value)}
                  placeholder="e.g., White"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 ${
                    fieldErrors.minorcolour
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
                {fieldErrors.minorcolour && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.minorcolour}</p>
                )}
              </div>
            </div>
          )}

          {/* Material/Texture - Required */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Material <span className="text-red-500">*</span>
            </label>
            <ComboboxInput
              id="item-material"
              value={texture}
              onChange={setTexture}
              options={existingTextures}
              placeholder={existingTextures.length ? 'Select or type material' : 'Type material'}
              hasError={Boolean(fieldErrors.texture)}
            />
            {fieldErrors.texture && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.texture}</p>
            )}
          </div>

          {/* Major and Minor Colour Fields - Show when multi-colour */}
          {isMultiColour && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Major Colour <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={majorcolour}
                  onChange={(e) => setMajorcolour(e.target.value)}
                  placeholder="e.g., Blue"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 ${
                    fieldErrors.majorcolour
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
                {fieldErrors.majorcolour && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.majorcolour}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Minor Colour <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={minorcolour}
                  onChange={(e) => setMinorcolour(e.target.value)}
                  placeholder="e.g., White"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 ${
                    fieldErrors.minorcolour
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
                {fieldErrors.minorcolour && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.minorcolour}</p>
                )}
              </div>
            </div>
          )}

          {/* Style and Cost */}
          <div className="grid grid-cols-2 gap-4">
            {/* Style - Required */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Style <span className="text-red-500">*</span>
              </label>
              <ComboboxInput
                id="item-style"
                value={styletype}
                onChange={setStyletype}
                options={existingStyles}
                placeholder={existingStyles.length ? 'Select or type style' : 'Type style'}
                hasError={Boolean(fieldErrors.styletype)}
              />
              {fieldErrors.styletype && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.styletype}</p>
              )}
            </div>

            {/* Item Cost - Optional */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Cost ($) <span className="text-zinc-400 text-xs">(optional)</span>
              </label>
              <input
                type="number"
                value={itemcost}
                onChange={(e) => setItemcost(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              />
            </div>
          </div>

          {/* Like Rating and Wash Method */}
          <div className="grid grid-cols-2 gap-4">
            {/* Like Rating */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Rating (1-10)
              </label>
              <select
                value={itemlikerating}
                onChange={(e) => setItemlikerating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              >
                {RATING_OPTIONS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </div>

            {/* Wash Method */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Wash Method
              </label>
              <select
                value={itemwashmethod}
                onChange={(e) => setItemwashmethod(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              >
                {WASH_METHOD_OPTIONS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Description
            </label>
            <textarea
              value={itemcomment}
              onChange={(e) => setItemcomment(e.target.value)}
              placeholder="Add any notes or details about this item..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-500 transition-all resize-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          {/* On Camera Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isoncamera"
              checked={isoncamera}
              onChange={(e) => setIsoncamera(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 cursor-pointer"
            />
            <label htmlFor="isoncamera" className="text-sm font-medium text-zinc-900 dark:text-zinc-50 cursor-pointer">
              Item is on camera
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
