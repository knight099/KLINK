/// <reference types="vite/client" />

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000/api/v1' : '/api/v1');

export type AppMode = 'UNIFIED' | 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';

export function getAppMode(): AppMode {
  return 'ADMIN';
}

export function getTokenStorageKey(): string {
  return import.meta.env.VITE_TOKEN_STORAGE_KEY || 'klink_admin_token';
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

  // Retain a logical operation key across a lost response and a page reload.
  // Only a confirmed response ends the attempt; an identical new receipt after
  // success gets a new key. Different signed-in sessions cannot share attempts.
  let attemptStorageKey: string | undefined;
  const financialWrite = options.method === 'POST' &&
    (endpoint.endsWith('/payments') || endpoint === '/supplier/ledger/settle' ||
     endpoint === '/supplier/payments/manual' || endpoint === '/supplier/orders/manual');
  if (financialWrite && !headers['Idempotency-Key']) {
    const signature = new TextEncoder().encode(`${token || ''}:${endpoint}:${options.body || ''}`);
    const digest = await crypto.subtle.digest('SHA-256', signature);
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    attemptStorageKey = `${getTokenStorageKey()}:pending:${hash}`;
    const key = sessionStorage.getItem(attemptStorageKey) || crypto.randomUUID();
    sessionStorage.setItem(attemptStorageKey, key);
    headers['Idempotency-Key'] = key;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (attemptStorageKey && response.status >= 400 && response.status < 500) sessionStorage.removeItem(attemptStorageKey);
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API Error: ${response.status}`);
  }

  const result = await response.json();
  if (attemptStorageKey) sessionStorage.removeItem(attemptStorageKey);
  return result;
}
