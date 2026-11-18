import { LanguageProvider, useLanguage, OrderStatus, SignInDialog, LanguageSwitch } from '@klink/ui';
import '@klink/ui/styles.css';
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context';
import { DistrictProvider } from './lib/district-context';
import { CartProvider } from './lib/cart-context';
import { getAppMode } from './lib/api';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { CartDrawer } from './components/CartDrawer';
import { CustomerMarketplace } from './views/CustomerMarketplace';
import { SupplierPortal } from './views/SupplierPortal';
import { AdminPortal } from './views/AdminPortal';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { AuthModal } from './components/AuthModal';
import { useNavigationHistory } from './lib/useNavigationHistory';
import { CheckCircle2 } from 'lucide-react';

export function AppContent() {
  const { t } = useLanguage();
  const { user, switchPersona, isDemoMode } = useAuth();
  const { navState, updateNav } = useNavigationHistory();
  const appMode = getAppMode();

  const {
    tab: navTab,
    customerSubTab,
    supplierSubTab,
    adminSubTab,
    isCartOpen,
    yardId,
    compareId
  } = navState;

  // Enforce strict role/portal isolation when running in a dedicated app mode
  const currentTab: 'customer' | 'supplier' | 'admin' =
    appMode === 'CUSTOMER'
      ? 'customer'
      : appMode === 'SUPPLIER'
      ? 'supplier'
      : appMode === 'ADMIN'
      ? 'admin'
      : !isDemoMode && user
      ? user.role === 'SUPPLIER' ? 'supplier' : user.role === 'ADMIN' ? 'admin' : 'customer'
      : navTab;

  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  const setCurrentTab = (tab: 'customer' | 'supplier' | 'admin') => {
    if (appMode !== 'UNIFIED') return;
    updateNav({ tab, yardId: null, compareId: null });
  };

  const setCustomerSubTab = (subtab: 'shop' | 'orders') => {
    updateNav({ customerSubTab: subtab, yardId: null, compareId: null });
  };

  const setSupplierSubTab = (subtab: any) => {
    updateNav({ supplierSubTab: subtab });
  };

  const setAdminSubTab = (subtab: any) => {
    updateNav({ adminSubTab: subtab });
  };

  const setIsCartOpen = (isOpen: boolean) => {
    updateNav({ isCartOpen: isOpen });
  };

  const setYardId = (id: string | null) => {
    updateNav({ yardId: id });
  };

  const setCompareId = (id: string | null) => {
    updateNav({ compareId: id });
  };

  // Synchronize persona with tab selection ONLY in Demo Mode
  useEffect(() => {
    if (isDemoMode) {
      if (currentTab === 'supplier' && user?.role !== 'SUPPLIER') {
        switchPersona('SUPPLIER', 0);
      } else if (currentTab === 'admin' && user?.role !== 'ADMIN') {
        switchPersona('ADMIN');
      } else if (currentTab === 'customer' && user?.role !== 'CUSTOMER') {
        switchPersona('CUSTOMER');
      }
    }
  }, [currentTab, user?.role, isDemoMode]);

  const handleOrderSuccess = (order: any) => {
    setSuccessOrder(order);
    updateNav({
      tab: 'customer',
      customerSubTab: 'orders',
      isCartOpen: false,
      yardId: null,
      compareId: null
    });
  };

  return (
    <div className="klink-shell min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full">
        {currentTab === 'customer' && (
          <CustomerMarketplace
            subTab={customerSubTab}
            setSubTab={setCustomerSubTab}
            onOpenCart={() => setIsCartOpen(true)}
            yardId={yardId}
            onSelectYard={setYardId}
            compareId={compareId}
            onSelectCompare={setCompareId}
          />
        )}

        {currentTab === 'supplier' && (
          <SupplierPortal
            subTab={supplierSubTab}
            setSubTab={setSupplierSubTab}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPortal
            subTab={adminSubTab}
            setSubTab={setAdminSubTab}
          />
        )}
      </main>

      {/* Slide-over Cart Drawer (Customer Marketplace only) */}
      {currentTab === 'customer' && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        customerSubTab={customerSubTab}
        setCustomerSubTab={setCustomerSubTab}
        supplierSubTab={supplierSubTab}
        setSupplierSubTab={setSupplierSubTab}
        adminSubTab={adminSubTab}
        setAdminSubTab={setAdminSubTab}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Customer Authentication Modal */}
      {currentTab === 'customer' && <AuthModal />}

      {/* Force Password Change Modal for 1st-time Logins */}
      <ForcePasswordChangeModal />

      {/* Order Success Toast / Modal */}
      {successOrder && (
        <SignInDialog titleId="order-confirmation-title" onDismiss={() => setSuccessOrder(null)}>
          <div className="space-y-3 text-stone-900">
            <CheckCircle2 className="size-7 text-emerald-700" aria-hidden="true" />
            <h2 id="order-confirmation-title" className="text-xl font-semibold">
              {t('Order placed')} · {successOrder.orderNumber}
            </h2>
            <p className="text-sm font-semibold"><OrderStatus status={successOrder.status} /></p>
            <p className="text-sm">
              {t(successOrder.status === 'PENDING_APPROVAL' ? 'The supplier will confirm your order. Follow it under My orders.' : 'Track real-time tractor dispatch and site material drops')}
            </p>
            <p className="flex flex-wrap justify-between gap-2 border-y border-stone-200 py-3 font-semibold">
              <span>{t('Amount due')}</span>
              <span>₹{Number(successOrder.balancePending ?? successOrder.finalTotal).toLocaleString('en-IN')}</span>
            </p>
            <p className="text-sm">{t('No payment was collected at checkout.')}</p>
            <LanguageSwitch />
            <button type="button" className="klink-primary w-full" onClick={() => setSuccessOrder(null)}>
              {t('Track order')}
            </button>
          </div>
        </SignInDialog>
      )}
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DistrictProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </DistrictProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
