import React, { useState, useEffect } from 'react';
import { useCart } from '../lib/cart-context';
import { useDistrict } from '../lib/district-context';
import { useAuth } from '../lib/auth-context';
import { apiFetch } from '../lib/api';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  Truck,
  IndianRupee,
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const {
    items,
    supplierId,
    supplierName,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCartPrices,
    totalMaterialAmount,
    deliveryCharge,
    finalTotal
  } = useCart();
  const { activeDistrict } = useDistrict();
  const { user, setIsAuthModalOpen } = useAuth();

  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('846001');
  const [sitePhone, setSitePhone] = useState(user?.phone || '');
  const [instructions, setInstructions] = useState('Call 30 mins before arrival. Site entrance is wide for tractor/truck.');
  const [paymentChoice, setPaymentChoice] = useState<'COD' | 'UPI' | 'UDHAAR'>('COD');
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Load Customer's saved construction site addresses & sync fresh cart prices
  useEffect(() => {
    if (!isOpen) return;
    refreshCartPrices();
    apiFetch<{ addresses: any[] }>('/customer/addresses')
      .then((res) => {
        const list = res.addresses || [];
        setSavedAddresses(list);
        if (list.length > 0 && !addressLine) {
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(def.id);
          setAddressLine(def.addressLine);
          setLandmark(def.landmark || '');
          setPincode(def.pincode || '846001');
        }
      })
      .catch((err) => console.log('Could not load saved addresses:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        setLandmark((prev) => (prev ? `${prev} (GPS: ${coords})` : `GPS Plot Location: ${coords}`));
      },
      () => {
        setIsLocating(false);
        alert('Could not access GPS location. Please ensure location permissions are allowed.');
      },
      { timeout: 8000 }
    );
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!supplierId || items.length === 0) return;
    if (!activeDistrict) {
      setError('Please select a district');
      return;
    }
    if (!addressLine.trim()) {
      setError('Please enter a delivery site address');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // If customer requested saving this address
      if (saveThisAddress && addressLine) {
        apiFetch('/customer/addresses', {
          method: 'POST',
          body: JSON.stringify({
            addressLine,
            landmark,
            pincode,
            districtId: activeDistrict.id
          })
        }).catch((e) => console.error('Failed to save address background:', e));
      }

      const payload = {
        supplierId,
        districtId: activeDistrict.id,
        items: items.map((i) => ({
          supplierProductId: i.supplierProductId,
          quantity: i.quantity
        })),
        deliveryAddress: addressLine,
        landmark,
        pincode: pincode.trim() || '846001',
        deliveryInstructions: `${instructions} [Preferred Payment: ${paymentChoice}${advanceAmount > 0 ? `, Advance Token Paid: ₹${advanceAmount}` : ''}]`,
        siteContactPhone: sitePhone || user?.phone || '9123456789'
      };

      const res = await apiFetch<{ order: any }>('/customer/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      clearCart();
      onClose();
      onOrderSuccess(res.order);
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FAF9F6] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 border-l border-stone-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-stone-100">Site Requisition Cart</h2>
              {supplierName && (
                <p className="text-xs text-stone-400 font-mono truncate max-w-[240px]">
                  Yard: <span className="text-stone-200">{supplierName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-500 border border-stone-200 flex items-center justify-center text-xl">
                🏗️
              </div>
              <p className="font-semibold text-sm text-stone-900">Your site cart is empty</p>
              <p className="text-xs text-stone-500 max-w-xs">
                Browse Cement, Sariya, Sand or Aggregate from verified yards in {activeDistrict?.name || 'Darbhanga'}.
              </p>
            </div>
          ) : (
            <>
              {/* Single Supplier Rule Banner */}
              <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 flex items-center space-x-2.5 text-xs text-stone-700">
                <ShieldCheck className="w-4 h-4 text-stone-600 shrink-0" />
                <span>Single-Yard Dispatch: All materials in this order will ship from <strong>{supplierName}</strong>.</span>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">Bill of Materials</div>
                {items.map((item) => (
                  <div
                    key={item.supplierProductId}
                    className="p-3.5 rounded-xl border border-stone-200/90 bg-white shadow-xs flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-stone-900 truncate">{item.masterProductName}</div>
                      <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                        ₹{item.unitPrice.toLocaleString('en-IN')} / {item.unit}
                      </div>
                      <div className="font-mono font-bold text-xs text-stone-900 mt-1 tabular-nums">
                        ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Quantity Controls with direct numeric editing */}
                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      <div className="flex items-center space-x-1.5">
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.supplierProductId, item.quantity - 1)}
                            className="p-1 hover:bg-white rounded text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
                            title="Decrease 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val >= 0) {
                                updateQuantity(item.supplierProductId, val);
                              }
                            }}
                            className="w-14 text-center text-xs font-mono font-bold text-stone-900 bg-white border border-stone-200 rounded py-0.5 px-1 focus:ring-1 focus:ring-stone-800 focus:outline-none"
                            title="Directly edit amount / quantity"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.supplierProductId, item.quantity + 1)}
                            className="p-1 hover:bg-white rounded text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
                            title="Increase 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.supplierProductId)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Add Increment Badges */}
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] text-stone-400 font-mono uppercase">Quick:</span>
                        {[10, 50, 100].map((addQty) => (
                          <button
                            key={addQty}
                            type="button"
                            onClick={() => updateQuantity(item.supplierProductId, item.quantity + addQty)}
                            className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-[10px] font-mono text-stone-700 transition-colors cursor-pointer"
                          >
                            +{addQty}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preferred Payment Terms Selector */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200">
                <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">Payment Terms</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div
                    onClick={() => setPaymentChoice('COD')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                      paymentChoice === 'COD'
                        ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-normal'
                    }`}
                  >
                    <IndianRupee className={`w-4 h-4 mx-auto mb-1 ${paymentChoice === 'COD' ? 'text-amber-400' : 'text-stone-500'}`} />
                    <span className="block text-xs font-semibold">Cash on Dump</span>
                  </div>

                  <div
                    onClick={() => setPaymentChoice('UPI')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                      paymentChoice === 'UPI'
                        ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-normal'
                    }`}
                  >
                    <QrCode className={`w-4 h-4 mx-auto mb-1 ${paymentChoice === 'UPI' ? 'text-blue-400' : 'text-stone-500'}`} />
                    <span className="block text-xs font-semibold">UPI on Site</span>
                  </div>

                  <div
                    onClick={() => setPaymentChoice('UDHAAR')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                      paymentChoice === 'UDHAAR'
                        ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-normal'
                    }`}
                  >
                    <CreditCard className={`w-4 h-4 mx-auto mb-1 ${paymentChoice === 'UDHAAR' ? 'text-emerald-400' : 'text-stone-500'}`} />
                    <span className="block text-xs font-semibold">Yard Udhaar</span>
                  </div>
                </div>

                {/* Advance Amount Custom Input */}
                <div className="bg-white border border-stone-200 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-stone-700">Advance Amount (Optional)</span>
                    <span className="text-[10px] text-stone-400 font-mono">₹ 0 = Full balance on dump</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={finalTotal}
                        value={advanceAmount || ''}
                        placeholder="0"
                        onChange={(e) => setAdvanceAmount(Math.min(finalTotal, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full pl-7 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>
                    {[2000, 5000, 10000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAdvanceAmount(Math.min(finalTotal, preset))}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-colors ${
                          advanceAmount === preset
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        ₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                      </button>
                    ))}
                  </div>
                  {advanceAmount > 0 && (
                    <div className="flex justify-between text-[11px] font-mono text-stone-600 pt-1.5 border-t border-stone-100">
                      <span>Advance: <strong className="text-stone-900 tabular-nums">₹{advanceAmount.toLocaleString('en-IN')}</strong></span>
                      <span>Balance Due: <strong className="text-stone-900 tabular-nums">₹{(finalTotal - advanceAmount).toLocaleString('en-IN')}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Site Details Form */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-600" />
                    <span>Site Destination ({activeDistrict?.name || 'Darbhanga'})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="text-[11px] font-mono text-stone-700 hover:text-stone-900 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{isLocating ? 'Locating...' : '📍 GPS Auto-Pin'}</span>
                  </button>
                </div>

                {/* Saved Site Addresses Selector */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Saved Site Locations:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setAddressLine(addr.addressLine);
                              setLandmark(addr.landmark || '');
                              setPincode(addr.pincode || '846001');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all text-left flex items-center space-x-1 cursor-pointer border ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <span>📍 {addr.addressLine.slice(0, 24)}...</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(null);
                          setAddressLine('');
                          setLandmark('');
                          setPincode('846001');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border border-dashed cursor-pointer ${
                          selectedAddressId === null
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        + New Site
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Delivery Address (Plot / Ward / Road)
                  </label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => {
                      setAddressLine(e.target.value);
                      setSelectedAddressId(null);
                    }}
                    required
                    className="w-full px-3.5 py-2 text-xs font-normal bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
                    placeholder="e.g. Near Shiv Mandir, Ward 12, Bahadurpur, Darbhanga"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-stone-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
                      placeholder="846001"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-stone-700 mb-1">Landmark</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
                      placeholder="e.g. Behind Saraswati Mandir"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Site Receiver Mobile (Mistri / Supervisor)</label>
                  <input
                    type="tel"
                    value={sitePhone}
                    onChange={(e) => setSitePhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
                    placeholder="10-digit mobile"
                  />
                </div>

                {/* Save address checkbox */}
                {selectedAddressId === null && addressLine && (
                  <label className="flex items-center space-x-2 text-xs text-stone-600 font-normal cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={saveThisAddress}
                      onChange={(e) => setSaveThisAddress(e.target.checked)}
                      className="w-4 h-4 rounded text-stone-900 border-stone-300 focus:ring-stone-800"
                    />
                    <span>Save this construction site address for future orders</span>
                  </label>
                )}

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Driver / Tractor Special Instructions
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
                    placeholder="e.g. Call before delivery, unload near north gate"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Materials Subtotal</span>
                  <span className="font-mono font-medium text-stone-900 tabular-nums">
                    ₹{totalMaterialAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Tractor / Truck Carriage</span>
                  <span className="font-mono font-medium text-stone-900 tabular-nums">
                    {deliveryCharge > 0 ? `₹${deliveryCharge.toLocaleString('en-IN')}` : 'Included'}
                  </span>
                </div>
                <div className="border-t border-dashed border-stone-200 pt-2 flex justify-between text-sm font-semibold text-stone-900">
                  <span>Total Landed Amount</span>
                  <span className="font-mono font-bold text-stone-900 text-base tabular-nums">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-stone-400 pt-1">
                  * Final landed bill verified against electronic delivery challan upon unloading.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-white">
            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer font-mono"
            >
              <span>
                {!user
                  ? 'Sign In to Confirm Site Requisition'
                  : isSubmitting
                  ? 'Submitting Requisition...'
                  : `Confirm & Dispatch to Site (₹${finalTotal.toLocaleString('en-IN')})`}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>
            <p className="text-[11px] text-center text-stone-400 mt-2 font-mono">
              Dealer confirms stock & assigns transport vehicle within 15-30 minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
