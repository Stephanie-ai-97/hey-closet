/**
 * AI Clothing Scan Service
 * 
 * Handles image upload, optimization, AI analysis, and result validation.
 * Implements:
 * - Client-side rate limiting
 * - Automatic retries with exponential backoff
 * - Comprehensive error handling with fallbacks
 * - Response validation using Zod schemas
 * - Image compression and optimization
 * - Progress tracking for long operations
 */

import { api } from './api';
import {
  aiClothingMetadataSchema,
  type AiClothingMetadata,
  validateAiResponse,
  isValidMetadata,
  determineQualityIssues,
} from '../lib/aiValidation';

// Re-export for backward compatibility
export type { AiClothingMetadata } from '../lib/aiValidation';

export interface OptimizedClothingImage {
  file: File;
  dataUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  backgroundRemovalStatus: 'not-requested' | 'applied' | 'skipped';
}

export interface ScanProgress {
  status: 'idle' | 'optimizing' | 'analyzing' | 'validating' | 'success' | 'error';
  progress: number; // 0-100
  message: string;
  retryCount: number;
  lastError?: string;
}

export interface ScanResult {
  success: boolean;
  metadata?: AiClothingMetadata;
  error?: string;
  fallbackMode: boolean; // true if manual entry recommended
  retryable: boolean;
  warnings: string[];
}

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_SCAN_SIZE = 1_600; // Max dimension in pixels
const JPEG_QUALITY = 0.82;
const CLIENT_SCAN_WINDOW_MS = 60_000; // 1 minute
const CLIENT_SCAN_LIMIT = 6;
const CLIENT_RATE_KEY = 'hey-closet-ai-scan-rate';

// Retry configuration for exponential backoff
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 10_000,
  backoffMultiplier: 2,
};

// Errors that are retryable vs permanent
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const PERMANENT_ERROR_CODES = new Set([400, 401, 403, 404, 422]);

// ============================================================
// RATE LIMITING
// ============================================================

interface RateBucket {
  count: number;
  resetAt: number;
}

function getRateBucket(): RateBucket {
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

function setRateBucket(bucket: RateBucket): void {
  window.localStorage.setItem(CLIENT_RATE_KEY, JSON.stringify(bucket));
}

/**
 * Assert that client is within rate limits
 * Throws if rate limit exceeded
 */
function assertClientScanRateLimit(): void {
  const now = Date.now();
  const current = getRateBucket();

  if (current.resetAt <= now) {
    setRateBucket({ count: 1, resetAt: now + CLIENT_SCAN_WINDOW_MS });
    return;
  }

  if (current.count >= CLIENT_SCAN_LIMIT) {
    const secondsRemaining = Math.ceil((current.resetAt - now) / 1_000);
    throw new Error(
      `Too many AI scans in a short time. Please wait ${secondsRemaining} seconds before trying again.`
    );
  }

  setRateBucket({ ...current, count: current.count + 1 });
}

/**
 * Get remaining time until rate limit resets (in seconds)
 */
export function getRateLimitResetTime(): number {
  const current = getRateBucket();
  const remaining = Math.max(0, current.resetAt - Date.now());
  return Math.ceil(remaining / 1_000);
}

// ============================================================
// IMAGE PROCESSING
// ============================================================

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
      reject(new Error('Could not load the selected image. Please ensure it is a valid image file.'));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Image optimization failed. Please try a different image.'));
        }
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

/**
 * Optimize clothing image for AI analysis
 * - Resize to max dimension
 * - Convert to JPEG
 * - Optionally apply white background
 * 
 * @param file Original image file
 * @param backgroundRemoval Whether to apply white background
 * @returns Optimized image data
 */
export async function optimizeClothingImage(
  file: File,
  backgroundRemoval: boolean
): Promise<OptimizedClothingImage> {
  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are supported.');
  }

  // Validate file size (before optimization)
  const MAX_FILE_SIZE_MB = 50;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
  }

  // Load and measure image
  const image = await loadImage(file);

  // Calculate scaling to fit within MAX_SCAN_SIZE
  const scale = Math.min(1, MAX_SCAN_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  // Create canvas and draw image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context is not available. Your browser may not support image processing.');
  }

  // Optionally apply white background for background removal
  if (backgroundRemoval) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }

  // Draw image onto canvas
  context.drawImage(image, 0, 0, width, height);

  // Convert canvas to blob and create optimized file
  const blob = await canvasToBlob(canvas);
  const optimizedName = file.name.replace(/\.[^.]+$/, '') + '-optimized.jpg';
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

