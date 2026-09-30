export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  // Deprecated: preserved temporarily so older call sites still type-check.
  isEdge?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

async function uploadFile<T>(endpoint: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Upload failed');
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, options: RequestOptions = {}) => request<T>(endpoint, options),
  post: <T>(endpoint: string, body: unknown, options: RequestOptions = {}) => request<T>(endpoint, { method: 'POST', body, ...options }),
  put: <T>(endpoint: string, body: unknown, options: RequestOptions = {}) => request<T>(endpoint, { method: 'PUT', body, ...options }),
  delete: <T>(endpoint: string, options: RequestOptions = {}) => request<T>(endpoint, { method: 'DELETE', ...options }),
  upload: <T>(endpoint: string, file: File) => uploadFile<T>(endpoint, file),
};

export function buildApiUrl(endpoint: string): string {
  return `${API_URL}${endpoint}`;
}
