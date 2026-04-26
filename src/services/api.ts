import { TableName } from '../types';

const BASE_URL = '/api/storage';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorBody || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    return response.json();
  } catch (err) {
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
