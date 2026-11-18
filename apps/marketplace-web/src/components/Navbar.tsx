import { useLanguage, LanguageSwitch, PageHeader } from '@klink/ui';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useDistrict } from '../lib/district-context';
import { useCart } from '../lib/cart-context';
import { getAppMode } from '../lib/api';
import {
  ShoppingCart,
  MapPin,
  Store,
  Shield,
  ChevronDown,
  Check,
  HardHat,
  LogIn,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'customer' | 'supplier' | 'admin';
  setCurrentTab: (tab: 'customer' | 'supplier' | 'admin') => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenCart }) => {
  const { t } = useLanguage();
  const {
    user,
    logout,
    setIsAuthModalOpen,
    setAuthModalMode
  } = useAuth();
  const { activeDistrict, districts, setDistrict } = useDistrict();
  const { itemCount } = useCart();
  const appMode = getAppMode();

  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);

  const districtRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setDistrictDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const badgeTitle =
    appMode === 'SUPPLIER'
      ? 'PARTNER OS'
      : appMode === 'ADMIN'
      ? 'CENTRAL OPS'
      : 'B2B';

  const subtitleText =
    appMode === 'SUPPLIER'
      ? 'Dealer Yard Operating System'
      : appMode === 'ADMIN'
      ? 'Platform Control Tower'
      : 'Materials Exchange • Bihar';

  return (
    <PageHeader>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2 sm:min-h-16">
          {/* Left: Brand Identity & Location Hub */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div
              onClick={() => {
                if (appMode === 'CUSTOMER' || appMode === 'UNIFIED') {
                  setCurrentTab('customer');
                }
              }}
              className="flex items-center space-x-2.5 cursor-pointer group select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center text-stone-200 shadow-xs group-hover:border-stone-500 transition-colors">
                {appMode === 'SUPPLIER' ? (
                  <Store className="w-4 h-4 text-amber-400" />
                ) : appMode === 'ADMIN' ? (
                  <Shield className="w-4 h-4 text-emerald-400" />
                ) : (
                  <HardHat className="w-4 h-4 text-stone-200" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-bold tracking-tight text-stone-100 font-mono">
                    KLINK
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-stone-850 text-stone-300 border border-stone-750">
                    {badgeTitle}
                  </span>
                </div>
                <span className="text-[10px] font-mono tracking-wide text-stone-500 -mt-0.5 hidden sm:inline">
                  {subtitleText}
                </span>
              </div>
            </div>

            {/* District Hub Selector (Shown on Marketplace & Unified modes) */}
            {(appMode === 'CUSTOMER' || appMode === 'UNIFIED') && (
              <div className="klink-district" ref={districtRef}>
                <button
                  onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                  aria-expanded={districtDropdownOpen}
                  aria-label={`${t('Delivery District')}: ${activeDistrict?.name || 'Darbhanga'}`}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 text-xs font-medium hover:border-stone-700 hover:text-stone-100 transition-all cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate max-w-[95px] sm:max-w-none text-stone-200 font-mono">
                    {activeDistrict ? activeDistrict.name : 'Darbhanga'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-500 transition-transform ${
                      districtDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {districtDropdownOpen && (
                  <div className="klink-district-menu mt-2 w-64 rounded-xl bg-stone-900 border border-stone-800 shadow-2xl py-2 z-50 text-stone-200 divide-y divide-stone-800 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-1.5 text-[10px] font-mono text-stone-400 uppercase tracking-widest flex items-center justify-between">
                      <span>{t('Bihar Delivery Hubs')}</span>
                      <span className="text-stone-500 text-[9px]">{districts.length} {t('Districts')}</span>
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
                            activeDistrict?.id === d.id
                              ? 'text-stone-100 font-semibold bg-stone-800/50'
                              : 'text-stone-400'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-3.5 h-3.5 text-stone-500" />
                            <span className="font-medium">{d.name}</span>
                            {d.isActive ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                {t('Active')}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-stone-800 text-stone-500">
                                {t('Phase 2')}
                              </span>
                            )}
                          </div>
                          {activeDistrict?.id === d.id && (
                            <Check className="w-3.5 h-3.5 text-stone-200 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Auth Controls & Shopping Cart */}
          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
            <LanguageSwitch />
            <div className="flex items-center space-x-2">
              {user ? (
                <div className="flex items-center space-x-2 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg text-xs">
                  <div className="leading-tight">
                    <div className="font-semibold text-stone-200 truncate max-w-[140px]">
                      {user.name}
                    </div>
                    <div className="text-[10px] font-mono text-stone-500">
                      {user.role} • +91 {user.phone}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    title={t('Log Out')}
                    className="p-1 rounded-md text-stone-400 hover:text-stone-100 hover:bg-stone-800 cursor-pointer ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                (appMode === 'CUSTOMER' || appMode === 'UNIFIED') && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setAuthModalMode('LOGIN');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{t('Sign In')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setAuthModalMode('REGISTER');
                        setIsAuthModalOpen(true);
                      }}
                      className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      {t('Register')}
                    </button>
                  </div>
                )
              )}

            </div>

            {/* Shopping Cart Button — Only shown in Customer Marketplace or Customer tab */}
            {(appMode === 'CUSTOMER' || (appMode === 'UNIFIED' && currentTab === 'customer')) && (
              <button
                onClick={onOpenCart}
                aria-label={t('Cart')}
                className="relative flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-stone-100 hover:bg-white text-stone-900 font-semibold text-xs transition-colors shadow-2xs cursor-pointer font-mono"
              >
                <ShoppingCart className="w-4 h-4 text-stone-900" />
                <span>{t('Cart')}</span>
                {itemCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-white text-[10px] font-mono">
                    {itemCount}
                  </span>
                ) : null}
              </button>
            )}
          </div>
        </div>
      </div>
    </PageHeader>
  );
};
