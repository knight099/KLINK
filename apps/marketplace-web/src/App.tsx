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
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900">
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
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-stone-200 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-900 border border-stone-200 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-stone-900">
                Order <span className="font-mono">{successOrder.orderNumber}</span> Booked!
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Transmitted to <strong>{successOrder.supplier?.businessName || 'the dealer yard'}</strong> for dispatch. Tractor delivery details can be tracked in your site orders tab.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setSuccessOrder(null)}
                className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
              >
                Track Site Delivery Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DistrictProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </DistrictProvider>
    </AuthProvider>
  );
}

export default App;
