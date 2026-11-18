import { LanguageProvider, useLanguage, OrderStatus, SignInDialog, LanguageSwitch } from '@klink/ui';
import '@klink/ui/styles.css';
import React, { useState } from 'react';
import { AuthProvider } from './lib/auth-context';
import { DistrictProvider } from './lib/district-context';
import { CartProvider } from './lib/cart-context';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { CartDrawer } from './components/CartDrawer';
import { CustomerMarketplace } from './views/CustomerMarketplace';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { AuthModal } from './components/AuthModal';
import { useNavigationHistory } from './lib/useNavigationHistory';
import { CheckCircle2 } from 'lucide-react';

export function AppContent() {
  const { t } = useLanguage();
  const { navState, updateNav } = useNavigationHistory();
  const { customerSubTab, isCartOpen, yardId, compareId } = navState;
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  const setCustomerSubTab = (subtab: 'shop' | 'orders') => {
    updateNav({ customerSubTab: subtab, yardId: null, compareId: null });
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
      <Navbar
        currentTab="customer"
        setCurrentTab={() => {}}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 w-full">
        <CustomerMarketplace
          subTab={customerSubTab}
          setSubTab={setCustomerSubTab}
          onOpenCart={() => setIsCartOpen(true)}
          yardId={yardId}
          onSelectYard={setYardId}
          compareId={compareId}
          onSelectCompare={setCompareId}
        />
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <BottomNav
        currentTab="customer"
        setCurrentTab={() => {}}
        customerSubTab={customerSubTab}
        setCustomerSubTab={setCustomerSubTab}
        supplierSubTab="dashboard"
        setSupplierSubTab={() => {}}
        adminSubTab="overview"
        setAdminSubTab={() => {}}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <AuthModal />
      <ForcePasswordChangeModal />

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
