import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useDistrict } from '../lib/district-context';
import {
  TrendingUp,
  Package,
  Clock,
  AlertTriangle,
  Check,
  X,
  Truck,
  IndianRupee,
  Plus,
  PhoneCall,
  Shield,
  Store,
  Layers,
  Settings,
  Search,
  CheckCircle2,
  Phone,
  MapPin,
  Building2,
  FileText,
  BadgeCheck,
  ArrowUpRight,
  Send,
  Sparkles,
  ShoppingBag,
  Printer,
  Navigation,
  UserCheck,
  Calendar,
  UserPlus,
  CreditCard,
  ChevronRight,
  Hash,
  Trash2,
  MessageSquare
} from 'lucide-react';

interface SupplierPortalProps {
  subTab: 'dashboard' | 'inventory' | 'orders' | 'deliveries' | 'ledger' | 'profile';
  setSubTab: (tab: 'dashboard' | 'inventory' | 'orders' | 'deliveries' | 'ledger' | 'profile') => void;
}

export const SupplierPortal: React.FC<SupplierPortalProps> = ({ subTab, setSubTab }) => {
  const { user, switchPersona, isDemoMode, login } = useAuth();
  const { districts } = useDistrict();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [deliveriesData, setDeliveriesData] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | 'READY' | 'ON_ROAD' | 'DELIVERED'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Dealer Direct Login State
  const [dealerPhone, setDealerPhone] = useState('9876543210');
  const [dealerPass, setDealerPass] = useState('');
  const [dealerLoginError, setDealerLoginError] = useState<string | null>(null);
  const [isDealerLoggingIn, setIsDealerLoggingIn] = useState(false);

  // Supplier Profile state
  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [profBusinessName, setProfBusinessName] = useState('');
  const [profOwnerName, setProfOwnerName] = useState('');
  const [profAddress, setProfAddress] = useState('');
  const [profGstin, setProfGstin] = useState('');
  const [profLogoUrl, setProfLogoUrl] = useState('');
  const [profDescription, setProfDescription] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Modals state
  // 1. Manual / Walk-in Order Modal
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [manualCustomerMode, setManualCustomerMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [manualCustomerId, setManualCustomerId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualCustomerAddress, setManualCustomerAddress] = useState('');
  const [manualLandmark, setManualLandmark] = useState('');
  const [manualPincode, setManualPincode] = useState('846001');
  const [manualSitePhone, setManualSitePhone] = useState('');
  const [manualInstructions, setManualInstructions] = useState('');
  const [manualDeliveryCharge, setManualDeliveryCharge] = useState(300);
  const [manualInitialStatus, setManualInitialStatus] = useState<'CONFIRMED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'>('CONFIRMED');
  const [manualVehicleNo, setManualVehicleNo] = useState('');
  const [manualDriverName, setManualDriverName] = useState('');
  const [manualDriverPhone, setManualDriverPhone] = useState('');
  const [manualAmountPaid, setManualAmountPaid] = useState<number>(0);
  const [manualPaymentMode, setManualPaymentMode] = useState<'CASH' | 'UPI_DIRECT' | 'BANK_TRANSFER' | 'CHEQUE' | 'UDHAAR'>('CASH');
  const [manualPaymentNotes, setManualPaymentNotes] = useState('');
  const [manualItems, setManualItems] = useState<Array<{ supplierProductId: string; quantity: number; unitPrice: number; unit: string; name: string }>>([]);

  // 2. Manual Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCustomerId, setPaymentCustomerId] = useState('');
  const [paymentOrderId, setPaymentOrderId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI_DIRECT' | 'BANK_TRANSFER' | 'CHEQUE' | 'UDHAAR'>('CASH');
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // 3. Dispatch Delivery Modal
  const [dispatchOrder, setDispatchOrder] = useState<any | null>(null);
  const [dispatchDriverName, setDispatchDriverName] = useState('');
  const [dispatchDriverPhone, setDispatchDriverPhone] = useState('');
  const [dispatchVehicleNo, setDispatchVehicleNo] = useState('');
  const [dispatchChallanNo, setDispatchChallanNo] = useState('');
  const [dispatchInstructions, setDispatchInstructions] = useState('');

  // 4. Complete Delivery Modal
  const [completeOrder, setCompleteOrder] = useState<any | null>(null);
  const [receivedByName, setReceivedByName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // 5. Delivery Challan / Trip Memo Print Modal
  const [challanOrder, setChallanOrder] = useState<any | null>(null);

  // 6. Master Product Add Modal
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [addCatalogCategory, setAddCatalogCategory] = useState('all');
  const [addCatalogSearch, setAddCatalogSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [newPrice, setNewPrice] = useState(380);
  const [newStock, setNewStock] = useState(100);
  const [newMinOrder, setNewMinOrder] = useState(10);
  const [newDeliveryFee, setNewDeliveryFee] = useState(300);

  // 7. Settle Udhaar Modal
  const [settleLedgerCustomer, setSettleLedgerCustomer] = useState<any | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);

  // 8. Search & Inline Rate/Stock Editor States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editDeliveryFee, setEditDeliveryFee] = useState<number>(0);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  // 9. Vehicles Fleet state
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState('TRACTOR_TROLLEY');
  const [vehicleDriverName, setVehicleDriverName] = useState('');
  const [vehicleDriverPhone, setVehicleDriverPhone] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('100 Bags / 150 CFT');
  const [vehicleStatus, setVehicleStatus] = useState('AVAILABLE');
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  // Customer Khata Statement Drawer State
  const [khataCustomer, setKhataCustomer] = useState<any | null>(null);
  const [khataStatement, setKhataStatement] = useState<any | null>(null);
  const [isKhataLoading, setIsKhataLoading] = useState(false);
  const [profServiceDistricts, setProfServiceDistricts] = useState<string[]>([]);

  // Loaders
  const loadDashboard = async () => {
    try {
      const res = await apiFetch<any>('/supplier/dashboard');
      setDashboardData(res);
    } catch (e) {
      console.error('Error loading dashboard:', e);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await apiFetch<any>('/supplier/products');
      setProducts(res.products || []);
    } catch (e) {
      console.error('Error loading products:', e);
    }
  };

  const loadOrders = async () => {
    try {
      const endpoint = selectedStatus === 'ALL' ? '/supplier/orders' : `/supplier/orders?status=${selectedStatus}`;
      const res = await apiFetch<any>(endpoint);
      setOrders(res.orders || []);
    } catch (e) {
      console.error('Error loading orders:', e);
    }
  };

  const loadLedger = async () => {
    try {
      const res = await apiFetch<any>('/supplier/ledger');
      setLedgerData(res);
    } catch (e) {
      console.error('Error loading ledger:', e);
    }
  };

  const loadDeliveries = async () => {
    try {
      const res = await apiFetch<any>('/supplier/deliveries');
      setDeliveriesData(res);
    } catch (e) {
      console.error('Error loading deliveries:', e);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await apiFetch<any>('/supplier/customers');
      setCustomers(res.customers || []);
      if (res.customers?.length > 0 && !manualCustomerId) {
        setManualCustomerId(res.customers[0].id);
      }
    } catch (e) {
      console.error('Error loading customers:', e);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await apiFetch<any>('/supplier/vehicles');
      setVehicles(res.vehicles || []);
    } catch (e) {
      console.error('Error loading vehicles:', e);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await apiFetch<any>('/supplier/profile');
      if (res.supplier) {
        setSupplierProfile(res.supplier);
        setProfBusinessName(res.supplier.businessName || '');
        setProfOwnerName(res.supplier.ownerName || '');
        setProfAddress(res.supplier.address || '');
        setProfGstin(res.supplier.gstin || '');
        setProfLogoUrl(res.supplier.logoUrl || '');
        setProfDescription(res.supplier.description || '');
        const currentServiceDistricts = (res.supplier.serviceAreas || []).map((sa: any) => sa.districtId);
        setProfServiceDistricts(currentServiceDistricts.length > 0 ? currentServiceDistricts : [res.supplier.districtId]);
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  const openKhataStatement = async (c: any) => {
    setKhataCustomer(c);
    setIsKhataLoading(true);
    try {
      const res = await apiFetch<any>(`/supplier/ledger/${c.customerId}`);
      setKhataStatement(res);
    } catch (e: any) {
      alert(e.message || 'Failed to load customer passbook');
    } finally {
      setIsKhataLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await apiFetch<any>('/supplier/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          businessName: profBusinessName,
          ownerName: profOwnerName,
          address: profAddress,
          gstin: profGstin,
          logoUrl: profLogoUrl,
          description: profDescription,
          serviceDistrictIds: profServiceDistricts
        })
      });
      setProfileSaveSuccess(true);
      loadProfile();
      loadDashboard();
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update store profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Initial load of all portal datasets on user authentication
  useEffect(() => {
    if (!user || user.role !== 'SUPPLIER') {
      if (isDemoMode) {
        switchPersona('SUPPLIER', 0);
      }
      return;
    }
    setIsLoading(true);
    Promise.all([
      loadDashboard(),
      loadProducts(),
      loadOrders(),
      loadLedger(),
      loadDeliveries(),
      loadCustomers(),
      loadVehicles(),
      loadProfile(),
      apiFetch<any>('/catalog/master-products').then((res) => {
        setMasterProducts(res.masterProducts || []);
        if (res.masterProducts?.[0]) setSelectedMasterId(res.masterProducts[0].id);
      }),
      apiFetch<any>('/catalog/categories').then((res) => {
        setCategories(res.categories || []);
      })
    ]).finally(() => setIsLoading(false));
  }, [user, isDemoMode]);

  // Lightweight status filter change: only reloads orders queue without re-fetching entire dashboard/catalog
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (user && user.role === 'SUPPLIER') {
      loadOrders();
    }
  }, [selectedStatus]);

  // Handle Order Status change
  const handleUpdateStatus = async (orderId: string, status: string, reason?: string) => {
    try {
      await apiFetch<any>(`/supplier/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      loadOrders();
      loadDeliveries();
      loadDashboard();
    } catch (e: any) {
      alert(e.message || 'Failed to update order status');
    }
  };

  // Dispatch Delivery submission
  const handleDispatchDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    try {
      await apiFetch<any>(`/supplier/orders/${dispatchOrder.id}/dispatch`, {
        method: 'POST',
        body: JSON.stringify({
          driverName: dispatchDriverName,
          driverPhone: dispatchDriverPhone,
          vehicleNumber: dispatchVehicleNo,
          deliveryChallanNo: dispatchChallanNo || undefined,
          deliveryInstructions: dispatchInstructions || undefined
        })
      });
      setDispatchOrder(null);
      setDispatchDriverName('');
      setDispatchDriverPhone('');
      setDispatchVehicleNo('');
      setDispatchChallanNo('');
      setDispatchInstructions('');
      loadOrders();
      loadDeliveries();
      loadDashboard();
    } catch (e: any) {
      alert(e.message || 'Failed to dispatch order');
    }
  };

  // Complete Delivery submission
  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeOrder) return;
    try {
      await apiFetch<any>(`/supplier/orders/${completeOrder.id}/deliver`, {
        method: 'POST',
        body: JSON.stringify({
          receivedBy: receivedByName || 'Site Supervisor',
          notes: deliveryNotes || 'Site unloading verified'
        })
      });
      setCompleteOrder(null);
      setReceivedByName('');
      setDeliveryNotes('');
      loadOrders();
      loadDeliveries();
      loadDashboard();
      loadLedger();
    } catch (e: any) {
      alert(e.message || 'Failed to mark order delivered');
    }
  };

  // Manual Payment submission (Works for specific order OR general ledger)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    try {
      await apiFetch<any>('/supplier/payments/manual', {
        method: 'POST',
        body: JSON.stringify({
          customerId: paymentCustomerId,
          orderId: paymentOrderId || undefined,
          amount: paymentAmount,
          paymentMode,
          referenceNo: paymentRefNo || undefined,
          notes: paymentNotes || undefined
        })
      });
      setIsPaymentModalOpen(false);
      setPaymentCustomerId('');
      setPaymentOrderId('');
      setPaymentAmount(0);
      setPaymentRefNo('');
      setPaymentNotes('');
      loadOrders();
      loadDeliveries();
      loadDashboard();
      loadLedger();
    } catch (e: any) {
      alert(e.message || 'Failed to record manual payment');
    }
  };

  // Manual / Walk-in Order submission
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualItems.length === 0) {
      alert('Please add at least 1 material product to the order');
      return;
    }

    try {
      const payload: any = {
        deliveryCharge: manualDeliveryCharge,
        deliveryAddress: manualCustomerAddress,
        landmark: manualLandmark || undefined,
        pincode: manualPincode || '846001',
        siteContactPhone: manualSitePhone || manualCustomerPhone,
        deliveryInstructions: manualInstructions || undefined,
        vehicleNumber: manualVehicleNo || undefined,
        driverName: manualDriverName || undefined,
        driverPhone: manualDriverPhone || undefined,
        amountPaid: manualAmountPaid,
        paymentMode: manualPaymentMode,
        paymentNotes: manualPaymentNotes || undefined,
        initialStatus: manualInitialStatus,
        items: manualItems.map((i) => ({
          supplierProductId: i.supplierProductId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      };

      if (manualCustomerMode === 'EXISTING') {
        payload.customerId = manualCustomerId;
      } else {
        payload.customerName = manualCustomerName;
        payload.customerPhone = manualCustomerPhone;
        payload.customerAddress = manualCustomerAddress;
      }

      await apiFetch<any>('/supplier/orders/manual', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setIsManualOrderModalOpen(false);
      setManualItems([]);
      setManualAmountPaid(0);
      setManualPaymentNotes('');
      setManualVehicleNo('');
      setManualDriverName('');
      setManualDriverPhone('');
      loadOrders();
      loadDeliveries();
      loadDashboard();
      loadLedger();
      loadCustomers();
    } catch (e: any) {
      alert(e.message || 'Failed to create manual order');
    }
  };

  // Add Product from Master Catalog
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const mp = masterProducts.find((p) => p.id === selectedMasterId);
    if (!mp) return;

    try {
      await apiFetch<any>('/supplier/products', {
        method: 'POST',
        body: JSON.stringify({
          masterProductId: selectedMasterId,
          sellingPrice: newPrice,
          unit: mp.defaultUnit,
          stockQuantity: newStock,
          minOrderQty: newMinOrder,
          deliveryCharge: newDeliveryFee,
          lowStockThreshold: 10
        })
      });
      setAddProductModalOpen(false);
      loadProducts();
      loadDashboard();
    } catch (e: any) {
      alert(e.message || 'Failed to add product');
    }
  };

  // Quick Inline Update Product Rate & Stock
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsUpdatingProduct(true);
    try {
      await apiFetch<any>(`/supplier/products/${editingProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sellingPrice: editPrice,
          stockQuantity: editStock,
          deliveryCharge: editDeliveryFee
        })
      });
      setEditingProduct(null);
      loadProducts();
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to update product rate/stock');
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  // Vehicle Fleet Handlers
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleNo('');
    setVehicleType('TRACTOR_TROLLEY');
    setVehicleDriverName('');
    setVehicleDriverPhone('');
    setVehicleCapacity('100 Bags / 150 CFT');
    setVehicleStatus('AVAILABLE');
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: any) => {
    setEditingVehicle(veh);
    setVehicleNo(veh.vehicleNumber);
    setVehicleType(veh.vehicleType || 'TRACTOR_TROLLEY');
    setVehicleDriverName(veh.driverName || '');
    setVehicleDriverPhone(veh.driverPhone || '');
    setVehicleCapacity(veh.capacityInfo || '');
    setVehicleStatus(veh.status || 'AVAILABLE');
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) {
      alert('Please enter a vehicle registration number');
      return;
    }
    setIsSavingVehicle(true);
    try {
      if (editingVehicle) {
        await apiFetch<any>(`/supplier/vehicles/${editingVehicle.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            vehicleNumber: vehicleNo.trim().toUpperCase(),
            vehicleType,
            driverName: vehicleDriverName || undefined,
            driverPhone: vehicleDriverPhone || undefined,
            capacityInfo: vehicleCapacity || undefined,
            status: vehicleStatus
          })
        });
      } else {
        await apiFetch<any>('/supplier/vehicles', {
          method: 'POST',
          body: JSON.stringify({
            vehicleNumber: vehicleNo.trim().toUpperCase(),
            vehicleType,
            driverName: vehicleDriverName || undefined,
            driverPhone: vehicleDriverPhone || undefined,
            capacityInfo: vehicleCapacity || undefined,
            status: vehicleStatus
          })
        });
      }
      setIsVehicleModalOpen(false);
      loadVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to save vehicle');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to remove vehicle "${number}" from your yard fleet?`)) {
      return;
    }
    try {
      await apiFetch<any>(`/supplier/vehicles/${id}`, {
        method: 'DELETE'
      });
      loadVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to remove vehicle');
    }
  };

  // Quick helper to add item to manual order
  const handleAddManualItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const exists = manualItems.find((i) => i.supplierProductId === productId);
    if (exists) {
      setManualItems(
        manualItems.map((i) =>
          i.supplierProductId === productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setManualItems([
        ...manualItems,
        {
          supplierProductId: prod.id,
          name: prod.masterProduct?.name || 'Material Item',
          unit: prod.unit,
          unitPrice: prod.sellingPrice,
          quantity: prod.minOrderQty || 10
        }
      ]);
    }
  };

  const manualMaterialSubtotal = manualItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const manualFinalTotal = manualMaterialSubtotal + manualDeliveryCharge;

  const filteredMasterProducts = masterProducts.filter((mp) => {
    const matchesCat =
      addCatalogCategory === 'all' || mp.categoryId === addCatalogCategory || mp.category?.slug === addCatalogCategory;
    const matchesSearch =
      !addCatalogSearch ||
      mp.name.toLowerCase().includes(addCatalogSearch.toLowerCase()) ||
      (mp.brand?.name && mp.brand.name.toLowerCase().includes(addCatalogSearch.toLowerCase())) ||
      (mp.category?.name && mp.category.name.toLowerCase().includes(addCatalogSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const selectedMasterProduct = masterProducts.find((p) => p.id === selectedMasterId) || masterProducts[0];
  const stats = dashboardData?.stats;

  const handleDealerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDealerLoginError(null);
    setIsDealerLoggingIn(true);
    try {
      await login(dealerPhone.trim(), dealerPass);
    } catch (err: any) {
      setDealerLoginError(err?.message || 'Invalid dealer mobile or password');
    } finally {
      setIsDealerLoggingIn(false);
    }
  };

  // Auth gate for Production Mode
  if (!user || user.role !== 'SUPPLIER') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in zoom-in-95 duration-150">
          <div className="flex items-center space-x-2.5 border-b border-stone-200 pb-3">
            <div className="p-2 rounded-lg bg-stone-900 text-white">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-stone-900">Supplier Yard Operating System</h2>
              <p className="text-xs text-stone-500">Authorized Dealer & Yard Gate Access</p>
            </div>
          </div>

          {dealerLoginError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {dealerLoginError}
            </div>
          )}

          <form onSubmit={handleDealerLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Dealer Mobile Phone
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-stone-400">
                  +91
                </span>
                <input
                  type="tel"
                  value={dealerPhone}
                  onChange={(e) => setDealerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="w-full pl-11 pr-3 py-2 text-xs font-mono font-semibold text-stone-900 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter yard password"
                value={dealerPass}
                onChange={(e) => setDealerPass(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={isDealerLoggingIn || dealerPhone.length < 10 || !dealerPass}
              className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {isDealerLoggingIn ? 'Verifying Yard Credentials...' : 'Sign In to Yard OS'}
            </button>

            <div className="pt-2 border-t border-stone-200 text-center">
              <span className="text-[11px] text-stone-500">
                Sample dealer: <strong className="font-mono text-stone-700">9876543210 / supplier123</strong>
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 pt-4 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 space-y-6 animate-in fade-in duration-200">
      {/* Supplier Store Banner & Header */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-white text-xl font-bold font-mono shrink-0">
            {profBusinessName ? profBusinessName.charAt(0) : 'G'}
          </div>

          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700 uppercase tracking-wider">
                Supplier Yard OS
              </span>
              <span className="text-xs text-stone-400 font-mono flex items-center">
                <MapPin className="w-3 h-3 text-stone-500 mr-1" />
                Darbhanga Hub
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Live & Operating
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
              {profBusinessName || user?.name || 'Gupta Building Materials'}
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              {profAddress || 'Donar Chowk, Darbhanga • Authorized Dealer & Logistics Yard'}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => {
              if (customers.length > 0 && !manualCustomerId) {
                setManualCustomerId(customers[0].id);
                setManualCustomerAddress(customers[0].address || '');
                setManualSitePhone(customers[0].phone || '');
              }
              setIsManualOrderModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-100 border border-stone-700 text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>+ Manual Order</span>
          </button>

          <button
            onClick={() => {
              setPaymentCustomerId('');
              setPaymentOrderId('');
              setPaymentAmount(0);
              setIsPaymentModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-white text-stone-900 text-xs font-mono font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <IndianRupee className="w-3.5 h-3.5 text-stone-900" />
            <span>+ Record Payment</span>
          </button>
        </div>

        {/* Desktop SubTab Navigation Tabs */}
        <div className="hidden lg:flex items-center bg-stone-850 border border-stone-750 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setSubTab('dashboard')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'dashboard' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setSubTab('orders')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium relative ${
              subTab === 'orders' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Orders</span>
            {stats?.newOrdersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-stone-900 text-stone-100 text-[10px] font-mono">
                {stats.newOrdersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('deliveries')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium relative ${
              subTab === 'deliveries' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="flex items-center space-x-1">
              <Truck className="w-3 h-3 mr-1" />
              <span>Dispatches</span>
            </span>
            {deliveriesData?.stats?.onRoadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-900 text-emerald-300 text-[10px] font-mono">
                {deliveriesData.stats.onRoadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('inventory')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'inventory' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => setSubTab('ledger')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'ledger' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Udhaar
          </button>
          <button
            onClick={() => setSubTab('profile')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'profile' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI 4-Column Architectural Metric Panel */}
          <div className="bg-white rounded-xl border border-stone-200/90 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/90 shadow-subtle grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
            <div
              onClick={() => setSubTab('orders')}
              className="p-5 hover:bg-stone-50/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-stone-500 text-xs font-mono uppercase tracking-wider">
                <span>Site Requisitions</span>
                <Clock className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
                {stats?.newOrdersCount ?? orders.filter((o) => o.status === 'PENDING').length}
              </div>
              <p className="text-[11px] text-stone-500 mt-1 flex items-center">
                <span>Awaiting dealer confirmation</span>
                <ArrowUpRight className="w-3 h-3 ml-1 text-stone-400" />
              </p>
            </div>

            <div
              onClick={() => setSubTab('deliveries')}
              className="p-5 hover:bg-stone-50/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-stone-500 text-xs font-mono uppercase tracking-wider">
                <span>Active Dispatches</span>
                <Truck className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
                {(deliveriesData?.stats?.readyCount || 0) + (deliveriesData?.stats?.onRoadCount || 0)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1 flex items-center">
                <span>Ready & In-Transit</span>
                <ArrowUpRight className="w-3 h-3 ml-1 text-stone-400" />
              </p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-stone-500 text-xs font-mono uppercase tracking-wider">
                <span>Today's Landed Sales</span>
                <TrendingUp className="w-3.5 h-3.5 text-stone-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
                ₹{(stats?.todaySales || 58000).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Gross yard orders value
              </p>
            </div>

            <div
              onClick={() => setSubTab('ledger')}
              className="p-5 hover:bg-stone-50/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-stone-500 text-xs font-mono uppercase tracking-wider">
                <span>Outstanding Udhaar</span>
                <IndianRupee className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
                ₹{(stats?.totalPendingUdhaar || 35000).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-stone-500 mt-1 flex items-center">
                <span>Customer credit to collect</span>
                <ArrowUpRight className="w-3 h-3 ml-1 text-stone-400" />
              </p>
            </div>
          </div>

          {/* Quick Operations Bar */}
          <div className="bg-stone-900 rounded-xl p-4 sm:p-5 text-stone-100 flex flex-col md:flex-row items-center justify-between gap-4 border border-stone-800 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-stone-100">Yard Counter & Logistics Operations</h3>
                <p className="text-xs text-stone-400">Process walk-in contractors, assign tractor trolleys, generate trip challans, and settle Udhaar</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsManualOrderModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-100 border border-stone-700 font-mono text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Walk-in Order</span>
              </button>
              <button
                onClick={() => {
                  setPaymentCustomerId('');
                  setPaymentOrderId('');
                  setPaymentAmount(0);
                  setIsPaymentModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-white text-stone-900 font-mono font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Enter Payment</span>
              </button>
              <button
                onClick={() => setSubTab('deliveries')}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 font-mono text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Trip Challans</span>
              </button>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Recent Yard Site Orders</h2>
                <p className="text-xs text-slate-500">Live feed of orders received via portal and counter</p>
              </div>
              <button
                onClick={() => setSubTab('orders')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
              >
                <span>View All ({orders.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((order) => {
                const orderTotal = order.finalTotal ?? order.totalAmount ?? 0;
                const custName = order.customer?.fullName || order.customer?.name || 'Customer';
                return (
                  <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-xs text-slate-900">{order.orderNumber}</span>
                        <span className="text-xs font-bold text-slate-700">({custName})</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                          {order.status}
                        </span>
                        {order.vehicleNumber && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            🚜 {order.vehicleNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {order.items?.map((i: any) => `${i.masterProductName} × ${i.quantity}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block">
                          ₹{orderTotal.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Due: ₹{(order.balancePending || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                        >
                          Accept
                        </button>
                      )}

                      {order.status === 'CONFIRMED' && (
                        <button
                          onClick={() => {
                            setDispatchOrder(order);
                            setDispatchChallanNo(`CHAL-${Date.now().toString().slice(-6)}`);
                            setDispatchInstructions(order.deliveryInstructions || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center space-x-1"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Dispatch</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCHES & DELIVERIES TAB */}
      {subTab === 'deliveries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Logistics & Dispatches Hub</h2>
              <p className="text-xs text-slate-500">Assign drivers, tractor trolleys, generate delivery challans and record site unloading</p>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                onClick={handleOpenAddVehicle}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <Truck className="w-3.5 h-3.5" />
                <span>+ Add Vehicle</span>
              </button>

              <button
                onClick={() => setIsManualOrderModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Walk-in Dispatch</span>
              </button>

              {/* Delivery Filter Pills */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl">
                {(['ALL', 'READY', 'ON_ROAD', 'DELIVERED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDeliveryFilter(filter)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      deliveryFilter === filter ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'ALL' && 'All'}
                    {filter === 'READY' && `Ready (${deliveriesData?.readyToDispatch?.length || 0})`}
                    {filter === 'ON_ROAD' && `On Road (${deliveriesData?.outForDelivery?.length || 0})`}
                    {filter === 'DELIVERED' && `Delivered (${deliveriesData?.deliveredRecently?.length || 0})`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Yard Delivery Fleet Showcase */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-stone-100 border border-stone-200 text-stone-700">
                  <Truck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-900">Yard Transport Fleet ({vehicles.length} Vehicles)</h3>
                  <p className="text-xs text-slate-500">Tractors, dumper tippers and pickup trucks available for delivery dispatches</p>
                </div>
              </div>
              <button
                onClick={handleOpenAddVehicle}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1 shadow-xs cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Vehicle</span>
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No vehicles added to your fleet yet. Click "+ Add Vehicle" to register your tractors and trucks.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5 hover:border-blue-400 hover:bg-white transition-all flex flex-col justify-between shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                          {v.vehicleNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : v.status === 'ON_TRIP'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {v.status === 'AVAILABLE' ? '🟢 Available' : v.status === 'ON_TRIP' ? '🔵 On Trip' : '🟡 In Repair'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-800">
                        {v.vehicleType === 'TRACTOR_TROLLEY' && '🚜 Tractor Trolley'}
                        {v.vehicleType === 'TIPPER_TRUCK' && '🚛 Dumper / Tipper'}
                        {v.vehicleType === 'CHHOTA_HATHI' && '🛻 Chhota Hathi / Ace'}
                        {v.vehicleType === 'PICKUP_TRUCK' && '🚚 Bolero Pickup'}
                      </div>

                      {v.capacityInfo && (
                        <div className="text-[11px] text-slate-500">
                          Capacity: <strong className="text-slate-700">{v.capacityInfo}</strong>
                        </div>
                      )}

                      <div className="text-xs text-slate-600 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Assigned Driver</span>
                          <strong className="text-slate-800 text-xs">{v.driverName || 'No Driver'}</strong>
                        </div>
                        {v.driverPhone && (
                          <a
                            href={`tel:${v.driverPhone}`}
                            className="p-1.5 rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            title="Call driver"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenEditVehicle(v)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(v.id, v.vehicleNumber)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1. Ready for Dispatch Section */}
          {(deliveryFilter === 'ALL' || deliveryFilter === 'READY') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Ready For Dispatch & Driver Assignment ({deliveriesData?.readyToDispatch?.length || 0})</span>
                </h3>
              </div>

              {deliveriesData?.readyToDispatch?.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-xl border border-stone-200 text-stone-500 text-xs">
                  No orders waiting for vehicle assignment right now.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {deliveriesData?.readyToDispatch?.map((ord: any) => {
                    const custName = ord.customer?.fullName || ord.customer?.name || 'Customer';
                    return (
                      <div
                        key={ord.id}
                        className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3 hover:border-stone-400 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-black text-slate-900">{ord.orderNumber}</span>
                            <h4 className="font-bold text-sm text-slate-800">{custName}</h4>
                            <p className="text-xs text-slate-500">{ord.deliveryAddress}</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                            CONFIRMED
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1">
                          {ord.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-slate-700">
                              <span>{item.masterProductName}</span>
                              <span className="font-bold">{item.quantity} {item.unit}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-semibold">
                            Site Contact: <a href={`tel:${ord.siteContactPhone}`} className="text-blue-600 font-bold">{ord.siteContactPhone}</a>
                          </span>
                          <button
                            onClick={() => {
                              setDispatchOrder(ord);
                              setDispatchChallanNo(`CHAL-${Date.now().toString().slice(-6)}`);
                              setDispatchInstructions(ord.deliveryInstructions || '');
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Assign Vehicle & Dispatch</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. On Road / In Transit Section */}
          {(deliveryFilter === 'ALL' || deliveryFilter === 'ON_ROAD') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span>Out For Delivery / On Road ({deliveriesData?.outForDelivery?.length || 0})</span>
                </h3>
              </div>

              {deliveriesData?.outForDelivery?.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-xl border border-stone-200 text-stone-500 text-xs">
                  No vehicles currently in transit to sites.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {deliveriesData?.outForDelivery?.map((ord: any) => {
                    const custName = ord.customer?.fullName || ord.customer?.name || 'Customer';
                    return (
                      <div
                        key={ord.id}
                        className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3 hover:border-stone-400 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-slate-900">{ord.orderNumber}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                Challan: {ord.deliveryChallanNo || 'N/A'}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-800">{custName}</h4>
                            <p className="text-xs text-slate-500">{ord.deliveryAddress}</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 animate-pulse">
                            IN TRANSIT
                          </span>
                        </div>

                        {/* Driver & Vehicle info banner */}
                        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 text-xs flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-black text-slate-900 flex items-center space-x-1">
                              <span>🚜 Vehicle:</span>
                              <span className="text-blue-800">{ord.vehicleNumber || 'Tractor Trolley'}</span>
                            </div>
                            <div className="text-slate-600">
                              Driver: <strong>{ord.driverName || 'Yard Driver'}</strong>
                            </div>
                          </div>
                          {ord.driverPhone && (
                            <a
                              href={`tel:${ord.driverPhone}`}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center space-x-1 hover:bg-blue-700"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call Driver</span>
                            </a>
                          )}
                        </div>

                        <div className="pt-1 flex items-center justify-between space-x-2">
                          <button
                            onClick={() => setChallanOrder(ord)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1 hover:bg-slate-50"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Trip Challan</span>
                          </button>

                          <button
                            onClick={() => {
                              setCompleteOrder(ord);
                              setReceivedByName(custName);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Delivered</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Delivered Recently */}
          {(deliveryFilter === 'ALL' || deliveryFilter === 'DELIVERED') && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Delivered & Completed Dispatches ({deliveriesData?.deliveredRecently?.length || 0})</span>
              </h3>

              <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
                {deliveriesData?.deliveredRecently?.map((ord: any) => {
                  const custName = ord.customer?.fullName || ord.customer?.name || 'Customer';
                  const orderTotal = ord.finalTotal ?? ord.totalAmount ?? 0;
                  return (
                    <div key={ord.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900">{ord.orderNumber}</span>
                          <span className="font-bold text-slate-700">{custName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            DELIVERED
                          </span>
                          {ord.deliveryChallanNo && (
                            <span className="text-[10px] text-slate-400">({ord.deliveryChallanNo})</span>
                          )}
                        </div>
                        <p className="text-slate-500">
                          {ord.items?.map((i: any) => `${i.masterProductName} × ${i.quantity}`).join(', ')} • {ord.deliveryAddress}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="font-black text-slate-900 block">₹{orderTotal.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Unloaded at Site</span>
                        </div>
                        <button
                          onClick={() => setChallanOrder(ord)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Slip</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ORDERS MANAGEMENT TAB */}
      {subTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900">Site Orders & Fulfillment</h2>
              <p className="text-xs text-slate-500">Manage incoming orders, dump deliveries and record payments</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsManualOrderModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Walk-in Order</span>
              </button>

              {/* Status Filter Pills */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
                {['ALL', 'PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedStatus === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search bar for fast operational access */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, customer name, mobile phone, site address or vehicle..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
            />
            {orderSearchQuery && (
              <button
                onClick={() => setOrderSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {orders.filter((order) => {
            const custName = order.customer?.fullName || order.customer?.name || '';
            const custPhone = order.customer?.phone || order.siteContactPhone || '';
            const q = orderSearchQuery.toLowerCase();
            return (
              !q ||
              order.orderNumber.toLowerCase().includes(q) ||
              custName.toLowerCase().includes(q) ||
              custPhone.includes(q) ||
              (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q)) ||
              (order.vehicleNumber && order.vehicleNumber.toLowerCase().includes(q))
            );
          }).length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-stone-500 text-xs">
              No orders found matching filter status "{selectedStatus}"{orderSearchQuery ? ` and query "${orderSearchQuery}"` : ''}.
            </div>
          ) : (
            <div className="space-y-4">
              {orders
                .filter((order) => {
                  const custName = order.customer?.fullName || order.customer?.name || '';
                  const custPhone = order.customer?.phone || order.siteContactPhone || '';
                  const q = orderSearchQuery.toLowerCase();
                  return (
                    !q ||
                    order.orderNumber.toLowerCase().includes(q) ||
                    custName.toLowerCase().includes(q) ||
                    custPhone.includes(q) ||
                    (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q)) ||
                    (order.vehicleNumber && order.vehicleNumber.toLowerCase().includes(q))
                  );
                })
                .map((order) => {
                const orderTotal = order.finalTotal ?? order.totalAmount ?? 0;
                const custName = order.customer?.fullName || order.customer?.name || 'Customer';
                const custPhone = order.customer?.phone || order.siteContactPhone;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4 hover:border-stone-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-sm font-black text-slate-900">{order.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                            {order.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.paymentStatus || 'PENDING'}
                          </span>
                          {order.deliveryChallanNo && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Challan: {order.deliveryChallanNo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Client: <strong>{custName}</strong> • Phone:{' '}
                          <a href={`tel:${custPhone}`} className="text-blue-600 font-bold">
                            {custPhone}
                          </a>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-base font-black text-slate-900">
                          ₹{orderTotal.toLocaleString('en-IN')}
                        </div>
                        <span className={`text-[11px] font-bold ${order.balancePending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {order.balancePending > 0 ? `Pending Balance: ₹${order.balancePending.toLocaleString('en-IN')}` : 'Full Amount Paid'}
                        </span>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 text-xs space-y-1.5">
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
                          Delivery Site: <strong>{order.deliveryAddress}</strong>
                        </span>
                        <span>
                          Freight: <strong>₹{order.deliveryCharge || 0}</strong>
                        </span>
                      </div>
                      {order.vehicleNumber && (
                        <div className="text-[11px] text-blue-700 pt-1 font-semibold flex items-center space-x-2">
                          <span>🚜 Vehicle: {order.vehicleNumber}</span>
                          {order.driverName && <span>• Driver: {order.driverName} ({order.driverPhone})</span>}
                        </div>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end space-x-2 pt-1 flex-wrap gap-y-2">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'REJECTED', 'Stock unavailable')}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs"
                          >
                            Accept Order
                          </button>
                        </>
                      )}

                      {order.status === 'CONFIRMED' && (
                        <button
                          onClick={() => {
                            setDispatchOrder(order);
                            setDispatchChallanNo(`CHAL-${Date.now().toString().slice(-6)}`);
                            setDispatchInstructions(order.deliveryInstructions || '');
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs flex items-center space-x-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Truck / Tractor</span>
                        </button>
                      )}

                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <>
                          <button
                            onClick={() => setChallanOrder(order)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center space-x-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Challan Slip</span>
                          </button>
                          <button
                            onClick={() => {
                              setCompleteOrder(order);
                              setReceivedByName(custName);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs flex items-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Dumped & Delivered</span>
                          </button>
                        </>
                      )}

                      {order.status === 'DELIVERED' && (
                        <button
                          onClick={() => setChallanOrder(order)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Challan</span>
                        </button>
                      )}

                      {order.balancePending > 0 && (
                        <button
                          onClick={() => {
                            setPaymentCustomerId(order.customerId);
                            setPaymentOrderId(order.id);
                            setPaymentAmount(order.balancePending);
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-xs flex items-center space-x-1"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>Record Payment</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* INVENTORY & PRICING TAB */}
      {subTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900">Yard Catalog & Inventory Rates</h2>
              <p className="text-xs text-stone-500">Live pricing, available stock balance, and tractor transport carriage rates</p>
            </div>
            <button
              onClick={() => setAddProductModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono font-medium text-xs flex items-center space-x-2 shadow-2xs transition-colors shrink-0 self-start sm:self-center cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Master SKU</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search yard items by material name, brand, or category..."
              value={inventorySearchQuery}
              onChange={(e) => setInventorySearchQuery(e.target.value)}
              className="w-full pl-10 pr-16 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono placeholder-stone-400 focus:outline-none focus:border-stone-800 shadow-2xs"
            />
            {inventorySearchQuery && (
              <button
                onClick={() => setInventorySearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-mono cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* High-Density Spreadsheet Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Material SKU & Brand</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Min Qty</th>
                    <th className="py-3 px-4 font-semibold">Stock Balance</th>
                    <th className="py-3 px-4 font-semibold text-right">Selling Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Carriage / Freight</th>
                    <th className="py-3 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products
                    .filter((p) => {
                      const q = inventorySearchQuery.toLowerCase();
                      return (
                        !q ||
                        p.masterProduct?.name.toLowerCase().includes(q) ||
                        p.masterProduct?.category?.name.toLowerCase().includes(q) ||
                        (p.masterProduct?.brand?.name && p.masterProduct.brand.name.toLowerCase().includes(q))
                      );
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900 text-xs">{p.masterProduct?.name}</div>
                          {p.masterProduct?.brand?.name && (
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">Brand: {p.masterProduct.brand.name}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-600 border border-stone-200">
                            {p.masterProduct?.category?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-700 tabular-nums">
                          {p.minOrderQty} {p.unit}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              p.stockQuantity > 20
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {p.stockQuantity} {p.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums">
                          ₹{p.sellingPrice.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-stone-500">/ {p.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-700 tabular-nums">
                          {p.deliveryCharge > 0 ? `₹${p.deliveryCharge.toLocaleString('en-IN')}` : 'Included'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setEditPrice(p.sellingPrice);
                              setEditStock(p.stockQuantity);
                              setEditDeliveryFee(p.deliveryCharge);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 font-mono text-[11px] transition-colors cursor-pointer"
                          >
                            Edit Rate
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* UDHAAR LEDGER TAB */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900">Customer Credit & Udhaar Passbook</h2>
              <p className="text-xs text-stone-500">Track local contractor trade credit, running dues and record offline settlements</p>
            </div>
            <div className="flex items-center space-x-3 self-end sm:self-center">
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <IndianRupee className="w-3.5 h-3.5 text-stone-200" />
                <span>+ Settle Udhaar</span>
              </button>
              <div className="text-right">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Total Outstanding</span>
                <span className="text-sm sm:text-base font-mono font-bold text-rose-700 tabular-nums">
                  ₹{(ledgerData?.totalReceivables || 35000).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Search bar for Udhaar ledger */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contractor / buyer by name or phone number..."
              value={ledgerSearchQuery}
              onChange={(e) => setLedgerSearchQuery(e.target.value)}
              className="w-full pl-10 pr-16 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono placeholder-stone-400 focus:outline-none focus:border-stone-800 shadow-2xs"
            />
            {ledgerSearchQuery && (
              <button
                onClick={() => setLedgerSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-mono cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* High-Density Passbook Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Contractor / Buyer</th>
                    <th className="py-3 px-4 font-semibold">Contact Mobile</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Purchased</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Settled</th>
                    <th className="py-3 px-4 font-semibold text-right">Outstanding Udhaar</th>
                    <th className="py-3 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(ledgerData?.customerLedgers || [])
                    .filter((c: any) => {
                      const q = ledgerSearchQuery.toLowerCase();
                      return !q || c.customerName.toLowerCase().includes(q) || (c.customerPhone && c.customerPhone.includes(q));
                    })
                    .map((c: any) => (
                      <tr key={c.customerId} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-stone-900">
                          {c.customerName}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-600">
                          {c.customerPhone || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-700 tabular-nums">
                          ₹{(c.totalPurchased || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 tabular-nums">
                          ₹{(c.totalPaid || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 tabular-nums">
                          ₹{(c.outstandingBalance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => openKhataStatement(c)}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-[11px] font-medium transition-colors cursor-pointer border border-stone-200 flex items-center space-x-1"
                              title="View Bahi-Khata passbook statement"
                            >
                              <FileText className="w-3 h-3 text-stone-500" />
                              <span>Passbook</span>
                            </button>
                            <button
                              onClick={() => {
                                setPaymentCustomerId(c.customerId);
                                setPaymentOrderId('');
                                setPaymentAmount(c.outstandingBalance > 0 ? c.outstandingBalance : 0);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-mono text-[11px] transition-colors cursor-pointer"
                            >
                              Settle
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STORE PROFILE & BRANDING TAB */}
      {subTab === 'profile' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6 max-w-2xl shadow-xs">
          <div>
            <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-stone-900">Dealer Yard Profile & Service Coverage</h2>
            <p className="text-xs text-stone-500 mt-1">Configure yard details and multi-district dispatch radius across Bihar</p>
          </div>

          {profileSaveSuccess && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Yard Profile & Service Coverage updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1">Business Yard Name</label>
              <input
                type="text"
                value={profBusinessName}
                onChange={(e) => setProfBusinessName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={profOwnerName}
                  onChange={(e) => setProfOwnerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={profGstin}
                  onChange={(e) => setProfGstin(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1">Yard Address / Depot Location</label>
              <textarea
                value={profAddress}
                onChange={(e) => setProfAddress(e.target.value)}
                rows={2}
                required
                className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1">Store Description / Material Specialization</label>
              <textarea
                value={profDescription}
                onChange={(e) => setProfDescription(e.target.value)}
                rows={3}
                placeholder="e.g. Authorized UltraTech & Jindal Panther distributor. Direct site dumping available."
                className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
              />
            </div>

            {/* Multi-District Delivery Coverage */}
            <div className="pt-2 border-t border-stone-100">
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-700 mb-1">
                Authorized Delivery Coverage Areas (Districts)
              </label>
              <p className="text-[11px] text-stone-500 mb-3">
                Your storefront inventory will be visible to contractors situated in these selected districts:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {districts.map((dist) => {
                  const isChecked = profServiceDistricts.includes(dist.id);
                  return (
                    <label
                      key={dist.id}
                      className={`flex items-center space-x-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-stone-900 bg-stone-50 font-medium text-stone-900'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            if (profServiceDistricts.length <= 1) {
                              alert('At least one service district is required');
                              return;
                            }
                            setProfServiceDistricts(profServiceDistricts.filter((id) => id !== dist.id));
                          } else {
                            setProfServiceDistricts([...profServiceDistricts, dist.id]);
                          }
                        }}
                        className="rounded border-stone-300 text-stone-900 focus:ring-0"
                      />
                      <span>{dist.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSavingProfile ? 'Saving Changes...' : 'Save Yard Profile & Coverage'}
            </button>
          </form>
        </div>
      )}

      {/* BAHI-KHATA / PASSBOOK STATEMENT DRAWER */}
      {khataCustomer && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-stone-900 text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-sm text-stone-900">{khataCustomer.customerName || 'Contractor'}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">Khata Ledger</span>
                  </div>
                  <p className="text-xs font-mono text-stone-500">{khataCustomer.customerPhone || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setKhataCustomer(null);
                  setKhataStatement(null);
                }}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Financial Summary Ribbon */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-stone-500">Total Billed</span>
                  <span className="text-sm font-mono font-bold text-stone-900 tabular-nums">
                    ₹{((khataStatement?.summary?.totalPurchased ?? khataCustomer.totalPurchased) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-stone-500">Total Settled</span>
                  <span className="text-sm font-mono font-bold text-emerald-700 tabular-nums">
                    ₹{((khataStatement?.summary?.totalPaid ?? khataCustomer.totalPaid) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-rose-600">Pending Udhaar</span>
                  <span className="text-sm font-mono font-bold text-rose-700 tabular-nums">
                    ₹{((khataStatement?.summary?.outstandingBalance ?? khataCustomer.outstandingBalance) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons: 1-Tap WhatsApp Reminder & Settle Payment */}
              <div className="flex items-center space-x-2">
                <a
                  href={`https://wa.me/91${(khataCustomer.customerPhone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                    `Namaste ${(khataCustomer.customerName || 'Contractor Ji')}, this is an account statement update from ${
                      profBusinessName || 'our dealer yard'
                    }. Your pending Udhaar balance is ₹${(
                      (khataStatement?.summary?.outstandingBalance ?? khataCustomer.outstandingBalance) || 0
                    ).toLocaleString('en-IN')}. Please settle at your earliest convenience. Dhanyawad!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-medium transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Statement</span>
                </a>
                <button
                  onClick={() => {
                    const balance = (khataStatement?.summary?.outstandingBalance ?? khataCustomer.outstandingBalance) || 0;
                    setPaymentCustomerId(khataCustomer.customerId);
                    setPaymentOrderId('');
                    setPaymentAmount(balance > 0 ? balance : 0);
                    setIsPaymentModalOpen(true);
                  }}
                  className="py-2 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Record Payment
                </button>
              </div>

              {/* Chronological Statement Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-stone-700 font-semibold">
                    Chronological Ledger Entries (Debit & Credit)
                  </h4>
                  <span className="text-[11px] font-mono text-stone-500">
                    {khataStatement?.transactions?.length || 0} Records
                  </span>
                </div>

                {isKhataLoading ? (
                  <div className="py-12 text-center text-xs font-mono text-stone-500">
                    Loading bahi-khata statement...
                  </div>
                ) : !khataStatement?.transactions || khataStatement.transactions.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-stone-400 border border-dashed border-stone-200 rounded-lg">
                    No transactions recorded for this contractor yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {khataStatement.transactions.map((tx: any) => {
                      const isDebit = tx.type === 'DEBIT_ORDER';
                      return (
                        <div
                          key={tx.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isDebit ? 'border-stone-200 bg-white' : 'border-emerald-200 bg-emerald-50/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                                    isDebit ? 'bg-stone-100 text-stone-700' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {isDebit ? 'DISPATCHED ORDER (DEBIT)' : `PAYMENT RECEIVED (${tx.paymentMethod})`}
                                </span>
                                <span className="text-[11px] font-mono text-stone-400">
                                  {tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                </span>
                              </div>

                              {isDebit && tx.items && tx.items.length > 0 && (
                                <p className="text-xs text-stone-600 font-mono mt-1">
                                  {tx.items.map((i: any) => `${i.quantity} ${i.unit || 'units'} ${i.productName}`).join(' • ')}
                                </p>
                              )}

                              {!isDebit && tx.referenceNo && (
                                <p className="text-xs text-emerald-700 font-mono mt-1">
                                  Ref: {tx.referenceNo} {tx.notes ? `• ${tx.notes}` : ''}
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-sm font-mono font-bold tabular-nums ${
                                  isDebit ? 'text-stone-900' : 'text-emerald-700'
                                }`}
                              >
                                {isDebit ? '-' : '+'}₹{(tx.amount || 0).toLocaleString('en-IN')}
                              </span>
                              {isDebit && (
                                <span className="block text-[10px] font-mono text-stone-400">
                                  Status: {tx.paymentStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. MANUAL ORDER MODAL */}
      {isManualOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-stone-200">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-900">Create Manual / Counter Requisition</h3>
                  <p className="text-xs text-stone-500">Record direct yard sales, contractor phone orders and immediate dispatches</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualOrderModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="p-6 overflow-y-auto space-y-5">
              {/* Customer Selector Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-semibold text-stone-900 uppercase tracking-wider">1. Buyer Information</label>
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setManualCustomerMode('EXISTING')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        manualCustomerMode === 'EXISTING' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500'
                      }`}
                    >
                      Existing Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualCustomerMode('NEW')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        manualCustomerMode === 'NEW' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500'
                      }`}
                    >
                      + New Walk-in / Phone
                    </button>
                  </div>
                </div>

                {manualCustomerMode === 'EXISTING' ? (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Select Yard Client</label>
                    <select
                      value={manualCustomerId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setManualCustomerId(cid);
                        const c = customers.find((cust) => cust.id === cid);
                        if (c) {
                          setManualCustomerAddress(c.address || '');
                          setManualSitePhone(c.phone || '');
                        }
                      }}
                      required
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg bg-white"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.phone}) - Udhaar Due: ₹{c.outstandingBalance || 0}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Customer / Contractor Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Shyam Bihari Builders"
                        value={manualCustomerName}
                        onChange={(e) => setManualCustomerName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="10-digit mobile"
                        value={manualCustomerPhone}
                        onChange={(e) => {
                          setManualCustomerPhone(e.target.value);
                          if (!manualSitePhone) setManualSitePhone(e.target.value);
                        }}
                        required
                        className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Site Delivery Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Plot 12, VIP Road, Allalpatti"
                      value={manualCustomerAddress}
                      onChange={(e) => setManualCustomerAddress(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Site Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="Supervisor contact number"
                      value={manualSitePhone}
                      onChange={(e) => setManualSitePhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Material Items Picker */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-semibold text-stone-900 uppercase tracking-wider">2. Bill of Materials</label>
                  <span className="text-xs text-stone-500 font-mono">{manualItems.length} items added</span>
                </div>

                <div className="flex gap-2">
                  <select
                    id="product-quick-add"
                    className="flex-1 px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.masterProduct?.name} - ₹{p.sellingPrice}/{p.unit} (Stock: {p.stockQuantity})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = (document.getElementById('product-quick-add') as HTMLSelectElement)?.value;
                      if (sel) handleAddManualItem(sel);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-stone-900 text-white text-xs font-mono flex items-center space-x-1 hover:bg-stone-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Items List */}
                {manualItems.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-stone-200 text-center text-xs text-stone-400 font-mono">
                    No materials added yet. Choose from your yard catalog above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {manualItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-xs gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-stone-900 block truncate">{item.name}</span>
                          <span className="text-[11px] text-stone-500 font-mono">Unit: {item.unit}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div>
                            <label className="block text-[10px] text-stone-400 font-mono">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                setManualItems(
                                  manualItems.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                                );
                              }}
                              className="w-16 px-2 py-1 text-xs border border-stone-200 rounded bg-white font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-stone-400 font-mono">Rate (₹)</label>
                            <input
                              type="number"
                              min="1"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setManualItems(
                                  manualItems.map((it, i) => (i === idx ? { ...it, unitPrice: val } : it))
                                );
                              }}
                              className="w-20 px-2 py-1 text-xs border border-stone-200 rounded bg-white font-mono font-bold"
                            />
                          </div>

                          <div className="text-right w-20">
                            <span className="block text-[10px] text-stone-400 font-mono">Total</span>
                            <span className="font-mono font-bold text-stone-900 tabular-nums">
                              ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                            className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Logistics & Dispatch Options */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <label className="text-xs font-mono font-semibold text-stone-900 uppercase tracking-wider">3. Carriage & Dispatch</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Carriage / Freight (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={manualDeliveryCharge}
                      onChange={(e) => setManualDeliveryCharge(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Initial Order Status</label>
                    <select
                      value={manualInitialStatus}
                      onChange={(e: any) => setManualInitialStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg bg-white"
                    >
                      <option value="CONFIRMED">CONFIRMED (Ready in Yard)</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY (Dispatch Now)</option>
                      <option value="DELIVERED">DELIVERED (Already Dumped)</option>
                    </select>
                  </div>
                </div>

                {/* Fleet Vehicle Quick Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-stone-700">Assign from Yard Fleet:</span>
                    <button
                      type="button"
                      onClick={() => handleOpenAddVehicle()}
                      className="text-[10px] text-stone-600 font-mono hover:underline cursor-pointer"
                    >
                      + Add New Vehicle
                    </button>
                  </div>
                  <select
                    onChange={(e) => {
                      const vid = e.target.value;
                      if (vid) {
                        const v = vehicles.find((veh) => veh.id === vid);
                        if (v) {
                          setManualVehicleNo(v.vehicleNumber);
                          setManualDriverName(v.driverName || '');
                          setManualDriverPhone(v.driverPhone || '');
                        }
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 bg-stone-50 rounded-lg mb-1 focus:outline-none focus:border-stone-800"
                  >
                    <option value="">-- Choose from {vehicles.length} yard fleet vehicles --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.vehicleType === 'TRACTOR_TROLLEY' ? '🚜 Tractor' : v.vehicleType === 'TIPPER_TRUCK' ? '🚛 Tipper' : '🛻 Mini Truck'}) • {v.driverName || 'No Driver'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Vehicle No. (Tractor/407)</label>
                    <input
                      type="text"
                      placeholder="e.g. BR-07-GA-1234"
                      value={manualVehicleNo}
                      onChange={(e) => setManualVehicleNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Driver Name</label>
                    <input
                      type="text"
                      placeholder="Driver name"
                      value={manualDriverName}
                      onChange={(e) => setManualDriverName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Driver Phone</label>
                    <input
                      type="tel"
                      placeholder="Driver contact"
                      value={manualDriverPhone}
                      onChange={(e) => setManualDriverPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono font-semibold text-stone-900 uppercase tracking-wider">4. Payment & Billing</label>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 font-mono">Total Order: </span>
                    <span className="text-sm sm:text-base font-mono font-bold text-stone-900 tabular-nums">
                      ₹{manualFinalTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Amount Paid Upfront (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={manualFinalTotal}
                      value={manualAmountPaid}
                      onChange={(e) => setManualAmountPaid(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone-200 rounded-lg"
                    />
                    <span className="text-[10px] font-mono text-stone-500 mt-0.5 block">
                      Balance (Udhaar): ₹{Math.max(0, manualFinalTotal - manualAmountPaid).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Payment Mode</label>
                    <select
                      value={manualPaymentMode}
                      onChange={(e: any) => setManualPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg bg-white"
                    >
                      <option value="CASH">Cash at Counter</option>
                      <option value="UPI_DIRECT">Direct UPI to Dealer</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="UDHAAR">Full Udhaar (Credit)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsManualOrderModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualItems.length === 0}
                  className="flex-1 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono font-semibold shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  Confirm & Create Order (₹{manualFinalTotal.toLocaleString('en-IN')})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MANUAL PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-900">Record Manual Payment</h3>
                  <p className="text-xs text-stone-500">Record cash, UPI, bank transfer, or settle Udhaar credit</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Customer / Contractor</label>
                <select
                  value={paymentCustomerId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setPaymentCustomerId(cid);
                    setPaymentOrderId(''); // Reset linked order when customer changes
                    const c = customers.find((cust) => cust.id === cid);
                    if (c && c.outstandingBalance > 0) {
                      setPaymentAmount(c.outstandingBalance);
                    } else {
                      setPaymentAmount(0);
                    }
                  }}
                  required
                  className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone}) - Udhaar Due: ₹{(c.outstandingBalance || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Linked Order (ONLY shown for selected customer) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">Linked Order (Optional)</label>
                  {paymentCustomerId && (
                    <span className="text-[10px] text-stone-500 font-mono">
                      {orders.filter((o) => o.customerId === paymentCustomerId).length} Order(s) for this Customer
                    </span>
                  )}
                </div>

                {!paymentCustomerId ? (
                  <select
                    disabled
                    className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg bg-stone-100 text-stone-400 cursor-not-allowed"
                  >
                    <option>-- Select a customer above first to view orders --</option>
                  </select>
                ) : (
                  <select
                    value={paymentOrderId}
                    onChange={(e) => {
                      const oid = e.target.value;
                      setPaymentOrderId(oid);
                      if (oid) {
                        const ord = orders.find((o) => o.id === oid && o.customerId === paymentCustomerId);
                        if (ord) {
                          setPaymentAmount(ord.balancePending > 0 ? ord.balancePending : ord.finalTotal || ord.totalAmount);
                        }
                      } else {
                        const c = customers.find((cust) => cust.id === paymentCustomerId);
                        if (c && c.outstandingBalance > 0) {
                          setPaymentAmount(c.outstandingBalance);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="">
                      General Udhaar Khata Settlement (Total Due: ₹{(customers.find((c) => c.id === paymentCustomerId)?.outstandingBalance || 0).toLocaleString('en-IN')})
                    </option>
                    {orders.filter((o) => o.customerId === paymentCustomerId).length === 0 ? (
                      <option disabled value="__none__">
                        (No specific site orders found for this customer)
                      </option>
                    ) : (
                      orders
                        .filter((o) => o.customerId === paymentCustomerId)
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.orderNumber} • ₹{(o.finalTotal || o.totalAmount).toLocaleString('en-IN')} (Due: ₹{(o.balancePending || 0).toLocaleString('en-IN')}) - {o.status}
                          </option>
                        ))
                    )}
                  </select>
                )}
              </div>

              {/* Order Info Badge if a specific order is selected */}
              {paymentOrderId && paymentCustomerId && (() => {
                const ord = orders.find((o) => o.id === paymentOrderId && o.customerId === paymentCustomerId);
                if (!ord) return null;
                return (
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-stone-900">
                      <span>Order {ord.orderNumber}:</span>
                      <span className="font-mono text-stone-900">₹{(ord.finalTotal || ord.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 text-[11px]">
                      <span>Payment Status: <strong className="uppercase font-semibold">{ord.paymentStatus || 'PENDING'}</strong></span>
                      <span>Pending Due: <strong className="text-stone-900 font-mono font-semibold">₹{(ord.balancePending || 0).toLocaleString('en-IN')}</strong></span>
                    </div>
                    {ord.items?.length > 0 && (
                      <div className="text-[10px] text-stone-500 truncate pt-1 border-t border-stone-200">
                        Items: {ord.items.map((i: any) => `${i.masterProductName} (${i.quantity} ${i.unit})`).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* General Udhaar Info Badge if customer selected but no order chosen */}
              {!paymentOrderId && paymentCustomerId && (() => {
                const c = customers.find((cust) => cust.id === paymentCustomerId);
                if (!c) return null;
                return (
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-stone-900 font-semibold block">{c.fullName}</span>
                      <span className="text-[10px] text-stone-500">Unsettled contractor credit balance</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-stone-500 block">Total Udhaar</span>
                      <span className="font-mono font-semibold text-stone-900 text-sm">
                        ₹{(c.outstandingBalance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 text-xs font-mono font-semibold text-stone-900 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e: any) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="CASH">Cash on Site/Counter</option>
                    <option value="UPI_DIRECT">Direct UPI to Dealer</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UDHAAR">Udhaar Adjustment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">UTR / Ref Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-1294828194 or Cheque #54192"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash to yard manager"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs"
                >
                  Confirm & Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ASSIGN VEHICLE & DISPATCH MODAL */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-900">Dispatch Order for Delivery</h3>
                  <p className="text-xs font-mono text-stone-500">{dispatchOrder.orderNumber}</p>
                </div>
              </div>
              <button onClick={() => setDispatchOrder(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchDelivery} className="space-y-3.5">
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs space-y-1">
                <div className="font-semibold text-stone-900">
                  Client: {dispatchOrder.customer?.fullName || dispatchOrder.customer?.name}
                </div>
                <div className="text-stone-600">Site: {dispatchOrder.deliveryAddress}</div>
                <div className="text-stone-600 font-mono">Site Phone: {dispatchOrder.siteContactPhone}</div>
              </div>

              {/* Select from Yard Fleet */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">Assign from Yard Fleet</label>
                  <button
                    type="button"
                    onClick={() => handleOpenAddVehicle()}
                    className="text-[10px] text-stone-900 font-semibold hover:underline cursor-pointer"
                  >
                    + Add New Vehicle
                  </button>
                </div>
                <select
                  onChange={(e) => {
                    const vid = e.target.value;
                    if (vid) {
                      const v = vehicles.find((veh) => veh.id === vid);
                      if (v) {
                        setDispatchVehicleNo(v.vehicleNumber);
                        setDispatchDriverName(v.driverName || '');
                        setDispatchDriverPhone(v.driverPhone || '');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-medium border border-stone-200 bg-stone-50 rounded-lg mb-1 focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="">-- Choose vehicle from your fleet ({vehicles.length}) --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.vehicleType === 'TRACTOR_TROLLEY' ? 'Tractor' : v.vehicleType === 'TIPPER_TRUCK' ? 'Tipper' : 'Mini Truck'}) • Driver: {v.driverName || 'None'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Vehicle / Tractor Number</label>
                <input
                  type="text"
                  placeholder="e.g. BR-07-GA-9412"
                  value={dispatchVehicleNo}
                  onChange={(e) => setDispatchVehicleNo(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-mono font-semibold uppercase border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Manoj Driver"
                    value={dispatchDriverName}
                    onChange={(e) => setDispatchDriverName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Driver Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={dispatchDriverPhone}
                    onChange={(e) => setDispatchDriverPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-mono font-medium border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Delivery Challan / Slip No.</label>
                <input
                  type="text"
                  value={dispatchChallanNo}
                  onChange={(e) => setDispatchChallanNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Driver Special Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Unload sand near north pillar. Collect balance cash from supervisor."
                  value={dispatchInstructions}
                  onChange={(e) => setDispatchInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setDispatchOrder(null)}
                  className="flex-1 py-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 shadow-xs"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CONFIRM DELIVERED MODAL */}
      {completeOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <h3 className="font-semibold text-sm text-stone-900">Confirm Site Delivery</h3>
              <button onClick={() => setCompleteOrder(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteDelivery} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Order</label>
                <div className="text-xs font-mono font-semibold text-stone-900">{completeOrder.orderNumber}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Received By (Name / Role)</label>
                <input
                  type="text"
                  placeholder="e.g. Site Supervisor Amitesh"
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Delivery / Unloading Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 100 bags stacked inside covered shed. No damages."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setCompleteOrder(null)}
                  className="flex-1 py-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 shadow-xs"
                >
                  Mark Delivered
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. PRINT / VIEW DELIVERY CHALLAN MODAL */}
      {challanOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 print:hidden">
              <span className="font-semibold text-sm text-stone-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-stone-700" />
                <span>Delivery Challan / Trip Memo</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold flex items-center space-x-1.5 hover:bg-stone-800 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Memo</span>
                </button>
                <button onClick={() => setChallanOrder(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Slip Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-stone-900 font-sans" id="printable-challan">
              {/* Slip Header */}
              <div className="border-b-2 border-stone-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">{profBusinessName || 'Gupta Building Materials'}</h2>
                  <p className="text-xs text-stone-600 font-medium">{profAddress || 'Donar Chowk, Darbhanga, Bihar'}</p>
                  <p className="text-xs text-stone-600 font-mono">GSTIN: <strong className="font-semibold">{profGstin || '10AAACG1234F1Z5'}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">DELIVERY CHALLAN</span>
                  <span className="text-sm font-semibold font-mono text-stone-900 block">{challanOrder.deliveryChallanNo || 'CHAL-TRIP'}</span>
                  <span className="text-xs text-stone-500 font-mono">Date: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Trip & Consignee Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <span className="font-semibold text-stone-500 uppercase text-[10px] block mb-1">CONSIGNEE / SITE</span>
                  <div className="font-semibold text-stone-900">{challanOrder.customer?.fullName || challanOrder.customer?.name}</div>
                  <div className="text-stone-600 mt-0.5">{challanOrder.deliveryAddress}</div>
                  <div className="text-stone-600 font-mono">Phone: {challanOrder.siteContactPhone}</div>
                </div>

                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <span className="font-semibold text-stone-500 uppercase text-[10px] block mb-1">TRANSPORT / VEHICLE</span>
                  <div className="font-semibold text-stone-900 font-mono">Vehicle: {challanOrder.vehicleNumber || 'Tractor Trolley'}</div>
                  <div className="text-stone-600">Driver: {challanOrder.driverName || 'Yard Driver'} ({challanOrder.driverPhone || 'N/A'})</div>
                  <div className="text-stone-600 font-mono">Order Ref: <strong className="font-semibold">{challanOrder.orderNumber}</strong></div>
                </div>
              </div>

              {/* Material Items Table */}
              <table className="w-full text-xs text-left border border-stone-200 rounded-lg overflow-hidden">
                <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Material Description</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Quantity Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {challanOrder.items?.map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td className="py-2.5 px-3 text-stone-400 font-sans">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-stone-900">{item.masterProductName}</td>
                      <td className="py-2.5 px-3 text-stone-600">{item.unit}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-stone-900">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Instructions & Signatures */}
              <div className="space-y-4 pt-2">
                <div className="text-[11px] text-stone-500 italic">
                  * Note: Materials inspected at yard gate. Unloading acknowledgement required at delivery site.
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-stone-200 text-center text-xs">
                  <div>
                    <div className="border-t border-dashed border-stone-400 pt-1 text-stone-600 font-medium">
                      Authorized Signatory (Dealer / Yard)
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-dashed border-stone-400 pt-1 text-stone-600 font-medium">
                      Customer / Site Receiver Signature
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADD MASTER PRODUCT MODAL */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-xl border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-semibold text-sm text-stone-900">Add Material from Master Catalog</h3>
                <p className="text-xs text-stone-500">Pick from {masterProducts.length} verified standard materials</p>
              </div>
              <button
                onClick={() => setAddProductModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">Category Filter</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setAddCatalogCategory('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      addCatalogCategory === 'all'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    All ({masterProducts.length})
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAddCatalogCategory(c.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        addCatalogCategory === c.id
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search material or brand (e.g. UltraTech, Tata Tiscon, Balu, Gitti)..."
                  value={addCatalogSearch}
                  onChange={(e) => setAddCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Select Material SKU ({filteredMasterProducts.length} matches)
                </label>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-stone-200 divide-y divide-stone-100 bg-stone-50/30">
                  {filteredMasterProducts.map((mp) => {
                    const isSelected = mp.id === selectedMasterId;
                    const alreadyInStore = products.some((p) => p.masterProductId === mp.id);
                    return (
                      <div
                        key={mp.id}
                        onClick={() => setSelectedMasterId(mp.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-stone-100 border-l-2 border-l-stone-900' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-stone-900 truncate">{mp.name}</span>
                            {mp.brand && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                                {mp.brand.name}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600">
                              {mp.category?.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 font-mono">
                            Unit: <strong className="text-stone-800 font-semibold">{mp.defaultUnit}</strong>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {alreadyInStore && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                              In Store
                            </span>
                          )}
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-stone-900 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form id="add-product-form" onSubmit={handleAddProduct} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Selling Price (₹ per {selectedMasterProduct?.defaultUnit || 'Unit'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={newPrice}
                      onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono font-semibold border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Initial Available Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newStock}
                      onChange={(e) => setNewStock(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono font-semibold border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Min Order Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newMinOrder}
                      onChange={(e) => setNewMinOrder(parseFloat(e.target.value) || 1)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono font-semibold border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Delivery Charge / Freight (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newDeliveryFee}
                      onChange={(e) => setNewDeliveryFee(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono font-semibold border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-stone-200 flex items-center space-x-2 bg-stone-50">
              <button
                type="button"
                onClick={() => setAddProductModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-product-form"
                disabled={!selectedMasterId}
                className="flex-1 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 shadow-xs disabled:opacity-50"
              >
                Add Material to My Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EDIT RATE & STOCK MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-900">Update Rate & Stock</h3>
                  <p className="text-xs text-stone-500 truncate max-w-[240px]">
                    {editingProduct.masterProduct?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Selling Price (₹ per {editingProduct.unit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Available Stock ({editingProduct.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Freight / Trip (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={editDeliveryFee}
                      onChange={(e) => setEditDeliveryFee(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProduct}
                  className="flex-1 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 shadow-xs disabled:opacity-50"
                >
                  {isUpdatingProduct ? 'Saving...' : 'Save Rate & Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. ADD / EDIT VEHICLE MODAL */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-stone-200">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-900 border border-stone-200">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-900">
                    {editingVehicle ? 'Edit Vehicle Details' : 'Add Vehicle to Yard Fleet'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Register tractors, dumper tippers and assign default drivers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Vehicle Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. BR-07-T-8899"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 text-xs font-mono font-semibold uppercase border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="TRACTOR_TROLLEY">🚜 Tractor Trolley</option>
                    <option value="TIPPER_TRUCK">🚛 Dumper / Tipper Truck</option>
                    <option value="CHHOTA_HATHI">🛻 Chhota Hathi / Tata Ace</option>
                    <option value="PICKUP_TRUCK">🚚 Bolero Pickup Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Status
                  </label>
                  <select
                    value={vehicleStatus}
                    onChange={(e) => setVehicleStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="AVAILABLE">Available in Yard</option>
                    <option value="ON_TRIP">On Delivery Trip</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Default Driver Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramvilas Paswan"
                    value={vehicleDriverName}
                    onChange={(e) => setVehicleDriverName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Driver Mobile Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={vehicleDriverPhone}
                    onChange={(e) => setVehicleDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Load Capacity (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100 Bags Cement / 150 CFT Sand / 3 Tonnes"
                  value={vehicleCapacity}
                  onChange={(e) => setVehicleCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVehicle}
                  className="flex-1 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSavingVehicle ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add to Yard Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
