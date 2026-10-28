import React from 'react';
import { Home, Layers, Store, ClipboardList, Shield, ShoppingBag, HardHat, TrendingUp, Truck, Users, KeyRound, Package } from 'lucide-react';
import { useCart } from '../lib/cart-context';
import { useAuth } from '../lib/auth-context';

interface BottomNavProps {
  currentTab: 'customer' | 'supplier' | 'admin';
  setCurrentTab: (tab: 'customer' | 'supplier' | 'admin') => void;
  customerSubTab: 'shop' | 'orders';
  setCustomerSubTab: (sub: 'shop' | 'orders') => void;
  supplierSubTab: 'dashboard' | 'inventory' | 'orders' | 'deliveries' | 'ledger' | 'profile';
  setSupplierSubTab: (sub: 'dashboard' | 'inventory' | 'orders' | 'deliveries' | 'ledger' | 'profile') => void;
  adminSubTab: 'overview' | 'suppliers' | 'consumers' | 'orders' | 'users' | 'catalog';
  setAdminSubTab: (sub: 'overview' | 'suppliers' | 'consumers' | 'orders' | 'users' | 'catalog') => void;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  customerSubTab,
  setCustomerSubTab,
  supplierSubTab,
  setSupplierSubTab,
  adminSubTab,
  setAdminSubTab,
  onOpenCart
}) => {
  const { itemCount } = useCart();
  const { switchPersona } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-lg border-t border-slate-800 text-slate-400 safe-bottom shadow-2xl">
      <div className="flex items-center justify-around py-2 px-1">
        {/* Customer Experience */}
        {currentTab === 'customer' && (
          <>
            <button
              onClick={() => setCustomerSubTab('shop')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-bold transition-all ${
                customerSubTab === 'shop' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span>Catalog</span>
            </button>

            <button
              onClick={onOpenCart}
              className="relative flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-bold text-slate-400 hover:text-slate-200"
            >
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-md">
                  {itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCustomerSubTab('orders')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl text-[11px] font-bold transition-all ${
                customerSubTab === 'orders' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-5 h-5 mb-0.5" />
              <span>Site Orders</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('supplier');
                switchPersona('SUPPLIER', 0);
              }}
              className="flex flex-col items-center py-1 px-2.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-blue-400"
            >
              <Store className="w-5 h-5 mb-0.5" />
              <span>Shop OS</span>
            </button>
          </>
        )}

        {/* Supplier Tenant Experience */}
        {currentTab === 'supplier' && (
          <>
            <button
              onClick={() => setSupplierSubTab('dashboard')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[11px] font-bold transition-all ${
                supplierSubTab === 'dashboard' ? 'text-blue-400 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-5 h-5 mb-0.5" />
              <span>Today</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('orders')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[11px] font-bold transition-all ${
                supplierSubTab === 'orders' ? 'text-blue-400 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-5 h-5 mb-0.5" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('deliveries')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[11px] font-bold transition-all ${
                supplierSubTab === 'deliveries' ? 'text-blue-400 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-5 h-5 mb-0.5" />
              <span>Dispatches</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('inventory')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[11px] font-bold transition-all ${
                supplierSubTab === 'inventory' ? 'text-blue-400 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-5 h-5 mb-0.5" />
              <span>Pricing</span>
            </button>

            <button
              onClick={() => setSupplierSubTab('ledger')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[11px] font-bold transition-all ${
                supplierSubTab === 'ledger' ? 'text-blue-400 scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store className="w-5 h-5 mb-0.5" />
              <span>Udhaar</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('customer');
                switchPersona('CUSTOMER');
              }}
              className="flex flex-col items-center py-1 px-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-amber-400"
            >
              <HardHat className="w-5 h-5 mb-0.5" />
              <span>Market</span>
            </button>
          </>
        )}

        {/* Admin Experience */}
        {currentTab === 'admin' && (
          <>
            <button
              onClick={() => setAdminSubTab('overview')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
                adminSubTab === 'overview' ? 'text-stone-100 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Shield className="w-4 h-4 mb-0.5" />
              <span>GMV</span>
            </button>

            <button
              onClick={() => setAdminSubTab('orders')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
                adminSubTab === 'orders' ? 'text-stone-100 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Package className="w-4 h-4 mb-0.5" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setAdminSubTab('suppliers')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
                adminSubTab === 'suppliers' ? 'text-stone-100 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Store className="w-4 h-4 mb-0.5" />
              <span>Yards</span>
            </button>

            <button
              onClick={() => setAdminSubTab('consumers')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
                adminSubTab === 'consumers' ? 'text-stone-100 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className="w-4 h-4 mb-0.5" />
              <span>Buyers</span>
            </button>

            <button
              onClick={() => setAdminSubTab('users')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
                adminSubTab === 'users' ? 'text-stone-100 font-semibold' : 'text-stone-400 hover:text-stone-200'
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
