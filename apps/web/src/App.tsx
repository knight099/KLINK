import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context';
import { DistrictProvider } from './lib/district-context';
import { CartProvider } from './lib/cart-context';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { CartDrawer } from './components/CartDrawer';
import { CustomerMarketplace } from './views/CustomerMarketplace';
import { SupplierPortal } from './views/SupplierPortal';
import { AdminPortal } from './views/AdminPortal';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { AuthModal } from './components/AuthModal';
import { useNavigationHistory } from './lib/useNavigationHistory';
import { CheckCircle2, X } from 'lucide-react';

export function AppContent() {
  const { user, switchPersona, isDemoMode } = useAuth();
  const { navState, updateNav } = useNavigationHistory();
  const {
    tab: currentTab,
    customerSubTab,
    supplierSubTab,
    adminSubTab,
    isCartOpen,
    yardId,
    compareId
  } = navState;

  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  const setCurrentTab = (tab: 'customer' | 'supplier' | 'admin') => {
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
    updateNav({ tab: 'customer', customerSubTab: 'orders', isCartOpen: false, yardId: null, compareId: null });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900">
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

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

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

      {/* Global B2B Authentication Modal */}
      <AuthModal />

      {/* Force Password Change Modal for 1st-time Supplier Logins */}
      <ForcePasswordChangeModal />

      {/* Order Success Toast / Modal */}
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

