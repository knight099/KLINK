import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from './api';

export interface UserSession {
  id: string;
  phone: string;
  role: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';
  name: string;
  supplierId?: string;
  customerId?: string;
  mustChangePassword?: boolean;
}

interface RegisterCustomerData {
  phone: string;
  password: string;
  fullName: string;
  districtId: string;
  addressLine?: string;
  landmark?: string;
  pincode?: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'LOGIN' | 'REGISTER';
  setAuthModalMode: (mode: 'LOGIN' | 'REGISTER') => void;
  login: (phone: string, password?: string) => Promise<void>;
  registerCustomer: (data: RegisterCustomerData) => Promise<void>;
  logout: () => void;
  switchPersona: (role: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN', indexOrPhone?: number | string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('klink_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Demo mode: Check localStorage override or VITE_DEMO_MODE env var
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    const stored = localStorage.getItem('klink_demo_mode');
    if (stored !== null) return stored === 'true';
    if (import.meta.env.VITE_DEMO_MODE !== undefined) {
      return import.meta.env.VITE_DEMO_MODE === 'true';
    }
    return import.meta.env.DEV;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  const setDemoMode = (enabled: boolean) => {
    setIsDemoModeState(enabled);
    localStorage.setItem('klink_demo_mode', String(enabled));
  };

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await apiFetch<{ user: UserSession }>('/auth/me');
          setUser(res.user);
        } catch (e) {
          console.warn('Session expired or invalid token:', e);
          localStorage.removeItem('klink_token');
          setToken(null);
          setUser(null);
          if (isDemoMode) {
            try {
              await login('9123456789', 'customer123');
            } catch {}
          }
        }
      } else {
        // If demo mode is active, auto-seed with default customer so all marketplace data is immediately visible
        if (isDemoMode) {
          try {
            await login('9123456789', 'customer123');
          } catch {}
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token, isDemoMode]);

  const login = async (phone: string, password = 'customer123') => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: UserSession }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password })
      });
      localStorage.setItem('klink_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const registerCustomer = async (data: RegisterCustomerData) => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: UserSession }>('/auth/register-customer', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localStorage.setItem('klink_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    const res = await apiFetch<{ token: string; user: UserSession }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
    localStorage.setItem('klink_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('klink_token');
    setToken(null);
    setUser(null);
  };

  const switchPersona = async (role: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN', indexOrPhone?: number | string) => {
    if (role === 'CUSTOMER') {
      const phone = typeof indexOrPhone === 'string' ? indexOrPhone : '9123456789';
      await login(phone, 'customer123');
    } else if (role === 'SUPPLIER') {
      const phone = indexOrPhone === 1 ? '9876543211' : indexOrPhone === 2 ? '9876543212' : '9876543210';
      await login(phone, 'supplier123');
    } else if (role === 'ADMIN') {
      await login('9999999999', 'admin123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isDemoMode,
        setDemoMode,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        login,
        registerCustomer,
        logout,
        switchPersona,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
