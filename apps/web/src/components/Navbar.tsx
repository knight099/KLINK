import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useDistrict } from '../lib/district-context';
import { useCart } from '../lib/cart-context';
import {
  ShoppingCart,
  MapPin,
  Store,
  Shield,
  User,
  ChevronDown,
  Check,
  HardHat,
  Sparkles,
  Building2,
  Phone,
  ArrowRight,
  Truck,
  CheckCircle2,
  LogIn,
  LogOut,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'customer' | 'supplier' | 'admin';
  setCurrentTab: (tab: 'customer' | 'supplier' | 'admin') => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenCart }) => {
  const {
    user,
    logout,
    switchPersona,
    isDemoMode,
    setDemoMode,
    setIsAuthModalOpen,
    setAuthModalMode
  } = useAuth();
  const { activeDistrict, districts, setDistrict } = useDistrict();
  const { itemCount } = useCart();
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const districtRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setDistrictDropdownOpen(false);
      }
      if (personaRef.current && !personaRef.current.contains(event.target as Node)) {
        setPersonaDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-sm transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center justify-between h-16">

          {/* Left: Brand Identity & Location Hub */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Logo */}
            <div
              onClick={() => {
                setCurrentTab('customer');
                if (isDemoMode && !user) switchPersona('CUSTOMER');
              }}
              className="flex items-center space-x-2.5 cursor-pointer group select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center text-stone-200 shadow-xs group-hover:border-stone-500 transition-colors">
                <HardHat className="w-4 h-4 text-stone-200" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-bold tracking-tight text-stone-100 font-mono">
                    KLINK
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-stone-850 text-stone-400 border border-stone-750">
                    B2B
                  </span>
                </div>
                <span className="text-[10px] font-mono tracking-wide text-stone-500 -mt-0.5 hidden sm:inline">
                  Materials Exchange • Bihar
                </span>
              </div>
            </div>

            {/* District Hub Selector */}
            <div className="relative" ref={districtRef}>
              <button
                onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 text-xs font-medium hover:border-stone-700 hover:text-stone-100 transition-all cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate max-w-[95px] sm:max-w-none text-stone-200 font-mono">
                  {activeDistrict ? activeDistrict.name : 'Darbhanga'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${districtDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {districtDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl bg-stone-900 border border-stone-800 shadow-2xl py-2 z-50 text-stone-200 divide-y divide-stone-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] font-mono text-stone-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Bihar Delivery Hubs</span>
                    <span className="text-stone-500 text-[9px]">4 Districts</span>
                  </div>
                  <div className="py-1">
                    {districts.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setDistrict(d);
                          setDistrictDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-stone-800/80 transition-colors cursor-pointer ${
                          activeDistrict?.id === d.id ? 'text-stone-100 font-semibold bg-stone-800/50' : 'text-stone-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-stone-500" />
                          <span className="font-medium">{d.name}</span>
                          {d.code === 'DARBHANGA' ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                              Active
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-stone-800 text-stone-500">
                              Phase 2
                            </span>
                          )}
                        </div>
                        {activeDistrict?.id === d.id && <Check className="w-3.5 h-3.5 text-stone-200 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Desktop Segmented Portal Switcher */}
          <div className="hidden lg:flex items-center bg-stone-900 border border-stone-800 p-1 rounded-xl shadow-xs">
            <button
              onClick={() => {
                setCurrentTab('customer');
                if (isDemoMode && user?.role !== 'CUSTOMER') switchPersona('CUSTOMER');
              }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center space-x-2 cursor-pointer font-medium ${
                currentTab === 'customer'
                  ? 'bg-stone-800 text-stone-100 border border-stone-750 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <HardHat className="w-3.5 h-3.5 text-stone-300" />
              <span>Contractor Marketplace</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('supplier');
                if (isDemoMode && user?.role !== 'SUPPLIER') switchPersona('SUPPLIER', 0);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center space-x-2 cursor-pointer font-medium ${
                currentTab === 'supplier'
                  ? 'bg-stone-800 text-stone-100 border border-stone-750 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-stone-300" />
              <span>Supplier Yard OS</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('admin');
                if (isDemoMode && user?.role !== 'ADMIN') switchPersona('ADMIN');
              }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center space-x-2 cursor-pointer font-medium ${
                currentTab === 'admin'
                  ? 'bg-stone-800 text-stone-100 border border-stone-750 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-stone-300" />
              <span>Platform Catalog</span>
            </button>
          </div>

          {/* Right: Auth Controls & Shopping Cart */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5">
            {/* Quick Demo Persona Switcher (when Demo Mode is enabled) */}
            {isDemoMode ? (
              <div className="relative" ref={personaRef}>
                <button
                  onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-stone-800 bg-stone-900 text-xs text-stone-300 hover:border-stone-700 hover:bg-stone-850 transition-all cursor-pointer"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user?.role === 'ADMIN'
                        ? 'bg-purple-400'
                        : user?.role === 'SUPPLIER'
                        ? 'bg-sky-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <div className="text-left leading-tight hidden sm:block">
                    <div className="font-semibold text-stone-200 text-xs truncate max-w-[130px]">
                      {user ? user.name : 'Demo Sandbox'}
                    </div>
                    <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                      {user?.role === 'SUPPLIER' ? 'Yard Operator' : user?.role === 'ADMIN' ? 'Platform Admin' : 'Site Buyer'}
                    </div>
                  </div>
                  <span className="sm:hidden font-semibold text-xs text-stone-300">
                    {user?.role === 'SUPPLIER' ? 'Yard' : user?.role === 'ADMIN' ? 'Admin' : 'Buyer'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${personaDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {personaDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-stone-900 border border-stone-800 shadow-2xl p-2 z-50 text-stone-200 divide-y divide-stone-800 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
                          Demo Sandbox Active
                        </span>
                        <span className="text-[11px] text-stone-500">
                          1-Click Role Simulation
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setDemoMode(false);
                          setPersonaDropdownOpen(false);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                        title="Switch to Production Authentication Mode"
                      >
                        Exit Demo
                      </button>
                    </div>

                    {/* Supplier Yards */}
                    <div className="py-1">
                      <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 block mt-1">
                        Dealer Yards (Darbhanga)
                      </span>
                      <button
                        onClick={() => {
                          switchPersona('SUPPLIER', 0);
                          setCurrentTab('supplier');
                          setPersonaDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-800 rounded-lg flex items-center justify-between text-stone-300 hover:text-white cursor-pointer"
                      >
                        <div>
                          <div className="font-medium text-stone-100">Gupta Building Materials</div>
                          <div className="text-[10px] font-mono text-stone-500">Donar Chowk • 9876543210</div>
                        </div>
                        {user?.phone === '9876543210' && <Check className="w-3.5 h-3.5 text-stone-200" />}
                      </button>
                      <button
                        onClick={() => {
                          switchPersona('SUPPLIER', 1);
                          setCurrentTab('supplier');
                          setPersonaDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-800 rounded-lg flex items-center justify-between text-stone-300 hover:text-white cursor-pointer"
                      >
                        <div>
                          <div className="font-medium text-stone-100">Singh Traders & Steels</div>
                          <div className="text-[10px] font-mono text-stone-500">Laheriasarai • 9876543211</div>
                        </div>
                        {user?.phone === '9876543211' && <Check className="w-3.5 h-3.5 text-stone-200" />}
                      </button>
                      <button
                        onClick={() => {
                          switchPersona('SUPPLIER', 2);
                          setCurrentTab('supplier');
                          setPersonaDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-800 rounded-lg flex items-center justify-between text-stone-300 hover:text-white cursor-pointer"
                      >
                        <div>
                          <div className="font-medium text-stone-100">Maa Durga Aggregates</div>
                          <div className="text-[10px] font-mono text-stone-500">Benta Bypass • 9876543212</div>
                        </div>
                        {user?.phone === '9876543212' && <Check className="w-3.5 h-3.5 text-stone-200" />}
                      </button>
                    </div>

                    {/* Buyers & Contractors */}
                    <div className="py-1">
                      <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 block mt-1">
                        Buyers & Contractors
                      </span>
                      <button
                        onClick={() => {
                          switchPersona('CUSTOMER', '9123456789');
                          setCurrentTab('customer');
                          setPersonaDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-800 rounded-lg flex items-center justify-between text-stone-300 hover:text-white cursor-pointer"
                      >
                        <div>
                          <div className="font-medium text-stone-100">Ravi Kumar (Homeowner)</div>
                          <div className="text-[10px] font-mono text-stone-500">Bahadurpur • 9123456789</div>
                        </div>
                        {user?.phone === '9123456789' && <Check className="w-3.5 h-3.5 text-stone-200" />}
                      </button>
                      <button
                        onClick={() => {
                          switchPersona('CUSTOMER', '9123456781');
                          setCurrentTab('customer');
                          setPersonaDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-800 rounded-lg flex items-center justify-between text-stone-300 hover:text-white cursor-pointer"
                      >
                        <div>
                          <div className="font-medium text-stone-100">Amitesh Jha (Contractor)</div>
                          <div className="text-[10px] font-mono text-stone-500">VIP Road • 9123456781</div>
                        </div>
                        {user?.phone === '9123456781' && <Check className="w-3.5 h-3.5 text-stone-200" />}
                      </button>
                    </div>

                    {/* Platform Admin */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          switchPersona('ADMIN');
                          setCurrentTab('admin');
                          setPersonaDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-800 rounded-lg flex items-center justify-between text-stone-300 font-medium cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Shield className="w-3.5 h-3.5 text-stone-400" />
                          <span>Platform Super Admin</span>
                        </div>
                        {user?.role === 'ADMIN' && <Check className="w-3.5 h-3.5 text-stone-200" />}
                      </button>
                    </div>

                    {/* Manual Login Modal Trigger */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setIsAuthModalOpen(true);
                          setPersonaDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-800 rounded-lg flex items-center space-x-2 text-stone-400 hover:text-stone-200 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In with Another Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Production Auth Mode Controls */
              <div className="flex items-center space-x-2">
                {user ? (
                  <div className="flex items-center space-x-2 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg text-xs">
                    <div className="leading-tight">
                      <div className="font-semibold text-stone-200 truncate max-w-[120px]">
                        {user.name}
                      </div>
                      <div className="text-[10px] font-mono text-stone-500">
                        {user.role} • {user.phone}
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      title="Log Out"
                      className="p-1 rounded-md text-stone-400 hover:text-stone-100 hover:bg-stone-800 cursor-pointer ml-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setAuthModalMode('LOGIN');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        setAuthModalMode('REGISTER');
                        setIsAuthModalOpen(true);
                      }}
                      className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Register
                    </button>
                  </div>
                )}

                {/* Return to Demo button */}
                <button
                  onClick={() => setDemoMode(true)}
                  className="px-2 py-1 text-[10px] font-mono rounded border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900 cursor-pointer"
                  title="Enable Demo Mode for instant multi-role exploration"
                >
                  Demo
                </button>
              </div>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-stone-100 hover:bg-white text-stone-900 font-semibold text-xs transition-colors shadow-2xs cursor-pointer font-mono"
            >
              <ShoppingCart className="w-4 h-4 text-stone-900" />
              <span className="hidden sm:inline">Requisition</span>
              {itemCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-white text-[10px] font-mono">
                  {itemCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

