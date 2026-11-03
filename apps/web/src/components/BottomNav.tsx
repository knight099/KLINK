import React from 'react';
import {
  Home,
  Layers,
  Store,
  ClipboardList,
  Shield,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  KeyRound,
  Package,
  CreditCard,
  Settings
} from 'lucide-react';
import { useCart } from '../lib/cart-context';
import { useAuth } from '../lib/auth-context';
import { getAppMode } from '../lib/api';
import { AdminSubTab, CustomerSubTab, SupplierSubTab, PortalTab } from '../lib/useNavigationHistory';

interface BottomNavProps {
  currentTab: PortalTab;
  setCurrentTab: (tab: PortalTab) => void;
  customerSubTab: CustomerSubTab;
  setCustomerSubTab: (sub: CustomerSubTab) => void;
  supplierSubTab: SupplierSubTab;
  setSupplierSubTab: (sub: SupplierSubTab) => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (sub: AdminSubTab) => void;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  customerSubTab,
  setCustomerSubTab,
  supplierSubTab,
  setSupplierSubTab,
  adminSubTab,
  setAdminSubTab,
  onOpenCart
}) => {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const appMode = getAppMode();

  const activeExperience: PortalTab =
    appMode === 'CUSTOMER'
      ? 'customer'
      : appMode === 'SUPPLIER'
      ? 'supplier'
      : appMode === 'ADMIN'
      ? 'admin'
      : currentTab;

  // Hide bottom nav on Supplier/Admin login screens when unauthenticated
  if (activeExperience === 'supplier' && (!user || user.role !== 'SUPPLIER')) return null;
  if (activeExperience === 'admin' && (!user || user.role !== 'ADMIN')) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141413]/95 backdrop-blur-lg border-t border-stone-800 text-stone-400 safe-bottom shadow-2xl">
      <div className="flex items-center justify-around py-2 px-1">
        {/* Customer Marketplace Experience */}
        {activeExperience === 'customer' && (
          <>
            <button
              onClick={() => setCustomerSubTab('shop')}
              className={`flex flex-col items-center py-1 px-4 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                customerSubTab === 'shop' ? 'text-stone-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Home className="w-4 h-4 mb-0.5" />
              <span>Catalog</span>
            </button>

            <button
              onClick={onOpenCart}
              className="relative flex flex-col items-center py-1 px-4 rounded-xl text-[11px] font-semibold text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 mb-0.5" />
              <span>Requisition</span>
              {itemCount > 0 && (
                <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-amber-500 text-stone-950 text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCustomerSubTab('orders')}
              className={`flex flex-col items-center py-1 px-4 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                customerSubTab === 'orders' ? 'text-stone-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ClipboardList className="w-4 h-4 mb-0.5" />
              <span>Site Orders</span>
            </button>
          </>
        )}

        {/* Supplier Partner (Yard OS) Experience */}
        {activeExperience === 'supplier' && (
          <>
            <button
              onClick={() => setSupplierSubTab('dashboard')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                supplierSubTab === 'dashboard'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 mb-0.5" />
              <span>Today</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('orders')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                supplierSubTab === 'orders'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ClipboardList className="w-4 h-4 mb-0.5" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('deliveries')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                supplierSubTab === 'deliveries'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Truck className="w-4 h-4 mb-0.5" />
              <span>Dispatches</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('inventory')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                supplierSubTab === 'inventory'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-4 h-4 mb-0.5" />
              <span>Pricing</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('ledger')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                supplierSubTab === 'ledger'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Store className="w-4 h-4 mb-0.5" />
              <span>Udhaar</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('profile')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                supplierSubTab === 'profile'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Settings className="w-4 h-4 mb-0.5" />
              <span>Profile</span>
            </button>
          </>
        )}

        {/* Admin Control Tower Experience */}
        {activeExperience === 'admin' && (
          <>
            <button
              onClick={() => setAdminSubTab('overview')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                adminSubTab === 'overview'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Shield className="w-4 h-4 mb-0.5" />
              <span>GMV</span>
            </button>

            <button
              onClick={() => setAdminSubTab('orders')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                adminSubTab === 'orders'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Package className="w-4 h-4 mb-0.5" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setAdminSubTab('suppliers')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                adminSubTab === 'suppliers'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Store className="w-4 h-4 mb-0.5" />
              <span>Yards</span>
            </button>

            <button
              onClick={() => setAdminSubTab('consumers')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                adminSubTab === 'consumers'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className="w-4 h-4 mb-0.5" />
              <span>Buyers</span>
            </button>

            <button
              onClick={() => setAdminSubTab('payments')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                adminSubTab === 'payments'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <CreditCard className="w-4 h-4 mb-0.5" />
              <span>Audit</span>
            </button>

            <button
              onClick={() => setAdminSubTab('users')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                adminSubTab === 'users'
                  ? 'text-stone-100 font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <KeyRound className="w-4 h-4 mb-0.5" />
              <span>Logins</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
