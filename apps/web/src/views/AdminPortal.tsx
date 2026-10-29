import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useDistrict } from '../lib/district-context';
import {
  Shield,
  TrendingUp,
  Store,
  Users,
  Package,
  MapPin,
  CheckCircle,
  XCircle,
  Plus,
  KeyRound,
  ExternalLink,
  X,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Tag,
  Wrench,
  Truck,
  Phone,
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
  Building,
  UserCheck,
  CreditCard,
  Eye
} from 'lucide-react';

interface AdminPortalProps {
  subTab: 'overview' | 'suppliers' | 'consumers' | 'orders' | 'payments' | 'users' | 'catalog';
  setSubTab: (tab: 'overview' | 'suppliers' | 'consumers' | 'orders' | 'payments' | 'users' | 'catalog') => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ subTab, setSubTab }) => {
  const { user, switchPersona, isDemoMode, login } = useAuth();
  const { districts } = useDistrict();

  const [metricsData, setMetricsData] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Admin Direct Login State
  const [adminPhone, setAdminPhone] = useState('9999999999');
  const [adminPass, setAdminPass] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  // Orders Management & Rescue State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [fixingOrder, setFixingOrder] = useState<any | null>(null);
  const [fixStatus, setFixStatus] = useState('');
  const [fixAddress, setFixAddress] = useState('');
  const [fixSitePhone, setFixSitePhone] = useState('');
  const [fixVehicle, setFixVehicle] = useState('');
  const [fixDriverName, setFixDriverName] = useState('');
  const [fixDriverPhone, setFixDriverPhone] = useState('');
  const [fixChallan, setFixChallan] = useState('');
  const [fixFinalTotal, setFixFinalTotal] = useState<number>(0);
  const [fixBalancePending, setFixBalancePending] = useState<number>(0);
  const [fixPaymentStatus, setFixPaymentStatus] = useState('PENDING');
  const [isSavingOrderFix, setIsSavingOrderFix] = useState(false);

  // Consumers / Buyers State
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustDistrictId, setEditCustDistrictId] = useState('');
  const [adjustingCustomer, setAdjustingCustomer] = useState<any | null>(null);
  const [adjNewBalance, setAdjNewBalance] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('');

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserRole, setEditUserRole] = useState<'CUSTOMER' | 'SUPPLIER' | 'ADMIN'>('CUSTOMER');
  const [editUserMustChangePassword, setEditUserMustChangePassword] = useState(false);
  const [editUserNewPassword, setEditUserNewPassword] = useState('');

  // Supplier Edit & Yard Product Override State
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [editSupBusinessName, setEditSupBusinessName] = useState('');
  const [editSupOwnerName, setEditSupOwnerName] = useState('');
  const [editSupPhone, setEditSupPhone] = useState('');
  const [editSupAddress, setEditSupAddress] = useState('');
  const [editSupDistrictId, setEditSupDistrictId] = useState('');
  const [editSupGstin, setEditSupGstin] = useState('');
  const [editSupStatus, setEditSupStatus] = useState('ACTIVE');
  const [editSupRating, setEditSupRating] = useState(4.8);
  const [editSupDescription, setEditSupDescription] = useState('');

  const [inspectingSupplier, setInspectingSupplier] = useState<any | null>(null);
  const [yardProducts, setYardProducts] = useState<any[]>([]);
  const [yardProductsLoading, setYardProductsLoading] = useState(false);
  const [editingYardProduct, setEditingYardProduct] = useState<any | null>(null);
  const [editYardPrice, setEditYardPrice] = useState<number>(0);
  const [editYardStock, setEditYardStock] = useState<number>(0);
  const [editYardDeliveryFee, setEditYardDeliveryFee] = useState<number>(0);
  const [editYardMinOrderQty, setEditYardMinOrderQty] = useState<number>(1);
  const [editYardIsAvailable, setEditYardIsAvailable] = useState(true);

  // Payments & Financial Audit State
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');

  // Master Catalog Filter States
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [catalogBrand, setCatalogBrand] = useState('all');

  // Add Master Product Form State
  const [isAddingProd, setIsAddingProd] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('BAG');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Edit Master Product Form State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('');
  const [editProdBrand, setEditProdBrand] = useState('');
  const [editProdUnit, setEditProdUnit] = useState('BAG');
  const [editProdDesc, setEditProdDesc] = useState('');

  // Onboard Supplier Form State
  const [isOnboardingSupplier, setIsOnboardingSupplier] = useState(false);
  const [supPhone, setSupPhone] = useState('');
  const [supTempPassword, setSupTempPassword] = useState('klink@2026');
  const [supBusinessName, setSupBusinessName] = useState('');
  const [supOwnerName, setSupOwnerName] = useState('');
  const [supDistrictId, setSupDistrictId] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supGstin, setSupGstin] = useState('');
  const [supLogoUrl, setSupLogoUrl] = useState('');
  const [supDescription, setSupDescription] = useState('');
  const [createdCredentialsSlip, setCreatedCredentialsSlip] = useState<any | null>(null);

  const loadMetrics = async () => {
    try {
      const res = await apiFetch<any>('/admin/metrics');
      setMetricsData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await apiFetch<any>('/admin/suppliers');
      setSuppliers(res.suppliers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCatalog = async () => {
    try {
      const [mpRes, catRes, brandRes] = await Promise.all([
        apiFetch<any>('/catalog/master-products'),
        apiFetch<any>('/catalog/categories'),
        apiFetch<any>('/catalog/brands')
      ]);
      setMasterProducts(mpRes.masterProducts || []);
      setCategories(catRes.categories || []);
      setBrands(brandRes.brands || []);
      if (catRes.categories?.[0] && !newProdCategory) {
        setNewProdCategory(catRes.categories[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      let url = '/admin/orders';
      const params = new URLSearchParams();
      if (orderSearch.trim()) params.set('search', orderSearch.trim());
      if (orderStatusFilter !== 'ALL') params.set('status', orderStatusFilter);
      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;
      const res = await apiFetch<any>(url);
      setOrders(res.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      let url = '/admin/customers';
      if (customerSearch.trim()) url += `?search=${encodeURIComponent(customerSearch.trim())}`;
      const res = await apiFetch<any>(url);
      setCustomers(res.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      let url = '/admin/users';
      if (userSearch.trim()) url += `?search=${encodeURIComponent(userSearch.trim())}`;
      const res = await apiFetch<any>(url);
      setUsersList(res.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadYardProducts = async (supplierId: string) => {
    setYardProductsLoading(true);
    try {
      const res = await apiFetch<any>(`/admin/suppliers/${supplierId}/products`);
      setYardProducts(res.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setYardProductsLoading(false);
    }
  };

  const loadPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await apiFetch<any>('/admin/payments');
      setPayments(res.payments || []);
    } catch (e) {
      console.error('Failed to load payments:', e);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This will adjust the customer ledger upon next transaction.')) {
      return;
    }
    try {
      await apiFetch(`/admin/payments/${paymentId}`, { method: 'DELETE' });
      await loadPayments();
      await loadMetrics();
    } catch (e: any) {
      alert(e.message || 'Failed to delete payment record');
    }
  };

  const handleToggleDistrict = async (districtId: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/geo/districts/${districtId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus })
      });
      await loadMetrics();
    } catch (e: any) {
      alert(e.message || 'Failed to toggle district status');
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      if (isDemoMode) {
        switchPersona('ADMIN');
      }
      return;
    }
    loadMetrics();
    loadSuppliers();
    loadCatalog();
    loadOrders();
    loadCustomers();
    loadUsers();
    loadPayments();
  }, [user, isDemoMode]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      if (subTab === 'orders') loadOrders();
      if (subTab === 'consumers') loadCustomers();
      if (subTab === 'users') loadUsers();
      if (subTab === 'suppliers') loadSuppliers();
      if (subTab === 'payments') loadPayments();
    }
  }, [subTab, orderStatusFilter]);

  useEffect(() => {
    if (districts.length > 0 && !supDistrictId) {
      setSupDistrictId(districts[0].id);
    }
  }, [districts]);

  const handleToggleSupplierStatus = async (supplierId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiFetch(`/admin/suppliers/${supplierId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      loadSuppliers();
      loadMetrics();
    } catch (e: any) {
      alert(e.message || 'Failed to update supplier status');
    }
  };

  const handleCreateMasterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdCategory) return;

    try {
      await apiFetch('/catalog/master-products', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: newProdCategory,
          brandId: newProdBrand || undefined,
          name: newProdName,
          defaultUnit: newProdUnit,
          description: newProdDesc
        })
      });
      setIsAddingProd(false);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdBrand('');
      loadCatalog();
    } catch (e: any) {
      alert(e.message || 'Failed to create master product');
    }
  };

  const handleOpenEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);
    setEditProdCategory(prod.categoryId);
    setEditProdBrand(prod.brandId || '');
    setEditProdUnit(prod.defaultUnit);
    setEditProdDesc(prod.description || '');
  };

  const handleUpdateMasterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await apiFetch(`/catalog/master-products/${editingProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editProdName,
          categoryId: editProdCategory,
          brandId: editProdBrand ? editProdBrand : null,
          defaultUnit: editProdUnit,
          description: editProdDesc
        })
      });
      setEditingProduct(null);
      loadCatalog();
    } catch (e: any) {
      alert(e.message || 'Failed to update master product');
    }
  };

  const handleDeleteMasterProduct = async (prodId: string, prodName: string) => {
    if (!confirm(`Are you sure you want to deactivate "${prodName}" from the master catalogue?`)) {
      return;
    }
    try {
      await apiFetch(`/catalog/master-products/${prodId}`, {
        method: 'DELETE'
      });
      loadCatalog();
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate product');
    }
  };

  const handleOnboardSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supPhone || !supBusinessName || !supOwnerName || !supDistrictId || !supAddress) {
      alert('Please fill all required supplier fields');
      return;
    }

    try {
      const res = await apiFetch<any>('/admin/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          phone: supPhone,
          temporaryPassword: supTempPassword,
          businessName: supBusinessName,
          ownerName: supOwnerName,
          districtId: supDistrictId,
          address: supAddress,
          gstin: supGstin || undefined,
          logoUrl: supLogoUrl || undefined,
          description: supDescription || undefined
        })
      });

      setIsOnboardingSupplier(false);
      setCreatedCredentialsSlip({
        businessName: supBusinessName,
        phone: supPhone,
        temporaryPassword: supTempPassword,
        district: districts.find((d) => d.id === supDistrictId)?.name || 'Darbhanga'
      });

      // Reset form
      setSupPhone('');
      setSupBusinessName('');
      setSupOwnerName('');
      setSupAddress('');
      setSupGstin('');
      setSupLogoUrl('');
      setSupDescription('');
      
      loadSuppliers();
      loadMetrics();
    } catch (e: any) {
      alert(e.message || 'Failed to onboard supplier');
    }
  };

  // Founder Order Override Handlers
  const handleOpenFixOrder = (order: any) => {
    setFixingOrder(order);
    setFixStatus(order.status);
    setFixAddress(order.deliveryAddress || '');
    setFixSitePhone(order.siteContactPhone || '');
    setFixVehicle(order.vehicleNumber || '');
    setFixDriverName(order.driverName || '');
    setFixDriverPhone(order.driverPhone || '');
    setFixChallan(order.deliveryChallanNo || '');
    setFixFinalTotal(order.finalTotal || 0);
    setFixBalancePending(order.balancePending || 0);
    setFixPaymentStatus(order.paymentStatus || 'PENDING');
  };

  const handleSaveOrderFix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixingOrder) return;
    setIsSavingOrderFix(true);
    try {
      await apiFetch(`/admin/orders/${fixingOrder.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: fixStatus,
          deliveryAddress: fixAddress,
          siteContactPhone: fixSitePhone,
          vehicleNumber: fixVehicle,
          driverName: fixDriverName,
          driverPhone: fixDriverPhone,
          deliveryChallanNo: fixChallan,
          finalTotal: Number(fixFinalTotal),
          balancePending: Number(fixBalancePending),
          paymentStatus: fixPaymentStatus
        })
      });
      setFixingOrder(null);
      loadOrders();
      loadMetrics();
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    } finally {
      setIsSavingOrderFix(false);
    }
  };

  // Founder Supplier Edit Handlers
  const handleOpenEditSupplier = (sup: any) => {
    setEditingSupplier(sup);
    setEditSupBusinessName(sup.businessName || '');
    setEditSupOwnerName(sup.ownerName || '');
    setEditSupPhone(sup.phone || '');
    setEditSupAddress(sup.address || '');
    setEditSupDistrictId(sup.districtId || '');
    setEditSupGstin(sup.gstin || '');
    setEditSupStatus(sup.status || 'ACTIVE');
    setEditSupRating(sup.rating || 4.8);
    setEditSupDescription(sup.description || '');
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    try {
      await apiFetch(`/admin/suppliers/${editingSupplier.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          businessName: editSupBusinessName,
          ownerName: editSupOwnerName,
          phone: editSupPhone,
          address: editSupAddress,
          districtId: editSupDistrictId,
          gstin: editSupGstin,
          status: editSupStatus,
          rating: Number(editSupRating),
          description: editSupDescription
        })
      });
      setEditingSupplier(null);
      loadSuppliers();
    } catch (err: any) {
      alert(err.message || 'Failed to update supplier profile');
    }
  };

  // Founder Inspect Yard Products
  const handleInspectYard = (sup: any) => {
    setInspectingSupplier(sup);
    loadYardProducts(sup.id);
  };

  const handleOpenEditYardProduct = (prod: any) => {
    setEditingYardProduct(prod);
    setEditYardPrice(prod.sellingPrice);
    setEditYardStock(prod.stockQuantity);
    setEditYardDeliveryFee(prod.deliveryFee || 0);
    setEditYardMinOrderQty(prod.minOrderQty || 1);
    setEditYardIsAvailable(prod.isAvailable);
  };

  const handleSaveYardProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYardProduct) return;
    try {
      await apiFetch(`/admin/supplier-products/${editingYardProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sellingPrice: Number(editYardPrice),
          stockQuantity: Number(editYardStock),
          deliveryFee: Number(editYardDeliveryFee),
          minOrderQty: Number(editYardMinOrderQty),
          isAvailable: editYardIsAvailable
        })
      });
      setEditingYardProduct(null);
      if (inspectingSupplier) {
        loadYardProducts(inspectingSupplier.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update yard product');
    }
  };

  // Founder Customer Edit & Udhaar Adjustment Handlers
  const handleOpenEditCustomer = (cust: any) => {
    setEditingCustomer(cust);
    setEditCustName(cust.fullName || '');
    setEditCustPhone(cust.phone || '');
    setEditCustDistrictId(cust.districtId || '');
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await apiFetch(`/admin/customers/${editingCustomer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editCustName,
          phone: editCustPhone,
          districtId: editCustDistrictId
        })
      });
      setEditingCustomer(null);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to update customer');
    }
  };

  const handleOpenAdjustBalance = (cust: any) => {
    setAdjustingCustomer(cust);
    setAdjNewBalance(cust.outstandingBalance || 0);
    setAdjReason('');
  };

  const handleSaveBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingCustomer) return;
    if (!adjReason.trim()) {
      alert('Please provide an audit reason for the balance adjustment');
      return;
    }
    try {
      await apiFetch(`/admin/customers/${adjustingCustomer.id}/balance`, {
        method: 'PATCH',
        body: JSON.stringify({
          newBalance: Number(adjNewBalance),
          reason: adjReason
        })
      });
      setAdjustingCustomer(null);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust balance');
    }
  };

  // Founder User Management Handlers
  const handleOpenEditUser = (usr: any) => {
    setEditingUser(usr);
    setEditUserPhone(usr.phone || '');
    setEditUserRole(usr.role || 'CUSTOMER');
    setEditUserMustChangePassword(!!usr.mustChangePassword);
    setEditUserNewPassword('');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const body: any = {
      phone: editUserPhone,
      role: editUserRole,
      mustChangePassword: editUserMustChangePassword
    };
    if (editUserNewPassword.trim()) {
      if (editUserNewPassword.trim().length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      body.newPassword = editUserNewPassword.trim();
    }
    try {
      await apiFetch(`/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (usr: any) => {
    if (!confirm(`Are you sure you want to permanently delete user account +91 ${usr.phone}? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiFetch(`/admin/users/${usr.id}`, {
        method: 'DELETE'
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Filtered Master Products
  const filteredMasterProducts = masterProducts.filter((p) => {
    const matchCategory = catalogCategory === 'all' || p.category?.slug === catalogCategory;
    const matchBrand = catalogBrand === 'all' || p.brandId === catalogBrand;
    const matchSearch =
      !catalogSearch ||
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.brand?.name.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchCategory && matchBrand && matchSearch;
  });

  const metrics = metricsData?.metrics;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsAdminLoggingIn(true);
    try {
      await login(adminPhone.trim(), adminPass);
    } catch (err: any) {
      setAdminLoginError(err?.message || 'Invalid administrator phone or password');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  // Auth gate for Production Mode
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in zoom-in-95 duration-150">
          <div className="flex items-center space-x-2.5 border-b border-stone-200 pb-3">
            <div className="p-2 rounded-lg bg-stone-900 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-stone-900">Platform Super Admin</h2>
              <p className="text-xs text-stone-500">Central Exchange Operations Console</p>
            </div>
          </div>

          {adminLoginError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {adminLoginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Mobile Phone
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-stone-400">
                  +91
                </span>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="w-full pl-11 pr-3 py-2 text-xs font-mono font-semibold text-stone-900 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Security Password
              </label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={isAdminLoggingIn || adminPhone.length < 10 || !adminPass}
              className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {isAdminLoggingIn ? 'Authenticating...' : 'Sign In as Platform Super Admin'}
            </button>

            <div className="pt-2 border-t border-stone-200 text-center">
              <span className="text-[11px] text-stone-500">
                Default seed admin: <strong className="font-mono text-stone-700">9999999999 / admin123</strong>
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 pt-4 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 space-y-6 animate-in fade-in duration-200">
      
      {/* Admin Header */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-200 shrink-0 font-mono">
            <Shield className="w-5 h-5 text-stone-200" />
          </div>

          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700 uppercase tracking-wider">
                Central Operations Admin
              </span>
              <span className="text-xs text-stone-400 font-mono">• Bihar Hub</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Live & Operating
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
              Platform Master Operations & Control
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Control authorized dealers, service districts, master catalog & marketplace GMV
            </p>
          </div>
        </div>

        {/* Subtabs Bar */}
        <div className="flex items-center flex-wrap gap-1 bg-stone-850 border border-stone-750 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('overview')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'overview' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            GMV Ops
          </button>
          <button
            onClick={() => setSubTab('orders')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'orders' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Orders & Rescue {orders.length > 0 ? `(${orders.length})` : ''}
          </button>
          <button
            onClick={() => setSubTab('suppliers')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'suppliers' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Yards & Dealers ({suppliers.length})
          </button>
          <button
            onClick={() => setSubTab('consumers')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'consumers' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Buyers & Udhaar {customers.length > 0 ? `(${customers.length})` : ''}
          </button>
          <button
            onClick={() => setSubTab('payments')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'payments' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Payments Audit {payments.length > 0 ? `(${payments.length})` : ''}
          </button>
          <button
            onClick={() => setSubTab('users')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'users' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            User Logins {usersList.length > 0 ? `(${usersList.length})` : ''}
          </button>
          <button
            onClick={() => setSubTab('catalog')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer font-medium ${
              subTab === 'catalog' ? 'bg-stone-700 text-stone-100 shadow-2xs font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Master Catalog ({masterProducts.length})
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200/90 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/90 shadow-subtle grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
            
            <div className="p-5">
              <div className="flex items-center justify-between text-stone-500 text-xs font-mono uppercase tracking-wider">
                <span>Gross Marketplace Value</span>
                <TrendingUp className="w-3.5 h-3.5 text-stone-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
                ₹{(metrics?.grossMarketplaceValue || 124500).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Total marketplace GMV</p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-stone-500 text-xs font-mono uppercase tracking-wider">
                <span>Total Site Orders</span>
                <Package className="w-3.5 h-3.5 text-stone-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
                {metrics?.totalOrders || 3}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Processed across platform</p>
            </div>

            <div
              onClick={() => setSubTab('suppliers')}
              className="p-5 hover:bg-stone-50/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-stone-500 text-xs font-mono uppercase tracking-wider">
                <span>Active Dealers</span>
                <Store className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
                {metrics?.activeSuppliers || suppliers.length || 2}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Darbhanga verified dealers
              </p>
            </div>

            <div
              onClick={() => setSubTab('catalog')}
              className="p-5 hover:bg-stone-50/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-stone-500 text-xs font-mono uppercase tracking-wider">
                <span>Master SKUs</span>
                <Layers className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
                {masterProducts.length || 38}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                6 Standard Categories
              </p>
            </div>

          </div>

          {/* District Rollout Overview */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-subtle space-y-3">
            <h2 className="text-xs font-mono font-semibold text-stone-900 uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-stone-600" />
              <span>District Rollout Status (Bihar)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {metricsData?.districtBreakdown?.map((dist: any) => {
                const isLive = dist.isActive !== false;
                return (
                  <div key={dist.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-xs text-stone-900">{dist.name}</h3>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        {dist._count?.suppliers || 0} Suppliers • {dist._count?.orders || 0} Orders
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleDistrict(dist.id, isLive)}
                      title={`Click to ${isLive ? 'pause' : 'activate'} ${dist.name} district`}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-colors cursor-pointer border ${
                        isLive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {isLive ? '● Live Hub' : '○ Paused'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ORDERS & RESCUE TAB */}
      {subTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200 uppercase tracking-wider">
                  Founder Rescue Console
                </span>
                <span className="text-xs font-mono text-stone-500">
                  {orders.length} Total Platform Orders
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900 mt-1">
                All Orders & Emergency Overrides
              </h2>
              <p className="text-xs text-stone-500">
                Fix mistaken cancellations, change addresses, reassign transport vehicles or adjust pending Udhaar
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadOrders}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-subtle flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Order ID, Buyer phone, delivery address, driver..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <button
                onClick={loadOrders}
                className="px-3 py-2 rounded-lg bg-stone-900 text-white text-xs font-mono hover:bg-stone-800 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Orders List */}
          {ordersLoading && orders.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-stone-500 bg-white rounded-xl border border-stone-200">
              Loading platform orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200 space-y-1">
              <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-stone-700">No orders found matching filters</p>
              <p>Try searching for a different keyword or resetting status filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => {
                const isCancelled = ['CANCELLED', 'REJECTED'].includes(ord.status);
                const isDelivered = ['DELIVERED', 'COMPLETED'].includes(ord.status);
                return (
                  <div
                    key={ord.id}
                    className="bg-white rounded-xl border border-stone-200 p-4 shadow-subtle hover:border-stone-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center space-x-2.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-stone-900">
                          #{ord.id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                          Yard: {ord.supplier?.businessName || 'Authorized Yard'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                          District: {ord.district?.name || 'Bihar'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isCancelled
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : ord.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>

                        <button
                          onClick={() => handleOpenFixOrder(ord)}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5 text-stone-600" />
                          <span>Fix / Override</span>
                        </button>
                      </div>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Customer & Location */}
                      <div className="space-y-1 bg-stone-50/60 p-2.5 rounded-lg border border-stone-100">
                        <div className="text-[10px] font-mono uppercase text-stone-400 font-semibold">
                          Customer / Site
                        </div>
                        <div className="font-semibold text-stone-900">
                          {ord.customer?.fullName || 'Contractor / Buyer'}
                        </div>
                        <div className="text-stone-600 font-mono text-[11px] flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>+91 {ord.siteContactPhone || ord.customer?.phone}</span>
                        </div>
                        <div className="text-stone-500 text-[11px] flex items-start space-x-1">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{ord.deliveryAddress}</span>
                        </div>
                      </div>

                      {/* Transport / Driver info */}
                      <div className="space-y-1 bg-stone-50/60 p-2.5 rounded-lg border border-stone-100">
                        <div className="text-[10px] font-mono uppercase text-stone-400 font-semibold">
                          Logistics & Vehicle
                        </div>
                        <div className="flex items-center space-x-1 text-stone-800">
                          <Truck className="w-3 h-3 text-stone-500" />
                          <span className="font-mono font-medium">
                            {ord.vehicleNumber || 'No vehicle assigned yet'}
                          </span>
                        </div>
                        <div className="text-stone-600 text-[11px]">
                          Driver: {ord.driverName ? `${ord.driverName} (${ord.driverPhone || 'No phone'})` : 'Not assigned'}
                        </div>
                        <div className="text-stone-500 font-mono text-[10px]">
                          Challan: {ord.deliveryChallanNo || 'Pending'}
                        </div>
                      </div>

                      {/* Financials & Balance */}
                      <div className="space-y-1 bg-stone-50/60 p-2.5 rounded-lg border border-stone-100">
                        <div className="text-[10px] font-mono uppercase text-stone-400 font-semibold flex justify-between">
                          <span>Financials</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </div>
                        <div className="text-sm font-bold font-mono text-stone-900 tabular-nums">
                          ₹{ord.finalTotal?.toLocaleString('en-IN') || 0}
                        </div>
                        <div className="text-[11px] text-stone-600 font-mono flex justify-between">
                          <span>Pending Balance:</span>
                          <span className={ord.balancePending > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-700'}>
                            ₹{ord.balancePending?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {ord.items?.length || 0} SKU items ordered
                        </div>
                      </div>
                    </div>

                    {/* Order Items Summary */}
                    {ord.items && ord.items.length > 0 && (
                      <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-2">
                        {ord.items.map((it: any) => (
                          <div
                            key={it.id}
                            className="text-[11px] font-mono bg-stone-100/80 px-2 py-0.5 rounded border border-stone-200 text-stone-700"
                          >
                            <strong>{it.quantity} {it.unit || ''}</strong> × {it.productName || it.supplierProduct?.product?.name || 'Material'} @ ₹{it.unitPrice}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUPPLIERS ONBOARDING & MANAGEMENT TAB */}
      {subTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900">Registered Local Suppliers</h2>
              <p className="text-xs text-stone-500">Admin controlled onboarding, credentials, stock overrides & store configuration</p>
            </div>
            
            <button
              onClick={() => setIsOnboardingSupplier(true)}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono font-medium text-xs flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Onboard New Supplier</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-subtle divide-y divide-stone-100">
            {suppliers.map((sup) => (
              <div key={sup.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-xs text-stone-900">{sup.businessName}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                      sup.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {sup.status}
                    </span>
                    {sup.mustChangePassword && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>Temp Password</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600">
                    Owner: <strong>{sup.ownerName}</strong> • Phone: <span className="font-mono">{sup.phone}</span> • District: {sup.district?.name}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Address: {sup.address} • GSTIN: <span className="font-mono">{sup.gstin || 'Unregistered'}</span>
                  </p>
                  {sup.description && (
                    <p className="text-xs text-stone-500 italic">
                      "{sup.description}"
                    </p>
                  )}
                  <div className="text-[11px] font-mono text-stone-500 pt-0.5">
                    Catalog: {sup._count?.products || 0} items listed • Orders: {sup._count?.orders || 0}
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  <button
                    onClick={() => handleOpenEditSupplier(sup)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Edit Yard Profile, Address, GSTIN & Contact"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => handleInspectYard(sup)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Inspect & Override Yard Catalog Rates, Carriage Fees & Stock"
                  >
                    <Package className="w-3 h-3" />
                    <span>Manage Stock & Rates</span>
                  </button>

                  <button
                    onClick={() => handleToggleSupplierStatus(sup.id, sup.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      sup.status === 'ACTIVE'
                        ? 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    {sup.status === 'ACTIVE' ? 'Suspend Supplier' : 'Approve & Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONSUMERS / BUYERS TAB */}
      {subTab === 'consumers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200 uppercase tracking-wider">
                  Consumer Registry
                </span>
                <span className="text-xs font-mono text-stone-500">
                  {customers.length} Registered Buyers / Contractors
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900 mt-1">
                Buyers, Spend & Udhaar Controls
              </h2>
              <p className="text-xs text-stone-500">
                View lifetime spending, audit contractor Udhaar accounts, and manually adjust balances
              </p>
            </div>

            <button
              onClick={loadCustomers}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${customersLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-subtle flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contractor name or mobile number..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadCustomers()}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <button
              onClick={loadCustomers}
              className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-mono hover:bg-stone-800 cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Customer List */}
          {customersLoading && customers.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-stone-500 bg-white rounded-xl border border-stone-200">
              Loading buyers...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200 space-y-1">
              <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-stone-700">No buyers found</p>
              <p>Try searching with another name or phone number.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-subtle divide-y divide-stone-100">
              {customers.map((c) => (
                <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-xs text-stone-900">{c.fullName}</h3>
                      <span className="text-xs font-mono text-stone-600">+91 {c.phone}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-600 border border-stone-200">
                        {c.district?.name || 'Bihar'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono text-stone-500 pt-1">
                      <span>Total Orders: <strong className="text-stone-800">{c.totalOrders || 0}</strong></span>
                      <span>Lifetime Spend: <strong className="text-stone-800">₹{(c.totalSpend || 0).toLocaleString('en-IN')}</strong></span>
                      <span className="flex items-center space-x-1">
                        <span>Udhaar Balance:</span>
                        <strong className={`px-1.5 py-0.5 rounded text-[11px] ${
                          (c.outstandingBalance || 0) > 0
                            ? 'text-rose-700 bg-rose-50 border border-rose-200'
                            : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        }`}>
                          ₹{(c.outstandingBalance || 0).toLocaleString('en-IN')}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditCustomer(c)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenAdjustBalance(c)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Adjust Udhaar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAYMENTS & FINANCIAL AUDIT TAB */}
      {subTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200 uppercase tracking-wider">
                  Financial Ledger Audit
                </span>
                <span className="text-xs font-mono text-stone-500">
                  {payments.length} Payments Recorded
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900 mt-1">
                Platform Payments & Udhaar Transactions
              </h2>
              <p className="text-xs text-stone-500">
                Audit all settlement payments, cash vouchers, bank transfers, and eliminate erroneous ledger transactions
              </p>
            </div>

            <button
              onClick={loadPayments}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-mono flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${paymentsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-subtle flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer, supplier, order #, or memo..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-stone-900 bg-stone-50/50"
              />
            </div>
            {paymentSearch && (
              <button
                onClick={() => setPaymentSearch('')}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-mono cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Payments Table / List */}
          {paymentsLoading ? (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-xs font-mono text-stone-500">
              Loading payment audit ledger...
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-xs font-mono text-stone-500">
              No payments recorded yet across the marketplace.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 shadow-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono text-stone-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date & ID</th>
                      <th className="py-3 px-4">Buyer / Customer</th>
                      <th className="py-3 px-4">Dealer / Yard</th>
                      <th className="py-3 px-4">Order Link</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Audit Memo</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                    {payments
                      .filter((p) => {
                        if (!paymentSearch) return true;
                        const q = paymentSearch.toLowerCase();
                        return (
                          p.customer?.fullName?.toLowerCase().includes(q) ||
                          p.customer?.phone?.includes(q) ||
                          p.supplier?.businessName?.toLowerCase().includes(q) ||
                          p.order?.orderNumber?.toLowerCase().includes(q) ||
                          p.notes?.toLowerCase().includes(q) ||
                          p.paymentMode?.toLowerCase().includes(q)
                        );
                      })
                      .map((pay) => (
                        <tr key={pay.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4 text-stone-500">
                            <div>{new Date(pay.recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[9px] text-stone-400 truncate max-w-[90px]">{pay.id.slice(-8)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{pay.customer?.fullName || 'Walk-in Buyer'}</div>
                            <div className="text-[10px] text-stone-500">{pay.customer?.phone || '—'}</div>
                          </td>
                          <td className="py-3 px-4 text-stone-800 font-medium">
                            {pay.supplier?.businessName || '—'}
                          </td>
                          <td className="py-3 px-4">
                            {pay.order ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-800 border border-stone-200">
                                {pay.order.orderNumber}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">Khata Settlement</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              pay.paymentMode === 'CASH'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : pay.paymentMode === 'UPI_DIRECT'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : pay.paymentMode === 'UDHAAR'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}>
                              {pay.paymentMode.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums">
                            ₹{pay.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-stone-600 max-w-xs truncate text-[10px]">
                            {pay.notes || <span className="text-stone-300">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeletePayment(pay.id)}
                              className="p-1.5 rounded-md text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* USERS & LOGINS TAB */}
      {subTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200 uppercase tracking-wider">
                  System Auth & Access
                </span>
                <span className="text-xs font-mono text-stone-500">
                  {usersList.length} Total User Accounts
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900 mt-1">
                Platform Logins, Roles & Direct Password Resets
              </h2>
              <p className="text-xs text-stone-500">
                Directly reset forgotten passwords, change telephone numbers, modify roles, or remove accounts
              </p>
            </div>

            <button
              onClick={loadUsers}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-subtle flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user mobile number..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-mono hover:bg-stone-800 cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Users List */}
          {usersLoading && usersList.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-stone-500 bg-white rounded-xl border border-stone-200">
              Loading users...
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200 space-y-1">
              <KeyRound className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-stone-700">No user accounts found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-subtle divide-y divide-stone-100">
              {usersList.map((usr) => (
                <div key={usr.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-stone-900">+91 {usr.phone}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        usr.role === 'ADMIN'
                          ? 'bg-stone-900 text-white'
                          : usr.role === 'SUPPLIER'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}>
                        {usr.role}
                      </span>
                      {usr.mustChangePassword && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                          Force Password Change
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-stone-600">
                      {usr.supplier ? (
                        <span>Yard: <strong>{usr.supplier.businessName}</strong> ({usr.supplier.ownerName})</span>
                      ) : usr.customer ? (
                        <span>Buyer: <strong>{usr.customer.fullName}</strong></span>
                      ) : (
                        <span className="text-stone-400 italic">Platform Administrator Account</span>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-stone-400">
                      Created: {new Date(usr.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditUser(usr)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Edit & Reset Password</span>
                    </button>

                    {usr.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteUser(usr)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center space-x-1 cursor-pointer"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAYMENTS & FINANCIAL AUDIT TAB */}
      {subTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200 uppercase tracking-wider">
                  Financial Ledger Audit
                </span>
                <span className="text-xs font-mono text-stone-500">
                  {payments.length} Payments Recorded
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900 mt-1">
                Platform Payments & Udhaar Transactions
              </h2>
              <p className="text-xs text-stone-500">
                Audit all settlement payments, cash vouchers, bank transfers, and eliminate erroneous ledger transactions
              </p>
            </div>

            <button
              onClick={loadPayments}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-mono flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${paymentsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-subtle flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer, supplier, order #, or memo..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-stone-900 bg-stone-50/50"
              />
            </div>
            {paymentSearch && (
              <button
                onClick={() => setPaymentSearch('')}
                className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-mono cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Payments Table / List */}
          {paymentsLoading ? (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-xs font-mono text-stone-500">
              Loading payment audit ledger...
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-xs font-mono text-stone-500">
              No payments recorded yet across the marketplace.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 shadow-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono text-stone-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date & ID</th>
                      <th className="py-3 px-4">Buyer / Customer</th>
                      <th className="py-3 px-4">Dealer / Yard</th>
                      <th className="py-3 px-4">Order Link</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Audit Memo</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                    {payments
                      .filter((p) => {
                        if (!paymentSearch) return true;
                        const q = paymentSearch.toLowerCase();
                        return (
                          p.customer?.fullName?.toLowerCase().includes(q) ||
                          p.customer?.phone?.includes(q) ||
                          p.supplier?.businessName?.toLowerCase().includes(q) ||
                          p.order?.orderNumber?.toLowerCase().includes(q) ||
                          p.notes?.toLowerCase().includes(q) ||
                          p.paymentMode?.toLowerCase().includes(q)
                        );
                      })
                      .map((pay) => (
                        <tr key={pay.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4 text-stone-500">
                            <div>{new Date(pay.recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[9px] text-stone-400 truncate max-w-[90px]">{pay.id.slice(-8)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{pay.customer?.fullName || 'Walk-in Buyer'}</div>
                            <div className="text-[10px] text-stone-500">{pay.customer?.phone || '—'}</div>
                          </td>
                          <td className="py-3 px-4 text-stone-800 font-medium">
                            {pay.supplier?.businessName || '—'}
                          </td>
                          <td className="py-3 px-4">
                            {pay.order ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-800 border border-stone-200">
                                {pay.order.orderNumber}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">Khata Settlement</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              pay.paymentMode === 'CASH'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : pay.paymentMode === 'UPI_DIRECT'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : pay.paymentMode === 'UDHAAR'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}>
                              {pay.paymentMode.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums">
                            ₹{pay.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-stone-600 max-w-xs truncate text-[10px]">
                            {pay.notes || <span className="text-stone-300">—</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeletePayment(pay.id)}
                              className="p-1.5 rounded-md text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MASTER CATALOG TAB */}
      {subTab === 'catalog' && (
        <div className="space-y-4">
          
          {/* Header & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200 uppercase tracking-wider">
                  Master SKU Repository
                </span>
                <span className="text-xs font-mono text-stone-500">
                  {masterProducts.length} Standard Products Active
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900 mt-1">
                Master Materials Catalogue
              </h2>
              <p className="text-xs text-stone-500">
                Admin controls specifications & brands; suppliers set prices & stock.
              </p>
            </div>

            <button
              onClick={() => setIsAddingProd(true)}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono font-medium text-xs flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Master Product</span>
            </button>
          </div>

          {/* Category Filter Horizontal Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCatalogCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 transition-all cursor-pointer ${
                catalogCategory === 'all'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              All Categories ({masterProducts.length})
            </button>
            {categories.map((c) => {
              const count = masterProducts.filter((p) => p.categoryId === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCatalogCategory(c.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 flex items-center space-x-1.5 transition-all cursor-pointer ${
                    catalogCategory === c.slug
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search & Brand Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search master products by name, grade, diameter, brand..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl bg-white font-mono placeholder-stone-400 focus:outline-none focus:border-stone-800"
              />
            </div>
            <div>
              <select
                value={catalogBrand}
                onChange={(e) => setCatalogBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white font-mono text-stone-700 focus:outline-none focus:border-stone-800"
              >
                <option value="all">All Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Master Products List / Grid */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-subtle divide-y divide-stone-100">
            {filteredMasterProducts.length === 0 ? (
              <div className="p-12 text-center text-stone-500 text-xs font-mono">
                No master products match your filters.
              </div>
            ) : (
              filteredMasterProducts.map((p) => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                        {p.category?.name}
                      </span>
                      {p.brand && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-50 text-stone-700 border border-stone-200 flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-stone-400" />
                          <span>{p.brand.name}</span>
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-stone-500">
                        Unit: <strong>{p.defaultUnit}</strong>
                      </span>
                    </div>

                    <h3 className="font-semibold text-xs text-stone-900 mt-1">{p.name}</h3>
                    <p className="text-xs text-stone-500 max-w-2xl">{p.description}</p>
                    
                    <div className="text-[11px] font-mono text-stone-500 pt-0.5">
                      Stocked by: <strong>{p._count?.supplierProducts || 0} local suppliers</strong> in Darbhanga
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 text-xs font-mono hover:bg-stone-50 flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMasterProduct(p.id, p.name)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-mono hover:bg-rose-50 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ADD MASTER PRODUCT MODAL */}
      {isAddingProd && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-stone-200">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-semibold text-sm text-stone-900">
                  Add New Master Product
                </h3>
                <p className="text-xs text-stone-500">
                  Defines a standardized construction material across the platform.
                </p>
              </div>
              <button
                onClick={() => setIsAddingProd(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMasterProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. UltraTech Weather Pro 50kg"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Brand (Optional)
                  </label>
                  <select
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="">No Brand / Generic (River Sand, Pakur Gitti, Brick)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Standard Selling Unit *
                </label>
                <select
                  value={newProdUnit}
                  onChange={(e) => setNewProdUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                >
                  <option value="BAG">BAG (Cement 50kg)</option>
                  <option value="KG">KG (Steel / Sariya)</option>
                  <option value="CFT">CFT (Sand / Balu, Aggregate / Gitti)</option>
                  <option value="PIECE">PIECE (Bricks, AAC Blocks)</option>
                  <option value="TONNE">TONNE (Bulk Steel / Cement)</option>
                  <option value="QUINTAL">QUINTAL (100 KG Steel)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Description & Specifications
                </label>
                <textarea
                  rows={3}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="e.g. Portland Pozzolana Cement with micro-fine silica particles for high durability roof slab."
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProd(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono cursor-pointer"
                >
                  Add to Master Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MASTER PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-stone-200">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-semibold text-sm text-stone-900">
                  Edit Master Product
                </h3>
                <p className="text-xs text-stone-500">
                  Changes apply globally across the platform catalog.
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMasterProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={editProdCategory}
                    onChange={(e) => setEditProdCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Brand
                  </label>
                  <select
                    value={editProdBrand}
                    onChange={(e) => setEditProdBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="">No Brand / Generic</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Standard Unit *
                </label>
                <select
                  value={editProdUnit}
                  onChange={(e) => setEditProdUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                >
                  <option value="BAG">BAG</option>
                  <option value="KG">KG</option>
                  <option value="CFT">CFT</option>
                  <option value="PIECE">PIECE</option>
                  <option value="TONNE">TONNE</option>
                  <option value="QUINTAL">QUINTAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Description & Specifications
                </label>
                <textarea
                  rows={3}
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono cursor-pointer"
                >
                  Update Master Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ONBOARD SUPPLIER MODAL */}
      {isOnboardingSupplier && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-stone-200">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-semibold text-sm text-stone-900">
                  Onboard Supplier & Generate First-Time Creds
                </h3>
                <p className="text-xs text-stone-500">
                  Sets initial temporary password; supplier will be prompted to change password upon first login.
                </p>
              </div>
              <button
                onClick={() => setIsOnboardingSupplier(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardSupplier} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Shop / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={supBusinessName}
                    onChange={(e) => setSupBusinessName(e.target.value)}
                    placeholder="e.g. Bajrang Cement & Steels"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Owner / Prop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={supOwnerName}
                    onChange={(e) => setSupOwnerName(e.target.value)}
                    placeholder="e.g. Alok Mishra"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Mobile Number (Login ID) *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Temporary 1st Login Password *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={supTempPassword}
                    onChange={(e) => setSupTempPassword(e.target.value)}
                    placeholder="e.g. klink@2026"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg font-mono text-stone-900 font-bold focus:border-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Service District *
                  </label>
                  <select
                    value={supDistrictId}
                    onChange={(e) => setSupDistrictId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.state.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    GSTIN Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={supGstin}
                    onChange={(e) => setSupGstin(e.target.value)}
                    placeholder="e.g. 10AAACB1234F1Z0"
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg uppercase focus:border-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Shop Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="e.g. Near Bahera Bus Stand, Darbhanga"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Logo / Shop Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={supLogoUrl}
                    onChange={(e) => setSupLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Store Description / Specialty (Optional)
                  </label>
                  <input
                    type="text"
                    value={supDescription}
                    onChange={(e) => setSupDescription(e.target.value)}
                    placeholder="e.g. Authorized UltraTech Cement dealer"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOnboardingSupplier(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono cursor-pointer"
                >
                  Create Supplier & Issue Creds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS SLIP MODAL */}
      {createdCredentialsSlip && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center border border-stone-200">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center mx-auto">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-stone-900">
                Supplier Onboarded Successfully
              </h3>
              <p className="text-xs text-stone-500">
                Share these temporary login credentials with <strong>{createdCredentialsSlip.businessName}</strong>.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Shop:</span>
                <span className="font-medium text-stone-900">{createdCredentialsSlip.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">District:</span>
                <span className="font-medium text-stone-900">{createdCredentialsSlip.district}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Login Mobile:</span>
                <span className="font-bold text-stone-900">{createdCredentialsSlip.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Temporary Password:</span>
                <span className="font-bold text-stone-900">{createdCredentialsSlip.temporaryPassword}</span>
              </div>
              <div className="text-[11px] text-stone-600 bg-white border border-stone-200 p-2.5 rounded-lg font-sans mt-2">
                🔒 The supplier will be automatically prompted to change their password on first login before accessing their store.
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <a
                href={`https://wa.me/91${createdCredentialsSlip.phone}?text=${encodeURIComponent(
                  `Namaste! Your KLINK Supplier Store (${createdCredentialsSlip.businessName}) has been created.\n\nLogin Mobile: ${createdCredentialsSlip.phone}\nTemporary Password: ${createdCredentialsSlip.temporaryPassword}\n\nPlease visit the portal and set your confidential password upon first login.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Send via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setCreatedCredentialsSlip(null)}
                className="py-2 px-4 rounded-lg border border-stone-200 text-stone-700 text-xs font-mono hover:bg-stone-50 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOUNDER FIX / OVERRIDE ORDER MODAL */}
      {fixingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-stone-900 text-white">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-900">
                    Founder Order Override: #{fixingOrder.id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Fix mistakes made by suppliers or customers directly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFixingOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Automatic Reconciliation:</strong> If you revive a mistakenly CANCELLED or REJECTED order back to CONFIRMED or DELIVERED, inventory stock will be safely decremented and pending customer balances will be restored.
              </div>
            </div>

            <form onSubmit={handleSaveOrderFix} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Order Status</label>
                  <select
                    value={fixStatus}
                    onChange={(e) => setFixStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white font-mono"
                  >
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Payment Status</label>
                  <select
                    value={fixPaymentStatus}
                    onChange={(e) => setFixPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white font-mono"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Site Delivery Address</label>
                <input
                  type="text"
                  value={fixAddress}
                  onChange={(e) => setFixAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Site Contact Phone</label>
                  <input
                    type="tel"
                    value={fixSitePhone}
                    onChange={(e) => setFixSitePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Vehicle / Truck Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BR-07-GB-4421"
                    value={fixVehicle}
                    onChange={(e) => setFixVehicle(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="Driver full name"
                    value={fixDriverName}
                    onChange={(e) => setFixDriverName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Driver Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={fixDriverPhone}
                    onChange={(e) => setFixDriverPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Delivery Challan No</label>
                  <input
                    type="text"
                    placeholder="CH-2026-..."
                    value={fixChallan}
                    onChange={(e) => setFixChallan(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Final Total (₹)</label>
                  <input
                    type="number"
                    value={fixFinalTotal}
                    onChange={(e) => setFixFinalTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Balance Pending (₹)</label>
                  <input
                    type="number"
                    value={fixBalancePending}
                    onChange={(e) => setFixBalancePending(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900 text-rose-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setFixingOrder(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrderFix}
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono cursor-pointer disabled:opacity-50"
                >
                  {isSavingOrderFix ? 'Saving Overrides...' : 'Apply Order Overrides'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOUNDER EDIT SUPPLIER PROFILE MODAL */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-stone-900 text-white">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-900">
                    Edit Yard Profile: {editingSupplier.businessName}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Update business details, owner contacts, GSTIN & activation status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSupplier(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Business / Yard Name</label>
                  <input
                    type="text"
                    value={editSupBusinessName}
                    onChange={(e) => setEditSupBusinessName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editSupOwnerName}
                    onChange={(e) => setEditSupOwnerName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editSupPhone}
                    onChange={(e) => setEditSupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">District Hub</label>
                  <select
                    value={editSupDistrictId}
                    onChange={(e) => setEditSupDistrictId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Yard Physical Address</label>
                <input
                  type="text"
                  value={editSupAddress}
                  onChange={(e) => setEditSupAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={editSupGstin}
                    onChange={(e) => setEditSupGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono uppercase focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Operating Status</label>
                  <select
                    value={editSupStatus}
                    onChange={(e) => setEditSupStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Trust Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editSupRating}
                    onChange={(e) => setEditSupRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Yard Description / Specialties</label>
                <textarea
                  rows={2}
                  value={editSupDescription}
                  onChange={(e) => setEditSupDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono cursor-pointer"
                >
                  Save Yard Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOUNDER INSPECT YARD PRODUCTS & OVERRIDE RATES MODAL */}
      {inspectingSupplier && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-stone-900 text-white">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-stone-900">
                    Yard Catalog & Rate Overrides: {inspectingSupplier.businessName}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Directly correct mistaken price quotes, delivery fees, or stock counts for this yard
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingSupplier(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {yardProductsLoading ? (
              <div className="p-8 text-center text-xs font-mono text-stone-500">
                Loading yard products...
              </div>
            ) : yardProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                This supplier hasn't activated any products in their catalog yet.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl">
                {yardProducts.map((p) => {
                  const prod = p.masterProduct || p.product;
                  return (
                    <div key={p.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-stone-900">{prod?.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-stone-100 text-stone-600">
                            {prod?.category?.name}
                          </span>
                          {prod?.brand && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-stone-100 text-stone-600">
                              {prod?.brand?.name}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            p.isAvailable ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-400'
                          }`}>
                            {p.isAvailable ? 'In Stock' : 'Hidden'}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-stone-500 flex items-center space-x-3">
                          <span>Price: <strong className="text-stone-900">₹{p.sellingPrice}</strong> / {prod?.defaultUnit}</span>
                          <span>Stock: <strong className="text-stone-900">{p.stockQuantity}</strong></span>
                          <span>Delivery Fee: <strong className="text-stone-900">₹{p.deliveryFee || 0}</strong></span>
                          <span>Min Order: <strong className="text-stone-900">{p.minOrderQty || 1}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEditYardProduct(p)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-stone-600" />
                        <span>Override Rate</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectingSupplier(null)}
                className="px-4 py-1.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOUNDER EDIT YARD PRODUCT SUB-MODAL */}
      {editingYardProduct && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-semibold text-sm text-stone-900">
                  Override Rate: {(editingYardProduct.masterProduct || editingYardProduct.product)?.name}
                </h3>
                <p className="text-xs text-stone-500">Correct supplier price or stock count</p>
              </div>
              <button
                onClick={() => setEditingYardProduct(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveYardProduct} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Selling Price (₹ per unit)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editYardPrice}
                  onChange={(e) => setEditYardPrice(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Stock Quantity Available</label>
                <input
                  type="number"
                  value={editYardStock}
                  onChange={(e) => setEditYardStock(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={editYardDeliveryFee}
                    onChange={(e) => setEditYardDeliveryFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Min Order Qty</label>
                  <input
                    type="number"
                    value={editYardMinOrderQty}
                    onChange={(e) => setEditYardMinOrderQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="yardIsAvailable"
                  checked={editYardIsAvailable}
                  onChange={(e) => setEditYardIsAvailable(e.target.checked)}
                  className="rounded text-stone-900"
                />
                <label htmlFor="yardIsAvailable" className="text-stone-700 font-medium">
                  Active & Available in Customer Storefront
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingYardProduct(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white cursor-pointer"
                >
                  Save Rate Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOUNDER EDIT BUYER MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-semibold text-sm text-stone-900">
                  Edit Buyer Profile: {editingCustomer.fullName}
                </h3>
                <p className="text-xs text-stone-500">Correct contractor name, phone or district</p>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Contractor Full Name</label>
                <input
                  type="text"
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">District</label>
                <select
                  value={editCustDistrictId}
                  onChange={(e) => setEditCustDistrictId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-mono cursor-pointer"
                >
                  Save Buyer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOUNDER ADJUST UDHAAR BALANCE MODAL */}
      {adjustingCustomer && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-semibold text-sm text-stone-900">
                  Adjust Udhaar: {adjustingCustomer.fullName}
                </h3>
                <p className="text-xs text-stone-500">Correct contractor's ledger balance with audit trail</p>
              </div>
              <button
                onClick={() => setAdjustingCustomer(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-mono space-y-1">
              <div className="flex justify-between text-stone-500">
                <span>Contractor:</span>
                <span className="font-semibold text-stone-900">{adjustingCustomer.fullName} (+91 {adjustingCustomer.phone})</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Current Udhaar Balance:</span>
                <span className="font-bold text-rose-700">₹{(adjustingCustomer.outstandingBalance || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleSaveBalanceAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">New Balance Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjNewBalance}
                  onChange={(e) => setAdjNewBalance(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Audit / Correction Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Supplier cash receipt was not logged in yard app; settled on site."
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustingCustomer(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-mono cursor-pointer"
                >
                  Confirm Balance Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOUNDER EDIT USER / RESET PASSWORD MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-semibold text-sm text-stone-900">
                  User Account: +91 {editingUser.phone}
                </h3>
                <p className="text-xs text-stone-500">Reset password directly or modify account role</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Account Role</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                >
                  <option value="CUSTOMER">CUSTOMER (Contractor / Buyer)</option>
                  <option value="SUPPLIER">SUPPLIER (Yard Owner / Operator)</option>
                  <option value="ADMIN">ADMIN (Super Administrator)</option>
                </select>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <label className="block text-stone-700 font-semibold">
                  Direct Password Reset (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (leave blank to keep current)"
                  value={editUserNewPassword}
                  onChange={(e) => setEditUserNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <span className="text-[10px] text-stone-400 block">
                  Must be at least 6 characters if entered.
                </span>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="mustChangePass"
                  checked={editUserMustChangePassword}
                  onChange={(e) => setEditUserMustChangePassword(e.target.checked)}
                  className="rounded text-stone-900"
                />
                <label htmlFor="mustChangePass" className="text-stone-700 font-medium">
                  Force password change on next sign in
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-mono cursor-pointer"
                >
                  Save Account Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
