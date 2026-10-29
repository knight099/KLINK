import { useState, useEffect, useCallback, useRef } from 'react';

export type PortalTab = 'customer' | 'supplier' | 'admin';
export type CustomerSubTab = 'shop' | 'orders';
export type SupplierSubTab = 'dashboard' | 'inventory' | 'orders' | 'deliveries' | 'ledger' | 'profile';
export type AdminSubTab = 'overview' | 'suppliers' | 'consumers' | 'orders' | 'users' | 'catalog';

export interface NavigationState {
  tab: PortalTab;
  customerSubTab: CustomerSubTab;
  supplierSubTab: SupplierSubTab;
  adminSubTab: AdminSubTab;
  isCartOpen: boolean;
  yardId: string | null;
  compareId: string | null;
}

export function parseUrlToState(): NavigationState {
  const params = new URLSearchParams(window.location.search);
  const tab = (params.get('tab') as PortalTab) || 'customer';

  const validTabs: PortalTab[] = ['customer', 'supplier', 'admin'];
  const safeTab: PortalTab = validTabs.includes(tab) ? tab : 'customer';

  const subtab = params.get('subtab');
  const cart = params.get('cart') === 'open';
  const yardId = params.get('yard');
  const compareId = params.get('compare');

  return {
    tab: safeTab,
    customerSubTab: subtab === 'orders' ? 'orders' : 'shop',
    supplierSubTab: (['dashboard', 'inventory', 'orders', 'deliveries', 'ledger', 'profile'].includes(subtab || '')
      ? subtab
      : 'dashboard') as SupplierSubTab,
    adminSubTab: (['overview', 'suppliers', 'consumers', 'orders', 'users', 'catalog'].includes(subtab || '')
      ? subtab
      : 'overview') as AdminSubTab,
    isCartOpen: cart,
    yardId: yardId || null,
    compareId: compareId || null
  };
}

export function stateToSearchParams(state: NavigationState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.tab !== 'customer') {
    params.set('tab', state.tab);
  }

  const currentSubTab =
    state.tab === 'customer'
      ? state.customerSubTab
      : state.tab === 'supplier'
      ? state.supplierSubTab
      : state.adminSubTab;

  const defaultSubTab = state.tab === 'customer' ? 'shop' : state.tab === 'supplier' ? 'dashboard' : 'overview';
  if (currentSubTab !== defaultSubTab) {
    params.set('subtab', currentSubTab);
  }

  if (state.isCartOpen) {
    params.set('cart', 'open');
  }

  if (state.yardId) {
    params.set('yard', state.yardId);
  }

  if (state.compareId) {
    params.set('compare', state.compareId);
  }

  return params;
}

export function useNavigationHistory() {
  const [navState, setNavState] = useState<NavigationState>(parseUrlToState);
  const isInternalUpdate = useRef(false);

  // Sync state to URL with pushState (or replaceState)
  const updateNav = useCallback((updater: Partial<NavigationState> | ((prev: NavigationState) => NavigationState), replace = false) => {
    setNavState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const search = stateToSearchParams(next).toString();
      const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;

      isInternalUpdate.current = true;
      if (replace) {
        window.history.replaceState(next, '', newUrl);
      } else {
        window.history.pushState(next, '', newUrl);
      }
      return next;
    });
  }, []);

  // Listen to popstate (e.g. Android Hardware Back Button or Browser Back/Forward)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Parse state from URL search params
      const parsed = parseUrlToState();
      setNavState(parsed);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    navState,
    updateNav,
    setNavState
  };
}

