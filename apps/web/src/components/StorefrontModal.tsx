import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useCart } from '../lib/cart-context';
import {
  X,
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  Star,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  Truck,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface StorefrontModalProps {
  supplierId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}

export const StorefrontModal: React.FC<StorefrontModalProps> = ({
  supplierId,
  isOpen,
  onClose,
  onOpenCart
}) => {
  const { addItem, items, supplierId: currentCartSupplierId } = useCart();
  const [supplierData, setSupplierData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [addedItemIds, setAddedItemIds] = useState<{ [id: string]: boolean }>({});
  const [quantities, setQuantities] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    if (!isOpen || !supplierId) {
      setSupplierData(null);
      return;
    }

    async function loadStorefront() {
      setIsLoading(true);
      try {
        const res = await apiFetch<any>(`/marketplace/suppliers/${supplierId}/storefront`);
        setSupplierData(res.supplier);

        const initialQtys: { [id: string]: number } = {};
        res.supplier?.products?.forEach((p: any) => {
          initialQtys[p.id] = p.minOrderQty || 10;
        });
        setQuantities(initialQtys);
      } catch (err) {
        console.error('Failed to load storefront', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStorefront();
  }, [isOpen, supplierId]);

  if (!isOpen) return null;

  const products = supplierData?.products || [];
  const categoriesMap = new Map<string, string>();
  products.forEach((p: any) => {
    if (p.masterProduct?.category) {
      categoriesMap.set(p.masterProduct.category.id, p.masterProduct.category.name);
    }
  });

  const filteredProducts = products.filter((p: any) => {
    if (selectedCat === 'all') return true;
    return p.masterProduct?.categoryId === selectedCat;
  });

  const handleQtyChange = (productId: string, delta: number, min: number, max: number) => {
    setQuantities((prev) => {
      const cur = prev[productId] || min;
      const next = Math.max(min, Math.min(max, cur + delta));
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (product: any) => {
    const qty = quantities[product.id] || product.minOrderQty || 10;
    const added = addItem(
      supplierData.id,
      supplierData.businessName,
      {
        supplierProductId: product.id,
        masterProductName: product.masterProduct.name,
        unit: product.unit,
        unitPrice: product.sellingPrice,
        deliveryCharge: product.deliveryCharge
      },
      qty
    );

    if (added) {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#141413] text-white relative border-b border-stone-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {isLoading || !supplierData ? (
            <div className="py-8 text-center text-slate-300 text-xs animate-pulse">Loading yard storefront...</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/30 shrink-0 border border-blue-400/30">
                  {supplierData.businessName.charAt(0)}
                </div>

                <div className="min-w-0 flex-1 pr-6">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-white truncate">
                      {supplierData.businessName}
                    </h2>
                    {supplierData.isVerified && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Verified Yard</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1 flex-wrap gap-y-1">
                    <span className="flex items-center text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                      {supplierData.rating} ★
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {supplierData.district?.name || 'Darbhanga'}
                    </span>
                    {supplierData.phone && (
                      <a
                        href={`tel:${supplierData.phone}`}
                        className="flex items-center text-blue-300 hover:text-blue-200 transition-colors font-bold"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1" />
                        {supplierData.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {supplierData.description && (
                <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/10">
                  {supplierData.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300 flex-wrap gap-1">
                <span>Address: <strong>{supplierData.address}</strong></span>
                {supplierData.gstin && (
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[10px]">
                    GSTIN: {supplierData.gstin}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        {supplierData && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Category Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCat('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                  selectedCat === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Materials ({products.length})
              </button>
              {Array.from(categoriesMap.entries()).map(([catId, catName]) => (
                <button
                  key={catId}
                  onClick={() => setSelectedCat(catId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                    selectedCat === catId
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {catName}
                </button>
              ))}
            </div>

            {/* Products List */}
            <div className="space-y-3">
              {filteredProducts.map((prod: any) => {
                const qty = quantities[prod.id] || prod.minOrderQty || 10;
                const isAdded = addedItemIds[prod.id];
                return (
                  <div
                    key={prod.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                          {prod.masterProduct?.category?.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prod.stockQuantity > 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Stock: {prod.stockQuantity} {prod.unit}
                        </span>
                      </div>

                      <h4 className="font-black text-sm text-slate-900">{prod.masterProduct?.name}</h4>
                      <div className="text-xs text-slate-500">
                        Carriage Freight: ₹{prod.deliveryCharge} • Min Order: {prod.minOrderQty} {prod.unit}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-base font-black text-slate-900">
                          ₹{prod.sellingPrice} <span className="text-xs text-slate-500 font-normal">/{prod.unit}</span>
                        </div>
                        <div className="text-[11px] text-amber-600 font-bold">
                          Total: ₹{(prod.sellingPrice * qty).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                        <button
                          onClick={() => handleQtyChange(prod.id, -1, prod.minOrderQty || 1, prod.stockQuantity)}
                          className="p-1 hover:bg-white rounded-lg text-slate-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-900">{qty}</span>
                        <button
                          onClick={() => handleQtyChange(prod.id, 1, prod.minOrderQty || 1, prod.stockQuantity)}
                          className="p-1 hover:bg-white rounded-lg text-slate-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddToCart(prod)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-500">
            {items.length > 0 && currentCartSupplierId === supplierId
              ? `${items.length} items currently in cart from this yard`
              : 'Direct site delivery in Darbhanga within 2-4 hrs'}
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenCart();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open Cart ({items.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
