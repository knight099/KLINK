import React from 'react';
import { AuthProvider } from './lib/auth-context';
import { DistrictProvider } from './lib/district-context';
import { CartProvider } from './lib/cart-context';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SupplierPortal } from './views/SupplierPortal';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { useNavigationHistory } from './lib/useNavigationHistory';

export function AppContent() {
  const { navState, updateNav } = useNavigationHistory();
  const { supplierSubTab } = navState;

  const setSupplierSubTab = (subtab: any) => {
    updateNav({ supplierSubTab: subtab });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900">
      <Navbar
        currentTab="supplier"
        setCurrentTab={() => {}}
        onOpenCart={() => {}}
      />

      <main className="flex-1 w-full">
        <SupplierPortal
          subTab={supplierSubTab}
          setSubTab={setSupplierSubTab}
        />
      </main>

      <BottomNav
        currentTab="supplier"
        setCurrentTab={() => {}}
        customerSubTab="shop"
        setCustomerSubTab={() => {}}
        supplierSubTab={supplierSubTab}
        setSupplierSubTab={setSupplierSubTab}
        adminSubTab="overview"
        setAdminSubTab={() => {}}
        onOpenCart={() => {}}
      />

      <ForcePasswordChangeModal />
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
