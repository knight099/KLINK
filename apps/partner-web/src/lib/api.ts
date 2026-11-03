/// <reference types="vite/client" />

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000/api/v1' : '/api/v1');

export type AppMode = 'UNIFIED' | 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';

export function getAppMode(): AppMode {
  return 'SUPPLIER';
}

export function getTokenStorageKey(): string {
  return import.meta.env.VITE_TOKEN_STORAGE_KEY || 'klink_partner_token';
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
