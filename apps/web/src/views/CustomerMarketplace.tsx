import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useDistrict } from '../lib/district-context';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';
import { CompareModal } from '../components/CompareModal';
import {
  Search,
  MapPin,
  Store,
  CheckCircle2,
  Clock,
  Truck,
  Star,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Phone,
  Layers,
  Building2,
  HardHat,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Sparkles,
  Zap,
  Check,
  IndianRupee,
  Calculator,
  X,
  Edit3,
  Scale
} from 'lucide-react';

interface CustomerMarketplaceProps {
  subTab: 'shop' | 'orders';
  setSubTab: (tab: 'shop' | 'orders') => void;
  onOpenCart: () => void;
  yardId?: string | null;
  onSelectYard?: (id: string | null) => void;
  compareId?: string | null;
  onSelectCompare?: (productId: string | null) => void;
}

export const CustomerMarketplace: React.FC<CustomerMarketplaceProps> = ({
  subTab,
  setSubTab,
  onOpenCart,
  yardId,
  onSelectYard,
  compareId,
  onSelectCompare
}) => {
  const { activeDistrict } = useDistrict();
  const { user, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const { items, supplierId: cartSupplierId, addItem, updateQuantity, itemCount, finalTotal, deliveryCharge } = useCart();

  // State
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedSupplierData, setSelectedSupplierData] = useState<any | null>(null);
  const [isLoadingStorefront, setIsLoadingStorefront] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSummary, setOrderSummary] = useState<{ totalOutstanding: number; totalPurchased: number; totalPaid: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);

  // Material-First Discovery & Compare States
  const [discoveryMode, setDiscoveryMode] = useState<'materials' | 'yards'>('materials');
  const [categories, setCategories] = useState<any[]>([]);
  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [selectedProductForCompare, setSelectedProductForCompare] = useState<any | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Active yard helper (URL parameter takes precedence if passed)
  const activeSupplierId = yardId !== undefined ? yardId : selectedSupplierId;

  const handleSelectYard = (id: string | null) => {
    setSelectedSupplierId(id);
    if (onSelectYard) onSelectYard(id);
  };

  const handleOpenCompare = (product: any) => {
    setSelectedProductForCompare(product);
    setIsCompareOpen(true);
    if (onSelectCompare) onSelectCompare(product.id);
  };

  const handleCloseCompare = () => {
    setIsCompareOpen(false);
    setSelectedProductForCompare(null);
    if (onSelectCompare) onSelectCompare(null);
  };

  // Sync compareId from URL params when master catalog loads
  useEffect(() => {
    if (compareId && masterProducts.length > 0) {
      const match = masterProducts.find((p) => p.id === compareId);
      if (match) {
        setSelectedProductForCompare(match);
        setIsCompareOpen(true);
      }
    } else if (!compareId && isCompareOpen) {
      setIsCompareOpen(false);
      setSelectedProductForCompare(null);
    }
  }, [compareId, masterProducts]);

  // Load Master Products and Categories for Material-First Discovery
  useEffect(() => {
    async function loadCatalog() {
      setIsLoadingCatalog(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          apiFetch<any>('/catalog/categories'),
          apiFetch<any>('/catalog/master-products')
        ]);
        setCategories(catRes.categories || []);
        setMasterProducts(prodRes.masterProducts || []);
      } catch (e) {
        console.error('Error loading master catalog:', e);
      } finally {
        setIsLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  // Load Verified Local Suppliers
  useEffect(() => {
    async function loadSuppliers() {
      setIsLoadingSuppliers(true);
      try {
        const res = await apiFetch<any>(`/marketplace/suppliers?districtId=${activeDistrict?.id || ''}`);
        setSuppliers(res.suppliers || []);
      } catch (e) {
        console.error('Error loading suppliers:', e);
      } finally {
        setIsLoadingSuppliers(false);
      }
    }
    loadSuppliers();
  }, [activeDistrict]);

  // Load Selected Yard Storefront (Products Menu)
  useEffect(() => {
    if (!activeSupplierId) {
      setSelectedSupplierData(null);
      return;
    }

    async function loadStorefront() {
      setIsLoadingStorefront(true);
      try {
        const res = await apiFetch<any>(`/marketplace/suppliers/${activeSupplierId}/storefront`);
        setSelectedSupplierData(res.supplier);
      } catch (e) {
        console.error('Error loading yard storefront:', e);
      } finally {
        setIsLoadingStorefront(false);
      }
    }
    loadStorefront();
  }, [activeSupplierId]);

  // Load and live-poll Customer Orders if on 'orders' tab
  useEffect(() => {
    if (subTab !== 'orders' || !user) {
      if (!user) {
        setOrders([]);
        setOrderSummary(null);
      }
      return;
    }

    let isMounted = true;
    const fetchOrders = () => {
      apiFetch<any>('/customer/orders')
        .then((res) => {
          if (isMounted) {
            setOrders(res.orders || []);
            if (res.summary) {
              setOrderSummary(res.summary);
            }
          }
        })
        .catch(console.error);
    };

    fetchOrders();

    // Auto-poll every 8 seconds for live vehicle dispatch and delivery updates
    const pollInterval = setInterval(fetchOrders, 8000);

    // Immediate refresh on window focus
    const handleFocus = () => fetchOrders();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [subTab, user]);

  // Helper to get cart quantity for a specific supplier product
  const getCartQty = (supplierProductId: string) => {
    const it = items.find((i) => i.supplierProductId === supplierProductId);
    return it ? it.quantity : 0;
  };

  // Helper to add item to cart
  const handleAddToCart = (product: any, delta = 1) => {
    if (!selectedSupplierData) return;
    const currentQty = getCartQty(product.id);
    const minQty = product.minOrderQty || 1;

    if (currentQty === 0) {
      addItem(
        selectedSupplierData.id,
        selectedSupplierData.businessName,
        {
          supplierProductId: product.id,
          masterProductName: product.masterProduct.name,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          deliveryCharge: product.deliveryCharge
        },
        Math.max(delta, minQty)
      );
    } else {
      updateQuantity(product.id, currentQty + delta);
    }
  };

  // Helper to set exact custom quantity
  const handleSetExactQuantity = (product: any, exactQty: number) => {
    if (!selectedSupplierData) return;
    const qty = Math.max(0, exactQty);
    if (qty === 0) {
      updateQuantity(product.id, 0);
      return;
    }
    const currentQty = getCartQty(product.id);
    if (currentQty === 0) {
      addItem(
        selectedSupplierData.id,
        selectedSupplierData.businessName,
        {
          supplierProductId: product.id,
          masterProductName: product.masterProduct.name,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          deliveryCharge: product.deliveryCharge
        },
        qty
      );
    } else {
      updateQuantity(product.id, qty);
    }
  };

  const getPresetsForUnit = (unit: string) => {
    const u = (unit || '').toUpperCase();
    if (u.includes('BAG')) return [25, 50, 100, 200, 500];
    if (u.includes('CFT')) return [100, 250, 500, 1000];
    if (u.includes('PIECE') || u.includes('BRICK')) return [500, 1000, 2000, 5000];
    if (u.includes('KG')) return [100, 250, 500, 1000];
    if (u.includes('TONNE')) return [1, 2, 5, 10];
    return [10, 25, 50, 100];
  };

  // Budget-to-quantity calculator state
  const [budgetModalProduct, setBudgetModalProduct] = useState<any | null>(null);
  const [targetBudgetAmount, setTargetBudgetAmount] = useState<number>(20000);

  // Handle Customer Order Cancellation
  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this pending order?')) return;
    try {
      await apiFetch(`/customer/orders/${orderId}/cancel`, { method: 'POST' });
      const res = await apiFetch<any>('/customer/orders');
      setOrders(res.orders || []);
    } catch (e: any) {
      alert(e.message || 'Failed to cancel order');
    }
  };

  // Filter suppliers on home screen
  const filteredSuppliers = suppliers.filter((sup) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchName = sup.businessName.toLowerCase().includes(q);
    const matchAddr = sup.address.toLowerCase().includes(q);
    const matchDesc = (sup.description || '').toLowerCase().includes(q);
    return matchName || matchAddr || matchDesc;
  });

  // Filter master products for Material-First cross-supplier comparison
  const filteredMasterProducts = masterProducts.filter((p) => {
    const matchesCat =
      selectedCategorySlug === 'all' || p.category?.slug === selectedCategorySlug;
    if (!matchesCat) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.brand?.name || '').toLowerCase().includes(q) ||
      (p.category?.name || '').toLowerCase().includes(q)
    );
  });

  // Filter yard products when inside a storefront
  const yardProducts = selectedSupplierData?.products || [];
  const filteredYardProducts = yardProducts.filter((p: any) => {
    const matchCategory =
      selectedCategorySlug === 'all' ||
      p.masterProduct?.category?.slug === selectedCategorySlug ||
      p.masterProduct?.categoryId === selectedCategorySlug;

    if (!searchQuery) return matchCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      p.masterProduct?.name.toLowerCase().includes(q) ||
      p.masterProduct?.category?.name.toLowerCase().includes(q) ||
      (p.masterProduct?.brand?.name && p.masterProduct.brand.name.toLowerCase().includes(q));

    return matchCategory && matchSearch;
  });

  // Categories present in this yard
  const yardCategoriesMap = new Map<string, { id: string; name: string; slug: string }>();
  yardProducts.forEach((p: any) => {
    if (p.masterProduct?.category) {
      yardCategoriesMap.set(p.masterProduct.category.id, {
        id: p.masterProduct.category.id,
        name: p.masterProduct.category.name,
        slug: p.masterProduct.category.slug
      });
    }
  });

  return (
    <div className="pb-32 pt-4 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 space-y-6 animate-in fade-in duration-200">
      {/* Top Segmented Navigation (Browse Yards vs Orders) */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => {
              setSubTab('shop');
              handleSelectYard(null);
            }}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              subTab === 'shop' && !activeSupplierId
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Darbhanga Yards & Depots</span>
          </button>

          <button
            onClick={() => setSubTab('orders')}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              subTab === 'orders'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>My Site Orders</span>
            {orders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-slate-700 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>3 Local Yards Online for Same-Day Dispatch</span>
        </div>
      </div>

      {/* VIEW 1: MY SITE ORDERS & LIVE TRACKING */}
      {subTab === 'orders' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-stone-900">Site Orders & Live Fleet Status</h2>
              <p className="text-xs text-stone-500 mt-0.5">Track real-time tractor dispatch and site material drops</p>
            </div>
            <span className="text-xs font-mono text-stone-600 bg-stone-100 border border-stone-200 px-3 py-1 rounded-lg self-start sm:self-auto">
              {orders.length} Total Orders
            </span>
          </div>

          {/* Customer Udhaar & Account Ledger Summary Ribbon */}
          {user && orderSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-stone-500">Total Billed</span>
                <span className="text-sm font-mono font-bold text-stone-900 tabular-nums">
                  ₹{(orderSummary.totalPurchased || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-stone-500">Total Paid</span>
                <span className="text-sm font-mono font-bold text-emerald-700 tabular-nums">
                  ₹{(orderSummary.totalPaid || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-rose-600">Pending Udhaar Dues</span>
                <span className="text-sm font-mono font-bold text-rose-700 tabular-nums">
                  ₹{(orderSummary.totalOutstanding || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {!user ? (
            <div className="p-12 text-center bg-white rounded-xl border border-stone-200 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-900 border border-stone-200 flex items-center justify-center mx-auto text-xl">
                <Truck className="w-5 h-5" />
              </div>
              <p className="text-base font-semibold text-stone-900">Sign In to Track Site Deliveries</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Access real-time tractor dispatch notifications, electronic delivery challans, and Udhaar balance ledgers.
              </p>
              <button
                onClick={() => {
                  setAuthModalMode('LOGIN');
                  setIsAuthModalOpen(true);
                }}
                className="mt-2 px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Sign In with Mobile
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-stone-200 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-900 border border-stone-200 flex items-center justify-center mx-auto text-xl">
                <Truck className="w-5 h-5" />
              </div>
              <p className="text-base font-semibold text-stone-900">No site orders placed yet</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Select any verified Darbhanga yard, pick your cement, sariya, sand or bricks, and place your first direct site delivery.
              </p>
              <button
                onClick={() => setSubTab('shop')}
                className="mt-2 px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Browse Yards Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderTotal = order.finalTotal ?? order.totalAmount ?? 0;
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4 hover:border-stone-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-base font-black text-slate-900">{order.orderNumber}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              order.status === 'CONFIRMED'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : order.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : order.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {order.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            Payment: {order.paymentStatus}
                          </span>
                          {order.deliveryChallanNo && (
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              Challan: {order.deliveryChallanNo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Fulfilling Yard: <strong>{order.supplier?.businessName || 'Darbhanga Supplier'}</strong> • Placed on{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                        <div className="text-left sm:text-right">
                          <div className="text-base font-mono font-semibold text-stone-900">
                            ₹{orderTotal.toLocaleString('en-IN')}
                          </div>
                          <span
                            className={`text-[11px] font-mono font-medium ${
                              order.balancePending > 0 ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {order.balancePending > 0
                              ? `Pending: ₹${order.balancePending.toLocaleString('en-IN')}`
                              : 'Paid in Full'}
                          </span>
                        </div>
                        {order.status === 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-3 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 4-Stage Delivery Stepper */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div
                        className={`p-2 rounded-xl font-bold ${
                          ['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        1. Placed
                      </div>
                      <div
                        className={`p-2 rounded-xl font-bold ${
                          ['CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        2. Confirmed
                      </div>
                      <div
                        className={`p-2 rounded-xl font-bold ${
                          ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        3. In Transit
                      </div>
                      <div
                        className={`p-2 rounded-xl font-bold ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        4. Delivered
                      </div>
                    </div>

                    {/* Live Vehicle & Driver Tracking Banner */}
                    {order.vehicleNumber && (
                      <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-bold text-blue-900 block">
                            🚜 Assigned Vehicle: {order.vehicleNumber}
                          </span>
                          <span className="text-slate-600">
                            Driver: <strong>{order.driverName || 'Yard Logistics Driver'}</strong>
                          </span>
                        </div>
                        {order.driverPhone && (
                          <a
                            href={`tel:${order.driverPhone}`}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center space-x-1.5 self-start sm:self-auto hover:bg-blue-700"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Driver ({order.driverPhone})</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Items Summary */}
                    <div className="bg-slate-50/70 rounded-2xl p-3.5 text-xs space-y-1.5 border border-slate-100">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-slate-700 font-medium">
                          <span>
                            {item.masterProductName} × {item.quantity} {item.unit}
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹{(item.totalPrice ?? item.quantity * item.unitPrice)?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200 text-[11px] flex-wrap gap-1">
                        <span>
                          Site Drop Address: <strong>{order.deliveryAddress}</strong>
                        </span>
                        <span>
                          Carriage: <strong>₹{order.deliveryCharge || 0}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeSupplierId === null ? (
        /* VIEW 2: ZOMATO/SWIGGY STYLE YARDS DIRECTORY */
        <div className="space-y-6">
          {/* Architectural Hero Slab */}
          <div className="rounded-2xl bg-stone-900 border border-stone-800 text-white p-6 sm:p-8 relative overflow-hidden shadow-subtle">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>DIRECT WHOLESALE DISPATCH • {activeDistrict?.name?.toUpperCase() || 'DARBHANGA'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
                Wholesale Construction Materials from <br className="hidden sm:inline" />
                <span className="text-amber-400">
                  Authorized Local Yards & Depots
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
                Compare multi-dealer quotes for Cement, TMT Steel, Sand, and Bricks or browse individual yard inventories for bundled site delivery across {activeDistrict?.name || 'Darbhanga'}.
              </p>

              {/* Value Badges */}
              <div className="pt-2 flex items-center flex-wrap gap-2 text-xs text-stone-300">
                <span className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700/60 font-medium flex items-center space-x-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Same-Day Tractor Dump</span>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700/60 font-medium flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Genuine ISI / BIS Certified</span>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700/60 font-medium flex items-center space-x-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-stone-300" />
                  <span>Wholesale COD / UPI / Udhaar</span>
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials or yards (e.g. UltraTech, Tata Tiscon, Sone Sand, Gupta Materials)..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200/90 rounded-xl text-xs sm:text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-400 focus:outline-none shadow-subtle transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3 text-xs font-medium text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dual-Discovery Mode Switcher */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-stone-200">
            <div className="flex items-center space-x-1.5 bg-stone-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDiscoveryMode('materials')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                  discoveryMode === 'materials'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Compare Materials & Landed Rates</span>
              </button>
              <button
                type="button"
                onClick={() => setDiscoveryMode('yards')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                  discoveryMode === 'yards'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Browse Local Yards & Depots ({filteredSuppliers.length})</span>
              </button>
            </div>

            <div className="text-xs text-stone-500 font-medium hidden sm:block">
              {discoveryMode === 'materials'
                ? 'Select any material below to compare quotes across authorized Darbhanga dealers'
                : 'Browse by specific yard storefront for bundled single-dealer dispatches'}
            </div>
          </div>

          {/* MODE A: MATERIAL-FIRST DISCOVERY & MULTI-SUPPLIER RATE COMPARISON */}
          {discoveryMode === 'materials' ? (
            <div className="space-y-4">
              {/* Category Filter Pills with Hindi Names */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategorySlug('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategorySlug === 'all'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  All Materials (सभी सामग्री)
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer transition-all flex items-center space-x-1.5 ${
                      selectedCategorySlug === cat.slug
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.hindiName && (
                      <span className="opacity-75 font-normal text-[11px]">({cat.hindiName})</span>
                    )}
                  </button>
                ))}
              </div>

              {isLoadingCatalog ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-56 bg-white rounded-xl border border-stone-200 animate-pulse p-5" />
                  ))}
                </div>
              ) : filteredMasterProducts.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-stone-500 text-xs">
                  No materials found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {filteredMasterProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-stone-200/80 hover:border-stone-400 p-5 shadow-subtle hover:shadow-elevated transition-all duration-150 flex flex-col justify-between group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-stone-500 bg-stone-100 uppercase tracking-wider">
                            {p.category?.name} {p.category?.hindiName ? `(${p.category.hindiName})` : ''}
                          </span>
                          {p.brand && (
                            <span className="font-mono text-[11px] font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                              {p.brand.name}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-semibold text-sm text-stone-900 group-hover:text-amber-700 transition-colors leading-snug">
                            {p.name}
                          </h3>
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                            {p.description || 'Standard construction material conforming to IS certification.'}
                          </p>
                        </div>

                        {/* Specification Grid */}
                        <div className="bg-[#FAF9F6] rounded-lg p-2.5 my-2 border border-stone-200/60 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-medium text-stone-400 block">Unit</span>
                            <span className="font-mono font-semibold text-stone-800">1 {p.defaultUnit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-medium text-stone-400 block">Status</span>
                            <span className="font-mono font-semibold text-emerald-700 flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                              Active Stock
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => handleOpenCompare(p)}
                          className="w-full py-2.5 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-subtle cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5 text-amber-400" />
                          <span>Compare Quotes Across Yards</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* MODE B: SWIGGY/ZOMATO STYLE YARDS DIRECTORY */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center space-x-2">
                  <span>Verified Yards & Depots ({filteredSuppliers.length})</span>
                </h2>
                <span className="text-xs text-stone-400">Pick a yard to view materials & live rates</span>
              </div>

              {isLoadingSuppliers ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-44 bg-white rounded-xl border border-stone-200 animate-pulse p-6" />
                  ))}
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-stone-500 text-xs">
                  No yards match your search "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {filteredSuppliers.map((sup) => (
                    <div
                      key={sup.id}
                      onClick={() => {
                        handleSelectYard(sup.id);
                        setSelectedCategorySlug('all');
                        setSearchQuery('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white rounded-xl border border-stone-200/80 hover:border-stone-400 p-5 shadow-subtle hover:shadow-elevated cursor-pointer transition-all duration-150 group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="w-11 h-11 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-semibold text-lg border border-stone-800 shrink-0">
                            {sup.businessName.charAt(0)}
                          </div>
                          <span className="flex items-center text-stone-800 font-mono font-semibold bg-stone-100 px-2 py-0.5 rounded text-xs">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" />
                            {sup.rating}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h3 className="font-semibold text-sm text-stone-900 group-hover:text-amber-700 transition-colors">
                              {sup.businessName}
                            </h3>
                            {sup.isVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-stone-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 text-stone-400 mr-1 shrink-0" />
                            <span className="truncate">{sup.address}</span>
                          </p>
                        </div>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {sup.description || 'Direct supplier with verified warehouse stock and dedicated dump transport.'}
                        </p>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
                          <span className="font-medium flex items-center text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                            <Truck className="w-3 h-3 mr-1 text-stone-500" />
                            2-4 Hr Tractor Dump
                          </span>
                          <span className="font-mono text-stone-600">
                            {sup._count?.products || 11} SKUs in Yard
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                        <a
                          href={`tel:${sup.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-mono font-medium text-stone-500 hover:text-stone-900 flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{sup.phone}</span>
                        </a>

                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-lg bg-stone-900 group-hover:bg-amber-600 text-white font-medium text-xs flex items-center space-x-1 transition-colors"
                        >
                          <span>View Inventory</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 3: SWIGGY/ZOMATO YARD STOREFRONT (RESTAURANT MENU PAGE) */
        <div className="space-y-6">
          {/* Sticky Header with Back Button */}
          <div className="bg-[#141413] text-white rounded-xl p-6 sm:p-7 shadow-xl border border-stone-800 space-y-4">
            <button
              onClick={() => {
                handleSelectYard(null);
                setSelectedCategorySlug('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to all Yards in Darbhanga</span>
            </button>

            {isLoadingStorefront || !selectedSupplierData ? (
              <div className="py-6 text-center text-slate-400 text-xs animate-pulse">
                Loading {selectedSupplierData?.businessName || 'Yard'} catalog...
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                    {selectedSupplierData.businessName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-white">
                        {selectedSupplierData.businessName}
                      </h1>
                      {selectedSupplierData.isVerified && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Verified Yard</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 mr-1 shrink-0" />
                      <span>{selectedSupplierData.address}</span>
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-slate-300 mt-2 flex-wrap gap-y-1">
                      <span className="flex items-center text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                        <Star className="w-3 h-3 fill-amber-400 mr-1" />
                        {selectedSupplierData.rating} Rating
                      </span>
                      <span className="text-slate-400">
                        Tractor Carriage: <strong>₹{selectedSupplierData.products?.[0]?.deliveryCharge || 250}</strong>
                      </span>
                      {selectedSupplierData.phone && (
                        <a
                          href={`tel:${selectedSupplierData.phone}`}
                          className="text-blue-300 hover:text-blue-200 font-bold flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{selectedSupplierData.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right sm:self-center">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">Yard Status</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 inline-block mt-0.5">
                    🟢 Taking Live Orders
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Search and Category Filters inside this Yard */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search materials inside ${selectedSupplierData?.businessName || 'this yard'}...`}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm transition-all"
              />
            </div>

            {/* Yard Categories Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategorySlug('all')}
                className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${
                  selectedCategorySlug === 'all'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                All Materials ({yardProducts.length})
              </button>
              {Array.from(yardCategoriesMap.values()).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu of Items in this Yard (Swiggy / Zomato Menu Items) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Available Materials ({filteredYardProducts.length})
              </h2>
              <span className="text-xs text-slate-500">Live prices set by {selectedSupplierData?.businessName}</span>
            </div>

            {filteredYardProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-stone-500 text-xs">
                No materials match your filter in this yard.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredYardProducts.map((prod: any) => {
                  const qty = getCartQty(prod.id);
                  const isCurrentYardInCart = cartSupplierId === selectedSupplierData?.id;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-xl border border-stone-200 hover:border-stone-400 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 uppercase">
                            {prod.masterProduct?.category?.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              prod.stockQuantity > 20
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            Stock: {prod.stockQuantity} {prod.unit}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-black text-base text-slate-900">
                            {prod.masterProduct?.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {prod.masterProduct?.description}
                          </p>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Min Order: <strong>{prod.minOrderQty} {prod.unit}</strong> • Freight: ₹{prod.deliveryCharge}
                        </div>
                      </div>

                      {/* Quick Volume / Quantity Presets */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Select Qty:</span>
                          {getPresetsForUnit(prod.unit).map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleSetExactQuantity(prod, preset)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                qty === preset && isCurrentYardInCart
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                  : 'bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        {/* Budget Calculator Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            setBudgetModalProduct(prod);
                            setTargetBudgetAmount(Math.max(prod.sellingPrice * 50, 20000));
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 ml-auto cursor-pointer"
                          title="Calculate how much you get for a specific ₹ budget"
                        >
                          <Calculator className="w-3 h-3 mr-0.5" />
                          <span>₹ Budget Calc</span>
                        </button>
                      </div>

                      {/* Pricing and Swiggy-style Add to Cart Button with Direct Amount Editing */}
                      <div className="pt-2 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">Yard Rate</div>
                          <div className="text-lg sm:text-xl font-black text-slate-900">
                            ₹{prod.sellingPrice}{' '}
                            <span className="text-xs font-semibold text-slate-500">/{prod.unit}</span>
                          </div>
                        </div>

                        {qty > 0 && isCurrentYardInCart ? (
                          /* Interactive Stepper with Direct Editable Numeric Input */
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center border border-amber-500 rounded-xl bg-amber-50 p-1 shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleAddToCart(prod, -1)}
                                className="p-1.5 hover:bg-white rounded-lg text-amber-900 font-bold cursor-pointer"
                                title="Decrease 1"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val)) handleSetExactQuantity(prod, val);
                                }}
                                className="w-16 text-center text-xs font-black text-slate-950 bg-white border border-amber-300 rounded-lg py-1 px-1 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-inner"
                                title="Click to edit quantity directly"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddToCart(prod, 1)}
                                className="p-1.5 hover:bg-white rounded-lg text-amber-900 font-bold cursor-pointer"
                                title="Increase 1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-right hidden sm:block">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Subtotal</span>
                              <span className="text-xs font-black text-amber-600">
                                ₹{(qty * prod.sellingPrice).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Direct Amount Input + ADD Button */
                          <div className="flex items-center space-x-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                placeholder={String(prod.minOrderQty || 10)}
                                defaultValue={prod.minOrderQty || 10}
                                id={`custom-qty-${prod.id}`}
                                className="w-16 px-2 py-2 text-xs font-black text-center bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                                title="Type custom amount / quantity"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const inputEl = document.getElementById(`custom-qty-${prod.id}`) as HTMLInputElement;
                                const customVal = inputEl ? parseInt(inputEl.value) : prod.minOrderQty || 10;
                                handleSetExactQuantity(prod, customVal || prod.minOrderQty || 10);
                              }}
                              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-black text-xs flex items-center space-x-1 transition-all shadow-sm cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              <span>ADD</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating Cart Bar (Swiggy / Zomato Style Checkout Bar) */}
          {itemCount > 0 && cartSupplierId === selectedSupplierData?.id && (
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-40 animate-in slide-in-from-bottom duration-200">
              <div
                onClick={onOpenCart}
                className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between cursor-pointer hover:scale-102 transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-amber-400">
                    {itemCount} items from {selectedSupplierData.businessName}
                  </div>
                  <div className="text-base font-black text-white">
                    ₹{finalTotal.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-slate-400">(incl. freight)</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                  <span>View Cart</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
            </div>
          )}

          {/* BUDGET-TO-QUANTITY CALCULATOR MODAL */}
          {budgetModalProduct && (
            <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-stone-200">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900">Calculate Amount by ₹ Budget</h3>
                      <p className="text-xs text-slate-500 truncate max-w-[240px]">
                        {budgetModalProduct.masterProduct?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBudgetModalProduct(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      How much rupees (₹) do you want to spend?
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        value={targetBudgetAmount}
                        onChange={(e) => setTargetBudgetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-8 pr-4 py-2.5 text-base font-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="e.g. 50000"
                      />
                    </div>
                  </div>

                  {/* Quick Budget Presets */}
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                    {[10000, 25000, 50000, 100000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTargetBudgetAmount(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          targetBudgetAmount === preset
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-100 hover:bg-amber-100 text-slate-700'
                        }`}
                      >
                        ₹{(preset / 1000)}k
                      </button>
                    ))}
                  </div>

                  {/* Calculated Result Card */}
                  {(() => {
                    const calculatedQty = Math.max(
                      budgetModalProduct.minOrderQty || 1,
                      Math.floor(targetBudgetAmount / budgetModalProduct.sellingPrice)
                    );
                    const actualCost = calculatedQty * budgetModalProduct.sellingPrice;

                    return (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Material Unit Rate:</span>
                          <span className="font-bold text-slate-900">₹{budgetModalProduct.sellingPrice} / {budgetModalProduct.unit}</span>
                        </div>

                        <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-800 block">Calculated Quantity:</span>
                            <div className="text-2xl font-black text-slate-950">
                              {calculatedQty.toLocaleString('en-IN')}{' '}
                              <span className="text-sm font-bold text-slate-700">{budgetModalProduct.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block">Total Landed:</span>
                            <div className="text-lg font-black text-amber-900">
                              ₹{actualCost.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 pt-1">
                          Includes exact unit rounding. Freight will be added at checkout.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            handleSetExactQuantity(budgetModalProduct, calculatedQty);
                            setBudgetModalProduct(null);
                          }}
                          className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add {calculatedQty} {budgetModalProduct.unit} to Cart (₹{actualCost.toLocaleString('en-IN')})</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-Time Cross-Supplier Material Comparison Modal */}
      {selectedProductForCompare && (
        <CompareModal
          masterProduct={selectedProductForCompare}
          isOpen={isCompareOpen}
          onClose={handleCloseCompare}
          onAddedToCart={() => {
            handleCloseCompare();
            onOpenCart();
          }}
        />
      )}
    </div>
  );
};
