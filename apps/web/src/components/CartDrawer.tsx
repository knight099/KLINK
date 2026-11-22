import { useLanguage, LanguageSwitch, FormError, CheckoutQuoteChanges, type CheckoutQuoteTerms, type Message } from '@klink/ui';
import React, { useState, useEffect, useRef } from 'react';
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
  const { t } = useLanguage();
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
  const { user, setIsAuthModalOpen, setAuthModalMode } = useAuth();

  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState(() => localStorage.getItem('klink-delivery-pin') || '');
  const [sitePhone, setSitePhone] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'COD' | 'UPI' | 'UDHAAR'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const [step, setStep] = useState<'cart' | 'delivery' | 'review'>('cart');
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const addressEdited = useRef(false);
  const contactPhone = sitePhone ?? user?.phone ?? '';
  const currentStep = items.length ? step : 'cart';
  const [error, setError] = useState<{ message?: string; status?: number; fallback: Message } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  type CartQuote = CheckoutQuoteTerms & { token: string };
  type ReviewedQuote = { request: string; quote: CartQuote };
  const [quoted, setQuoted] = useState<ReviewedQuote | null>(null);
  const [reviewedQuote, setReviewedQuote] = useState<ReviewedQuote | null>(null);

  const previousUserId = useRef(user?.id);
  const currentUserId = useRef(user?.id);
  currentUserId.current = user?.id;

  useEffect(() => {
    if (previousUserId.current && previousUserId.current !== user?.id) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      setAddressLine('');
      setLandmark('');
      setPincode('');
      setSitePhone(null);
      setInstructions('');
      setSaveThisAddress(false);
      setPaymentChoice('COD');
      setStep('cart');
      setError(null);
      setQuoted(null);
      setReviewedQuote(null);
      addressEdited.current = false;
    }
    previousUserId.current = user?.id;
  }, [user?.id]);

  // Refresh the existing cart's supplier prices when the drawer opens.
  useEffect(() => {
    if (!isOpen) return;
    void refreshCartPrices();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user) return;
    let active = true;
    apiFetch<{ addresses: any[] }>('/customer/addresses')
      .then((res) => {
        if (!active) return;
        const list = res.addresses || [];
        setSavedAddresses(list);
        if (list.length > 0 && !addressEdited.current && !addressLine) {
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(def.id);
          setAddressLine(def.addressLine);
          setLandmark(def.landmark || '');
          setPincode(def.pincode || '');
        }
      })
      .catch((err) => console.log('Could not load saved addresses:', err));
    return () => { active = false; };
  }, [isOpen, user?.id]);

  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const quoteRequest = isOpen && currentStep === 'review' && supplierId && activeDistrict
    ? JSON.stringify({
        supplierId, districtId: activeDistrict.id, pincode: pincode.trim(),
        items: items.map(({ supplierProductId, quantity }) => ({ supplierProductId, quantity }))
      })
    : null;
  const quote = quoteRequest && quoted?.request === quoteRequest ? quoted.quote : null;
  const reviewTotal = quote?.finalTotal ?? finalTotal;

  useEffect(() => {
    if (isOpen && !addressEdited.current) setPincode(localStorage.getItem('klink-delivery-pin') || '');
  }, [isOpen]);

  useEffect(() => {
    if (!quoteRequest || quoted?.request === quoteRequest) return;
    setQuoteError(null);
    const controller = new AbortController();
    apiFetch<CartQuote>('/marketplace/delivery-quote', { method: 'POST', body: quoteRequest, signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        setQuoteError(null);
        setQuoted({ request: quoteRequest, quote: result });
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        setQuoted(null);
        setQuoteError(error.message);
      });
    return () => controller.abort();
  }, [quoteRequest, quoteAttempt, quoted?.request]);

  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = drawer.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) stepHeading.current?.focus();
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (items.length === 0) setStep('cart');
  }, [items.length]);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError({ fallback: 'GPS is unavailable on this device.' });
      return;
    }
    setError(null);
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        addressEdited.current = true;
        const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        setLandmark((prev) => (prev ? `${prev} (GPS: ${coords})` : `GPS Plot Location: ${coords}`));
      },
      () => {
        setIsLocating(false);
        setError({ fallback: 'Location could not be found. Check your location permissions.' });
      },
      { timeout: 8000 }
    );
  };

  const moveTo = (next: typeof step) => {
    setError(null);
    setStep(next);
  };

  const validateDelivery = () => {
    if (!activeDistrict) return 'Please select a district';
    if (addressLine.trim().length < 5) return 'Enter a delivery address with at least 5 characters.';
    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) return 'Enter a 6-digit PIN code.';
    if (!/^\d{10}$/.test(contactPhone.trim())) return 'Enter a 10-digit contact number.';
    return null;
  };

  const handleNext = async () => {
    if (submitting.current || !supplierId || items.length === 0) return;
    if (currentStep === 'cart') {
      moveTo('delivery');
      return;
    }
    const validation = validateDelivery();
    if (validation) {
      setStep('delivery');
      setError({ fallback: validation });
      return;
    }
    if (currentStep === 'delivery') {
      moveTo('review');
      return;
    }
    if (!quote) return;
    if (!user) {
      setAuthModalMode('LOGIN');
      setIsAuthModalOpen(true);
      return;
    }
    if (!activeDistrict) return;

    submitting.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        supplierId,
        quoteToken: quote.token,
        districtId: activeDistrict.id,
        items: items.map((i) => ({
          supplierProductId: i.supplierProductId,
          quantity: i.quantity
        })),
        deliveryAddress: addressLine.trim(),
        landmark,
        pincode: pincode.trim(),
        deliveryInstructions: `${instructions} [Preferred Payment: ${paymentChoice}]`,
        siteContactPhone: contactPhone.trim()
      };

      const res = await apiFetch<{ order: any }>('/customer/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (saveThisAddress && currentUserId.current === user.id) {
        void apiFetch('/customer/addresses', {
          method: 'POST',
          body: JSON.stringify({
            addressLine: payload.deliveryAddress,
            landmark,
            pincode: payload.pincode,
            districtId: payload.districtId
          })
        }).catch((error) => console.error('Could not save delivery address:', error));
      }

      setReviewedQuote(null);
      clearCart();
      setStep('cart');
      onOrderSuccess(res.order);
    } catch (err: any) {
      if (!err?.status || err.status >= 500) {
        setError({ fallback: 'Order response was interrupted. Retry the same order to confirm.' });
      } else if (err.status === 409) {
        setReviewedQuote(quoted);
        setQuoted(null);
        setQuoteAttempt(attempt => attempt + 1);
        setError({ fallback: 'Quote changed or expired. Review the latest terms.' });
      } else {
        setError({ message: err.message, status: err.status, fallback: 'Failed to place order' });
      }
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={drawer}
      aria-labelledby="klink-cart-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting.current) onClose();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-lg overflow-hidden bg-transparent backdrop:bg-stone-950/60"
    >
      <div className="w-full max-w-lg bg-[#FAF9F6] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 border-l border-stone-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 bg-stone-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="klink-cart-title" className="text-sm font-semibold tracking-tight text-stone-100">{t('Cart')}</h2>
              {supplierName && (
                <p className="text-xs text-stone-400 font-mono truncate max-w-[240px]">
                  {t('Supplier')}{': '}<span className="text-stone-200">{supplierName}</span>
                </p>
              )}
            </div>
          </div>
          <LanguageSwitch />
          <button
            aria-label={t('Close')}
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

                {items.length > 0 && (
          <ol className="grid grid-cols-3 gap-2 border-b border-stone-200 bg-white px-4 py-3 text-center text-sm text-stone-700">
            {(['cart', 'delivery', 'review'] as const).map((part, index) => (
              <li key={part} aria-current={currentStep === part ? 'step' : undefined} className={currentStep === part ? 'font-bold text-stone-950' : undefined}>
                {index + 1}. {t(part === 'cart' ? 'Cart' : part === 'delivery' ? 'Delivery details' : 'Review')}
              </li>
            ))}
          </ol>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {items.length > 0 && (
            <h3 ref={stepHeading} tabIndex={-1} className="text-lg font-semibold text-stone-900">
              {t(currentStep === 'cart' ? 'Bill of Materials' : currentStep === 'delivery' ? 'Delivery details' : 'Review')}
            </h3>
          )}
          {error && (
            <FormError failure={error} />
          )}

          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-500 border border-stone-200 flex items-center justify-center text-xl">
                🏗️
              </div>
              <p className="font-semibold text-sm text-stone-900">{t('Your site cart is empty')}</p>
              <p className="text-xs text-stone-500 max-w-xs">
                {t('Find materials to add to your cart.')}
              </p>
            </div>
          ) : (
            <>
              {currentStep === 'cart' && (
                <div className="space-y-3">
                  <p className="text-sm text-stone-700">{t('Supplier')}: <strong>{supplierName}</strong></p>
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
                            onClick={() => updateQuantity(item.supplierProductId, Math.max(0, item.quantity - 1))}
                            className="p-1 hover:bg-white rounded text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
                            aria-label={t('Decrease quantity')}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            max={1_000_000_000}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = e.target.valueAsNumber;
                              if (Number.isFinite(val) && val > 0 && val <= 1_000_000_000) {
                                updateQuantity(item.supplierProductId, val);
                              }
                            }}
                            className="w-14 text-center text-xs font-mono font-bold text-stone-900 bg-white border border-stone-200 rounded py-0.5 px-1 focus:ring-1 focus:ring-stone-800 focus:outline-none"
                            aria-label={`${t('Quantity')}: ${item.masterProductName}`}
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.supplierProductId, Math.min(1_000_000_000, item.quantity + 1))}
                            className="p-1 hover:bg-white rounded text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
                            aria-label={t('Increase quantity')}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.supplierProductId)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          aria-label={t('Remove item')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              )}

              {currentStep === 'delivery' && (
                <>
              {/* Preferred Payment Terms Selector */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200">
                <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">{t('Payment Terms')}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    aria-pressed={paymentChoice === 'COD'}
                    onClick={() => setPaymentChoice('COD')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                      paymentChoice === 'COD'
                        ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-normal'
                    }`}
                  >
                    <IndianRupee className={`w-4 h-4 mx-auto mb-1 ${paymentChoice === 'COD' ? 'text-amber-400' : 'text-stone-500'}`} />
                    <span className="block text-xs font-semibold">{t('Cash on Dump')}</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={paymentChoice === 'UPI'}
                    onClick={() => setPaymentChoice('UPI')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                      paymentChoice === 'UPI'
                        ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-normal'
                    }`}
                  >
                    <QrCode className={`w-4 h-4 mx-auto mb-1 ${paymentChoice === 'UPI' ? 'text-blue-400' : 'text-stone-500'}`} />
                    <span className="block text-xs font-semibold">{t('UPI on Site')}</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={paymentChoice === 'UDHAAR'}
                    onClick={() => setPaymentChoice('UDHAAR')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                      paymentChoice === 'UDHAAR'
                        ? 'border-stone-900 bg-stone-900 text-white font-medium shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-normal'
                    }`}
                  >
                    <CreditCard className={`w-4 h-4 mx-auto mb-1 ${paymentChoice === 'UDHAAR' ? 'text-emerald-400' : 'text-stone-500'}`} />
                    <span className="block text-xs font-semibold">{t('Yard Udhaar')}</span>
                  </button>
                </div>

              </div>

              {/* Delivery Site Details Form */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-600" />
                    <span>{t('Delivery District')} · {activeDistrict?.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="text-[11px] font-mono text-stone-700 hover:text-stone-900 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{isLocating ? t('Finding location…') : t('Use current location')}</span>
                  </button>
                </div>

                {/* Saved Site Addresses Selector */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">{t('Saved Site Locations:')}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              addressEdited.current = true;
                              setSelectedAddressId(addr.id);
                              setAddressLine(addr.addressLine);
                              setLandmark(addr.landmark || '');
                              setPincode(addr.pincode || '');
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
                          addressEdited.current = true;
                          setSelectedAddressId(null);
                          setAddressLine('');
                          setLandmark('');
                          setPincode('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border border-dashed cursor-pointer ${
                          selectedAddressId === null
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {t('New address')}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="klink-cart-addressLine" className="block text-xs font-medium text-stone-700 mb-1">
                    {t('Delivery Address (Plot / Ward / Road)')}
                  </label>
                  <input
                    type="text"
                    id="klink-cart-addressLine"
                    value={addressLine}
                    onChange={(e) => {
                      addressEdited.current = true;
                      setAddressLine(e.target.value);
                      setSelectedAddressId(null);
                    }}
                    required
                    className="klink-field w-full px-3.5 py-2 text-xs font-normal bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
                    placeholder="e.g. Near Shiv Mandir, Ward 12, Bahadurpur, Darbhanga"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="col-span-1">
                    <label htmlFor="klink-cart-pincode" className="block text-xs font-medium text-stone-700 mb-1">{t('PIN Code')}</label>
                    <input
                      type="text"
                      maxLength={6}
                      id="klink-cart-pincode"
                    value={pincode}
                      onChange={(event) => {
                        addressEdited.current = true;
                        setPincode(event.target.value);
                      }}
                      required
                      className="klink-field w-full px-3 py-2 text-xs font-mono bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
                      placeholder="846001"
                    />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="klink-cart-landmark" className="block text-xs font-medium text-stone-700 mb-1">{t('Landmark')}</label>
                    <input
                      type="text"
                      id="klink-cart-landmark"
                    value={landmark}
                      onChange={(event) => {
                        addressEdited.current = true;
                        setLandmark(event.target.value);
                      }}
                      className="klink-field w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
                      placeholder="e.g. Behind Saraswati Mandir"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="klink-cart-sitePhone" className="block text-xs font-medium text-stone-700 mb-1">{t('Site Receiver Mobile (Mistri / Supervisor)')}</label>
                  <input
                    type="tel"
                    id="klink-cart-sitePhone"
                    value={contactPhone}
                    onChange={(e) => setSitePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    className="klink-field w-full px-3.5 py-2 text-xs font-mono bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
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
                    <span>{t('Save this construction site address for future orders')}</span>
                  </label>
                )}

                <div>
                  <label htmlFor="klink-cart-instructions" className="block text-xs font-medium text-stone-700 mb-1">
                    {t('Driver / Tractor Special Instructions')}
                  </label>
                  <input
                    type="text"
                    id="klink-cart-instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="klink-field w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-stone-800 focus:outline-none"
                    placeholder="e.g. Call before delivery, unload near north gate"
                  />
                </div>
              </div>

                </>
              )}

              {currentStep === 'review' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
                    <h4 className="font-semibold">{t('Cart')}</h4>
                    <ul className="mt-2 space-y-1">
                      {items.map((item) => <li key={item.supplierProductId}>{item.masterProductName} × {item.quantity} {item.unit}</li>)}
                    </ul>
                    <button type="button" className="min-h-11 underline" disabled={isSubmitting} onClick={() => moveTo('cart')}>{t('Edit cart')}</button>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
                    <h4 className="font-semibold">{t('Delivery details')}</h4>
                    <p className="mt-2 break-words">{addressLine}</p>
                    <p>{activeDistrict?.name} · {pincode}</p>
                    {landmark && <p className="break-words">{landmark}</p>}
                    <p>{t('Contact number')}: {contactPhone}</p>
                    <p>{t('Payment Terms')}: {t(paymentChoice === 'COD' ? 'Cash on Dump' : paymentChoice === 'UPI' ? 'UPI on Site' : 'Yard Udhaar')}</p>
                    {instructions && <p className="break-words">{instructions}</p>}
                    <button type="button" className="min-h-11 underline" disabled={isSubmitting} onClick={() => moveTo('delivery')}>{t('Edit delivery details')}</button>
                  </div>
                </div>
              )}

              {currentStep === 'review' && !quote && (
                <FormError failure={{ fallback: quoteError ? 'Could not get a quote. Check your PIN code and cart.' : 'Getting the latest yard quote…' }} />
              )}
              {currentStep === 'review' && quoteError && !quote && (
                <button type="button" className="min-h-11 underline" onClick={() => {
                  setQuoteError(null);
                  setQuoteAttempt(attempt => attempt + 1);
                }}>{t('Try again')}</button>
              )}
              {reviewedQuote?.request === quoteRequest && (
                <div aria-live="polite">
                  {quote && <CheckoutQuoteChanges previous={reviewedQuote.quote} updated={quote} />}
                </div>
              )}
              {quote?.offer && <p className="text-sm font-semibold">{t('Delivery estimate after ordering')}: {quote.offer.minHours}–{quote.offer.maxHours} {t('Hours')}</p>}
              {/* Price Breakdown */}
              <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>{t('Materials Subtotal')}</span>
                  <span className="font-mono font-medium text-stone-900 tabular-nums">
                    ₹{(quote?.materialTotal ?? totalMaterialAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>{t('Tractor / Truck Carriage')}</span>
                  <span className="font-mono font-medium text-stone-900 tabular-nums">
                    ₹{(quote?.deliveryCharge ?? deliveryCharge).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t border-dashed border-stone-200 pt-2 flex justify-between text-sm font-semibold text-stone-900">
                  <span>{t('Amount due')}</span>
                  <span className="font-mono font-bold text-stone-900 text-base tabular-nums">₹{reviewTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="pt-1 text-stone-700">{t('This is your payment preference. No payment is collected at checkout.')} {t('The full order amount remains due until the yard records a received payment.')}</p>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-white">
            {currentStep === 'delivery' && (
              <button type="button" className="mb-2 min-h-11 text-sm underline" onClick={() => moveTo('cart')}>{t('Back to cart')}</button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || (currentStep === 'review' && !quote)}
              className="klink-primary w-full flex items-center justify-center gap-2"
            >
              <span>
                {currentStep === 'cart' ? t('Continue to delivery')
                  : currentStep === 'delivery' ? t('Continue to review')
                  : !user ? t('Sign in to place your order')
                  : isSubmitting ? t('Placing order…')
                  : `${t('Place order')} (₹${reviewTotal.toLocaleString('en-IN')})`}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};
