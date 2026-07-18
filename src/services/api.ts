import { TableName } from '../types';
import type { AiClothingMetadata } from './aiClothingScan';

export class ApiError extends Error {
  status?: number;
  retryAfter?: number;

  constructor(message: string, status?: number, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const BASE_URL = 'https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage';
const API_KEY = (import.meta as any).env.VITE_SUPABASE_API_KEY || (process.env as any).VITE_SUPABASE_API_KEY;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to encode file for upload'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to encode file for upload'));
    reader.readAsDataURL(file);
  });
}

const ID_FIELDS = [
  'pk_homelocation',
  'pk_closet',
  'pk_itemid',
  'pk_colourid',
  'pk_material',
  'pk_styleid',
  'pk_infoid',
  'pk_wash',
  'pk_forlocationid',
  'pk_wearlogid',
  'pk_outfitid',
  'pk_outfititemid',
  'pk_itemphotoid',
  'pk_seasonid',
  'pk_occasionid',
  'pk_itemtagid',
  'pk_customtagid',
] as const;

function normalizeIds<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeIds(item)) as T;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const record = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const [key, itemValue] of Object.entries(record)) {
    normalized[key] = normalizeIds(itemValue);
  }

  if (normalized.id === undefined) {
    const pkField = ID_FIELDS.find((field) => normalized[field] !== undefined);
    if (pkField) normalized.id = normalized[pkField];
  }

  return normalized as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'apikey': API_KEY,
    ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}),
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET';
  
  console.debug('[API]', method, url, {
    body: options.body ? JSON.parse(options.body as string) : undefined,
    headers: {
      'apikey': API_KEY ? '***REDACTED***' : 'MISSING',
      'Authorization': API_KEY ? 'Bearer ***REDACTED***' : 'MISSING',
      'Content-Type': 'application/json',
    },
  });

  try {
    const response = await fetch(url, { ...options, headers, mode: 'cors', credentials: 'omit' });
    
    console.debug('[API Response]', method, url, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `API Error: ${response.status}`;
      let retryAfter: number | undefined;

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
        if (typeof errorJson.retryAfter === 'number') {
          retryAfter = errorJson.retryAfter;
        }
      } catch {
        errorMessage = errorBody || errorMessage;
      }

      console.error('[API Error]', method, url, errorMessage, errorBody, { status: response.status, retryAfter });
      throw new ApiError(errorMessage, response.status, retryAfter);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.debug('[API] No content in response (204 or empty)');
      return {} as T;
    }

    const data = normalizeIds(await response.json());
    console.debug('[API] Response data:', data);
    return data;
  } catch (err) {
    console.error('[API] Fetch operation failed:', err);
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Connection failed. This might be a CORS issue or the Supabase service might be unreachable.');
    }
    if (err instanceof Error) throw err;
    throw new Error('An unexpected error occurred during the request.');
  }
}

export const api = {
  list: async <T>(table: TableName, query?: Record<string, string | number | boolean>): Promise<T[]> => {
    const queryParams = query
      ? Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)]))
      : undefined;
    const queryString = queryParams ? '?' + new URLSearchParams(queryParams).toString() : '';
    const result = await request<any>(`/${table}${queryString}`);
    const unwrapped = result?.data ?? result;
    return Array.isArray(unwrapped) ? unwrapped : [];
  },
  
  get: async <T>(table: TableName, id: number): Promise<T> => {
    const result = await request<any>(`/${table}/${id}`);
    // Response may be {data: [item]} or {data: item} or item directly
    if (result?.data !== undefined) {
      return Array.isArray(result.data) ? result.data[0] : result.data;
    }
    return result as T;
  },

  create: <T>(table: TableName, data: Partial<T>) => {
    return request<T>(`/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: <T>(table: TableName, id: number, data: Partial<T>) => {
    return request<T>(`/${table}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: (table: TableName, id: number) => {
    return request(`/${table}/${id}`, {
      method: 'DELETE',
    });
  },

  analyzeClothingImage: async (payload: {
    imageDataUrl: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    backgroundRemoval: boolean;
  }): Promise<AiClothingMetadata> => {
    const result = await request<{ data: AiClothingMetadata }>('/ai/scan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return result.data;
  },

  uploadPhoto: async (itemId: number, file: File): Promise<string> => {
    const fileDataUrl = await fileToDataUrl(file);
    const payload = {
      itemId,
      fileName: file.name,
      fileType: file.type,
      fileDataUrl,
    };

    const result = await request<{ path: string }>('/upload/photo', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return result.path;
  },

  getPhotoUrl: (path: string): string => {
    const SUPABASE_URL = 'https://nuqpcxgonlqlxtujxmhx.supabase.co';
    return `${SUPABASE_URL}/storage/v1/object/public/item-photos/${path}`;
  },
};
