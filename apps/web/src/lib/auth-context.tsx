import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getAppMode, getTokenStorageKey } from './api';

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

export interface OnboardSupplierData {
  phone: string;
  password: string;
  businessName: string;
  ownerName: string;
  districtId: string;
  address: string;
  gstin?: string;
  logoUrl?: string;
  description?: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'LOGIN' | 'REGISTER';
  setAuthModalMode: (mode: 'LOGIN' | 'REGISTER') => void;
  login: (phone: string, password: string, expectedRole?: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN') => Promise<void>;
  registerCustomer: (data: RegisterCustomerData) => Promise<void>;
  onboardSupplier: (data: OnboardSupplierData) => Promise<{ message: string; supplierId: string }>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tokenKey = getTokenStorageKey();
  const appMode = getAppMode();
  const requiredRole = appMode === 'UNIFIED' ? undefined : appMode;

  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenKey));
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await apiFetch<{ user: UserSession }>('/auth/me');
          if (requiredRole && res.user.role !== requiredRole) {
            localStorage.removeItem(tokenKey);
            setToken(null);
            setUser(null);
          } else {
            setUser(res.user);
          }
        } catch (e) {
          console.warn('Session expired or invalid token:', e);
          localStorage.removeItem(tokenKey);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (
    phone: string,
    password: string,
    expectedRole?: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN'
  ) => {
    setIsLoading(true);
    try {
      const roleToCheck = expectedRole || requiredRole;
      const res = await apiFetch<{ token: string; user: UserSession }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          password,
          ...(roleToCheck ? { role: roleToCheck } : {})
        })
      });
      localStorage.setItem(tokenKey, res.token);
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
      localStorage.setItem(tokenKey, res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onboardSupplier = async (data: OnboardSupplierData) => {
    return apiFetch<{ message: string; supplierId: string }>('/auth/onboard-supplier', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  const changePassword = async (newPassword: string) => {
    const res = await apiFetch<{ token: string; user: UserSession }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
    localStorage.setItem(tokenKey, res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        login,
        registerCustomer,
        onboardSupplier,
        logout,
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
