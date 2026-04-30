import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Star } from 'lucide-react';
import { ItemPhoto } from '../types';
import { api } from '../services/api';

interface ImageUploadProps {
  itemId: number;
  photos: ItemPhoto[];
  onPhotosChanged: () => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

export function ImageUpload({ itemId, photos, onPhotosChanged }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, and WebP images are supported.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const path = await api.uploadPhoto(itemId, file);
      await api.create<ItemPhoto>('itemphoto', {
        dk_itemid: itemId,
        storage_path: path,
        is_primary: photos.length === 0,
        caption: '',
      });
      onPhotosChanged();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleSetPrimary = async (photo: ItemPhoto) => {
    try {
      // Clear all primary flags then set this one
      await Promise.all(
        photos.map(p =>
          api.update<ItemPhoto>('itemphoto', p.id, { is_primary: p.id === photo.id })
        )
      );
      onPhotosChanged();
    } catch (err) {
      setUploadError('Failed to update primary photo');
    }
  };

  const handleDelete = async (photo: ItemPhoto) => {
    try {
      await api.delete('itemphoto', photo.id);
      onPhotosChanged();
    } catch (err) {
      setUploadError('Failed to delete photo');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {isUploading ? (
          <p className="text-sm text-zinc-500 animate-pulse">Uploading...</p>
        ) : (
          <>
            <Upload size={24} className="mx-auto text-zinc-400 mb-2" />
            <p className="text-sm font-medium text-zinc-700">Drop a photo or click to browse</p>
            <p className="text-xs text-zinc-400 mt-1">JPEG, PNG, WebP · Max {MAX_SIZE_MB}MB</p>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
      )}

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-200">
              <img
                src={api.getPhotoUrl(photo.storage_path)}
                alt={photo.caption || 'Item photo'}
                className="w-full h-full object-cover"
              />
              {/* Primary badge */}
              {photo.is_primary && (
                <div className="absolute top-1 left-1 bg-amber-400 text-white rounded-full p-0.5">
                  <Star size={10} fill="white" />
                </div>
              )}
              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.is_primary && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetPrimary(photo); }}
                    className="p-1.5 bg-amber-400 rounded-full text-white"
                    title="Set as primary"
                  >
                    <Star size={12} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                  className="p-1.5 bg-red-500 rounded-full text-white"
                  title="Delete photo"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !isUploading && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <ImageIcon size={16} />
          <span>No reference photos yet</span>
        </div>
      )}
    </div>
  );
}
