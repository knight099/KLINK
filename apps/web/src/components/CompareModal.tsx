import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useDistrict } from '../lib/district-context';
import { useCart } from '../lib/cart-context';
import { X, CheckCircle2, AlertCircle, ShoppingBag, Star, Truck, ArrowRight, Sparkles, Building2 } from 'lucide-react';

interface CompareModalProps {
  masterProduct: any | null;
  isOpen: boolean;
  onClose: () => void;
  onAddedToCart: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  masterProduct,
  isOpen,
  onClose,
  onAddedToCart
}) => {
  const { activeDistrict } = useDistrict();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(50);
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !masterProduct || !activeDistrict) return;
    const districtId = activeDistrict.id;

    let isMounted = true;
    async function fetchComparison() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch<any>(
          `/marketplace/compare/${masterProduct.id}?districtId=${districtId}&quantity=${quantity}`
        );
        if (isMounted) {
          setComparisons(res.comparisons || []);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to compare suppliers');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchComparison();

    return () => {
      isMounted = false;
    };
  }, [isOpen, masterProduct, activeDistrict, quantity]);

  if (!isOpen || !masterProduct) return null;

  const handleSelectSupplier = (comp: any) => {
    const success = addItem(
      comp.supplierId,
      comp.businessName,
      {
        supplierProductId: comp.supplierProductId,
        masterProductName: masterProduct.name,
        unit: comp.unit,
        unitPrice: comp.sellingPrice,
        deliveryCharge: comp.deliveryCharge
      },
      quantity
    );

    if (success) {
      onAddedToCart();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-elevated overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 border border-stone-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-800 bg-stone-950 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>MULTIPLE-DEALER PROCUREMENT QUOTES • {activeDistrict?.name?.toUpperCase() || 'DARBHANGA'}</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">
              {masterProduct.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quantity Calculator Bar */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-600 font-medium flex items-center space-x-1.5">
            <span>Calculate landed cost for required volume:</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {[25, 50, 100, 200, 500].map((preset) => (
              <button
                key={preset}
                onClick={() => setQuantity(preset)}
                className={`px-2.5 py-1 rounded-md font-mono text-xs font-medium transition-colors cursor-pointer ${
                  quantity === preset
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {preset}
              </button>
            ))}

            <div className="flex items-center space-x-1 pl-2 border-l border-stone-300">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 text-xs font-mono font-semibold text-center bg-white border border-stone-300 rounded-md focus:ring-1 focus:ring-stone-400 focus:outline-none"
              />
              <span className="text-xs font-mono font-medium text-stone-600">{masterProduct.defaultUnit}</span>
            </div>
          </div>
        </div>

        {/* Comparison List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-stone-500 space-y-2 animate-pulse">
              <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p>Scanning verified local yards in {activeDistrict?.name || 'Darbhanga'}...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium">{error}</div>
          ) : comparisons.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-500 space-y-2">
              <Building2 className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-semibold text-stone-700">No active yards in {activeDistrict?.name || 'Darbhanga'} currently stock this SKU.</p>
              <p className="text-stone-400">Please check back soon as local dealers regularly update their catalogs.</p>
            </div>
          ) : (
            comparisons.map((comp, idx) => (
              <div
                key={comp.supplierProductId}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  idx === 0
                    ? 'border-emerald-300 bg-emerald-50/20 border-l-4 border-l-emerald-600 shadow-subtle'
                    : 'border-stone-200/90 hover:border-stone-400 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Supplier Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="font-semibold text-sm text-stone-900">{comp.businessName}</h3>
                      {comp.isVerified && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100/80 text-emerald-900 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Dealer</span>
                        </span>
                      )}
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-mono font-medium tracking-wide">
                          Lowest Landed Quote
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-500">{comp.address}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-600">
                      <span className="flex items-center text-stone-800 font-mono font-semibold bg-stone-100 px-1.5 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" />
                        {comp.rating}
                      </span>
                      <span>
                        Stock: <strong className="font-mono text-stone-900">{comp.stockQuantity} {comp.unit}</strong>
                      </span>
                      <span>
                        Min Order: <strong className="font-mono text-stone-900">{comp.minOrderQty} {comp.unit}</strong>
                      </span>
                      <span className="flex items-center text-stone-500">
                        <Truck className="w-3 h-3 mr-1 text-stone-400" />
                        Carriage: <span className="font-mono ml-1">₹{comp.deliveryCharge}</span>
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Order CTA */}
                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right pt-3 sm:pt-0 border-t sm:border-0 border-stone-100">
                    <div>
                      <div className="text-[10px] text-stone-400 uppercase font-mono font-medium tracking-wider">Unit Rate</div>
                      <div className="text-lg font-mono font-semibold text-stone-900">
                        ₹{comp.sellingPrice}{' '}
                        <span className="text-xs font-normal text-stone-500 font-sans">/{comp.unit}</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-stone-700 mt-0.5">
                        Landed Total: <span className="text-emerald-700 font-bold">₹{comp.totalEstimated.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectSupplier(comp)}
                      disabled={!comp.inStock || !comp.meetsMinOrder}
                      className="mt-2.5 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs flex items-center space-x-1.5 shadow-subtle disabled:opacity-40 cursor-pointer transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Select & Add to Cart</span>
                    </button>
                  </div>
                </div>

                {!comp.meetsMinOrder && (
                  <div className="mt-2 text-xs text-rose-600 font-medium flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Minimum dispatch volume is {comp.minOrderQty} {comp.unit}.</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
