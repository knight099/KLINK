/// <reference types="vite/client" />

// In development, default to local Fastify server; in production (Vercel), use relative '/api/v1'
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000/api/v1' : '/api/v1');

export type AppMode = 'UNIFIED' | 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';

export function getAppMode(): AppMode {
  const envMode = (import.meta.env.VITE_APP_MODE || '').toUpperCase();
  if (envMode === 'CUSTOMER' || envMode === 'SUPPLIER' || envMode === 'ADMIN') {
    return envMode as AppMode;
  }
  return 'UNIFIED';
}

export function getTokenStorageKey(): string {
  if (import.meta.env.VITE_TOKEN_STORAGE_KEY) {
    return import.meta.env.VITE_TOKEN_STORAGE_KEY;
  }
  const mode = getAppMode();
  if (mode === 'CUSTOMER') return 'klink_customer_token';
  if (mode === 'SUPPLIER') return 'klink_partner_token';
  if (mode === 'ADMIN') return 'klink_admin_token';
  return 'klink_token';
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(getTokenStorageKey());

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}
