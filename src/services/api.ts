import { TableName } from '../types';

const BASE_URL = 'https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage';
const API_KEY = (import.meta as any).env.VITE_SUPABASE_API_KEY || (process.env as any).VITE_SUPABASE_API_KEY;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'apikey': API_KEY,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET';
  
  console.debug('[API]', method, url, {
    body: options.body ? JSON.parse(options.body as string) : undefined,
    headers: {
      'apikey': API_KEY ? '***REDACTED***' : 'MISSING',
      'Content-Type': 'application/json',
    },
  });

  try {
    const response = await fetch(url, { ...options, headers });
    
    console.debug('[API Response]', method, url, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorBody || errorMessage;
      }
      console.error('[API Error]', method, url, errorMessage, errorBody);
      throw new Error(errorMessage);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.debug('[API] No content in response (204 or empty)');
      return {} as T;
    }

    const data = await response.json();
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
  list: <T>(table: TableName, query?: Record<string, string>) => {
    const queryString = query ? '?' + new URLSearchParams(query).toString() : '';
    return request<T[]>(`/${table}${queryString}`);
  },
  
  get: <T>(table: TableName, id: number) => {
    return request<T>(`/${table}/${id}`);
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
  }
};
