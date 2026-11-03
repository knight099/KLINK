import React from 'react';
import { AuthProvider } from './lib/auth-context';
import { DistrictProvider } from './lib/district-context';
import { CartProvider } from './lib/cart-context';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AdminPortal } from './views/AdminPortal';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { useNavigationHistory } from './lib/useNavigationHistory';

export function AppContent() {
  const { navState, updateNav } = useNavigationHistory();
  const { adminSubTab } = navState;

  const setAdminSubTab = (subtab: any) => {
    updateNav({ adminSubTab: subtab });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900">
      <Navbar
        currentTab="admin"
        setCurrentTab={() => {}}
        onOpenCart={() => {}}
      />

      <main className="flex-1 w-full">
        <AdminPortal
          subTab={adminSubTab}
          setSubTab={setAdminSubTab}
        />
      </main>

      <BottomNav
        currentTab="admin"
        setCurrentTab={() => {}}
        customerSubTab="shop"
        setCustomerSubTab={() => {}}
        supplierSubTab="dashboard"
        setSupplierSubTab={() => {}}
        adminSubTab={adminSubTab}
        setAdminSubTab={setAdminSubTab}
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