// ============================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================

function calculateDelay(attemptNumber: number): number {
  // Calculate: baseDelayMs * (backoffMultiplier ^ attemptNumber)
  const exponentialDelay =
    RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attemptNumber);
  // Cap at maxDelayMs and add small random jitter (0-100ms)
  return Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs) + Math.random() * 100;
}

function shouldRetry(error: unknown, attemptNumber: number): boolean {
  // Don't retry if max attempts reached
  if (attemptNumber >= RETRY_CONFIG.maxAttempts) {
    return false;
  }

  // Don't retry permanent errors
  if (error instanceof Error) {
    const statusMatch = error.message.match(/status[:\s]+(\d+)/i);
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10);
      if (PERMANENT_ERROR_CODES.has(status)) {
        return false;
      }
    }
  }

  return true;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Analyze clothing image with retry logic
 * 
 * @param image Optimized image data
 * @param backgroundRemoval Whether background removal was applied
 * @param onProgress Callback for progress updates
 * @returns Validated AI metadata or error
 */
export async function analyzeClothingImageWithRetry(
  image: OptimizedClothingImage,
  backgroundRemoval: boolean,
  onProgress?: (progress: ScanProgress) => void
): Promise<ScanResult> {
  const reportProgress = (status: ScanProgress['status'], message: string, retryCount = 0) => {
    const progress = status === 'success' ? 100 : status === 'analyzing' ? 50 : 25;
    onProgress?.({ status, progress, message, retryCount });
  };

  // Check rate limit first
  try {
    reportProgress('idle', 'Checking rate limits...');
    assertClientScanRateLimit();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Rate limit exceeded';
    return {
      success: false,
      error: msg,
      fallbackMode: true,
      retryable: true,
      warnings: [],
    };
  }

  // Attempt analysis with retries
  for (let attemptNumber = 0; attemptNumber < RETRY_CONFIG.maxAttempts; attemptNumber++) {
    try {
      reportProgress('analyzing', `Analyzing clothing with AI${attemptNumber > 0 ? ` (attempt ${attemptNumber + 1})` : ''}...`, attemptNumber);

      const response = await api.analyzeClothingImage({
        imageDataUrl: image.dataUrl,
        mimeType: 'image/jpeg',
        backgroundRemoval,
      });

      // Validate response
      reportProgress('validating', 'Validating AI response...');
      const validated = validateAiResponse(response);

      if (!isValidMetadata(validated)) {
        // Fallback response (error)
        return {
          success: false,
          error: validated.error,
          fallbackMode: true,
          retryable: 'fallback' in validated ? validated.fallback === 'manual-entry' : false,
          warnings: [],
        };
      }

      // Success!
      const qualityIssues = determineQualityIssues(validated);
      reportProgress('success', 'AI analysis complete!');

      return {
        success: true,
        metadata: validated,
        fallbackMode: false,
        retryable: false,
        warnings: qualityIssues,
      };
    } catch (error) {
      // Check if we should retry
      if (!shouldRetry(error, attemptNumber)) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error during analysis';
        return {
          success: false,
          error: errorMsg,
          fallbackMode: true,
          retryable: false,
          warnings: [],
        };
      }

      // Wait before retrying
      if (attemptNumber < RETRY_CONFIG.maxAttempts - 1) {
        const waitMs = calculateDelay(attemptNumber);
        await delay(waitMs);
      }
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: 'AI analysis failed after multiple attempts. Please try again or enter details manually.',
    fallbackMode: true,
    retryable: true,
    warnings: [],
  };
}

/**
 * Simple wrapper for backward compatibility
 * @deprecated Use analyzeClothingImageWithRetry instead
 */
export async function analyzeClothingImage(
  image: OptimizedClothingImage,
  backgroundRemoval: boolean
): Promise<AiClothingMetadata> {
  const result = await analyzeClothingImageWithRetry(image, backgroundRemoval);
  if (!result.success || !result.metadata) {
    throw new Error(result.error || 'AI analysis failed');
  }
  return result.metadata;
}
