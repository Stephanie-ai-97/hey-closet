import { api } from './api';

export interface AiClothingMetadata {
  category: string;
  subcategory: string;
  primaryColor: string;
  secondaryColor: string | null;
  material: string;
  season: string;
  style: string;
  occasion: string;
  fit: string;
  warmthLevel: string;
  confidenceScore: number;
  generatedTags: string[];
  notes: string;
  warnings: string[];
}

export interface OptimizedClothingImage {
  file: File;
  dataUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  backgroundRemovalStatus: 'not-requested' | 'applied' | 'skipped';
}

const MAX_SCAN_SIZE = 1_600;
const JPEG_QUALITY = 0.82;
const CLIENT_SCAN_WINDOW_MS = 60_000;
const CLIENT_SCAN_LIMIT = 6;
const CLIENT_RATE_KEY = 'hey-closet-ai-scan-rate';

function getRateBucket(): { count: number; resetAt: number } {
  const raw = window.localStorage.getItem(CLIENT_RATE_KEY);
  if (!raw) return { count: 0, resetAt: 0 };

  try {
    const parsed = JSON.parse(raw) as { count?: unknown; resetAt?: unknown };
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      resetAt: typeof parsed.resetAt === 'number' ? parsed.resetAt : 0,
    };
  } catch {
    return { count: 0, resetAt: 0 };
  }
}

export function assertClientScanRateLimit() {
  const now = Date.now();
  const current = getRateBucket();

  if (current.resetAt <= now) {
    window.localStorage.setItem(CLIENT_RATE_KEY, JSON.stringify({ count: 1, resetAt: now + CLIENT_SCAN_WINDOW_MS }));
    return;
  }

  if (current.count >= CLIENT_SCAN_LIMIT) {
    throw new Error('Too many AI scans in a short time. Please wait a minute before trying again.');
  }

  window.localStorage.setItem(
    CLIENT_RATE_KEY,
    JSON.stringify({ count: current.count + 1, resetAt: current.resetAt })
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image.'));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Image optimization failed.'));
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

export async function optimizeClothingImage(
  file: File,
  backgroundRemoval: boolean
): Promise<OptimizedClothingImage> {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_SCAN_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image optimization is not supported in this browser.');

  if (backgroundRemoval) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas);
  const optimizedName = file.name.replace(/\.[^.]+$/, '') + '-processed.jpg';
  const optimizedFile = new File([blob], optimizedName, { type: 'image/jpeg' });
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

  return {
    file: optimizedFile,
    dataUrl,
    previewUrl: URL.createObjectURL(optimizedFile),
    width,
    height,
    backgroundRemovalStatus: backgroundRemoval ? 'applied' : 'not-requested',
  };
}

export async function analyzeClothingImage(
  image: OptimizedClothingImage,
  backgroundRemoval: boolean
): Promise<AiClothingMetadata> {
  assertClientScanRateLimit();
  return api.analyzeClothingImage({
    imageDataUrl: image.dataUrl,
    mimeType: 'image/jpeg',
    backgroundRemoval,
  });
}
