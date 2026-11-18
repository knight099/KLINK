import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { FormNotice, useLanguage, type Message } from '@klink/ui';
import { apiFetch } from '../lib/api';
import { useCart } from '../lib/cart-context';
import { useDistrict } from '../lib/district-context';

interface SupplierQuote {
  supplierProductId: string;
  supplierId: string;
  businessName: string;
  unit: string;
  sellingPrice: number;
  deliveryCharge: number;
  totalEstimated: number;
  stockQuantity: number;
  minOrderQty: number;
  inStock: boolean;
  meetsMinOrder: boolean;
}

type Quotes =
  | { query: string; comparisons: SupplierQuote[] }
  | { query: string; error: true };

const unitLabels: Partial<Record<string, Message>> = {
  BAG: 'bag', CFT: 'cubic foot', PIECE: 'piece', KG: 'kilogram', TONNE: 'tonne',
  QUINTAL: 'quintal', THOUSAND_PIECES: 'thousand pieces', TRUCK_LOAD: 'truck load',
};

const formatPrice = (amount: number) =>
  '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export function MaterialComparison({ material, onBack, onOpenCart }: {
  material: { id: string; name: string; defaultUnit: string; description?: string };
  onBack: () => void;
  onOpenCart: () => void;
}) {
  const { t } = useLanguage();
  const { activeDistrict, isLoading: isLoadingDistrict } = useDistrict();
  const { addItem, items } = useCart();
  const heading = useRef<HTMLHeadingElement>(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [quotes, setQuotes] = useState<Quotes | null>(null);
  const [attempt, setAttempt] = useState(0);
  const quantity = Number(quantityInput);
  const validQuantity = Number.isFinite(quantity) && quantity > 0 && quantity <= 1_000_000_000;
  const districtId = activeDistrict?.id;
  const query = validQuantity && districtId
    ? new URLSearchParams({ districtId, quantity: String(quantity) }).toString()
    : null;
  const current = quotes?.query === query ? quotes : null;
  const comparisons = current && 'comparisons' in current ? current.comparisons : [];
  const quoteUnits = [...new Set(comparisons.map((quote) => quote.unit))];
  const availableToAdd = (quote: SupplierQuote) => {
    const inCart = items.find((item) => item.supplierProductId === quote.supplierProductId)?.quantity || 0;
    return Math.max(0, quote.stockQuantity - inCart);
  };
  const canAdd = (quote: SupplierQuote) =>
    quote.inStock && quote.meetsMinOrder && quantity <= availableToAdd(quote);

  const unit = (code: string) => {
    const label = unitLabels[code.toUpperCase()];
    return label ? t(label) : code;
  };

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [material.id]);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const request = window.setTimeout(async () => {
      try {
        const data = await apiFetch<{ comparisons: SupplierQuote[] }>(
          `/marketplace/compare/${encodeURIComponent(material.id)}?${query}`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) setQuotes({ query, comparisons: data.comparisons });
      } catch {
        if (!controller.signal.aborted) setQuotes({ query, error: true });
      }
    }, 160);
    return () => {
      window.clearTimeout(request);
      controller.abort();
    };
  }, [material.id, query, attempt]);

  function handleAdd(quote: SupplierQuote) {
    if (!canAdd(quote)) return;
    const added = addItem(quote.supplierId, quote.businessName, {
      supplierProductId: quote.supplierProductId,
      masterProductName: material.name,
      unit: quote.unit,
      unitPrice: quote.sellingPrice,
      deliveryCharge: quote.deliveryCharge,
    }, quantity);
    if (added) onOpenCart();
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-stone-700">
        <ArrowLeft className="size-4" aria-hidden="true" /> {t('Back to materials')}
      </button>
      <div className="space-y-2">
        <h1 ref={heading} tabIndex={-1} className="break-words text-2xl font-semibold text-stone-900 sm:text-3xl">{material.name}</h1>
        {material.description && <p className="text-sm text-stone-700">{material.description}</p>}
        {activeDistrict && <p className="text-sm text-stone-700">{t('Delivery District')} · {activeDistrict.name}</p>}
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <label htmlFor="compare-quantity" className="block text-sm font-semibold text-stone-900">{t('Quantity')}</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="compare-quantity"
            type="number"
            step="any"
            inputMode="decimal"
            value={quantityInput}
            aria-invalid={!validQuantity}
            aria-describedby={!validQuantity ? 'compare-quantity-error' : undefined}
            onChange={(event) => setQuantityInput(event.target.value)}
            className="klink-field w-28 rounded-lg border border-stone-400 px-3"
          />
          {quoteUnits.length < 2 && <span className="text-sm text-stone-700">{unit(quoteUnits[0] || material.defaultUnit)}</span>}
        </div>
        {!validQuantity && <p id="compare-quantity-error" className="mt-2 text-sm text-red-800">{t('Enter a quantity greater than zero and at most 1 billion.')}</p>}
      </div>

      <h2 className="text-lg font-semibold text-stone-900">{t('Compare suppliers')}</h2>
      {(isLoadingDistrict || (query && !current)) && <FormNotice>{t('Loading supplier prices…')}</FormNotice>}
      {!isLoadingDistrict && !districtId && <FormNotice>{t('Choose a delivery district')}</FormNotice>}
      {current && 'error' in current && (
        <FormNotice error>
          <p>{t('Could not load supplier prices. Try again.')}</p>
          <button className="mt-2 min-h-11 underline" type="button" onClick={() => { setQuotes(null); setAttempt(attempt + 1); }}>{t('Try again')}</button>
        </FormNotice>
      )}
      {current && 'comparisons' in current && comparisons.length === 0 && (
        <FormNotice>{t('No suppliers currently stock this material.')}</FormNotice>
      )}
      {quoteUnits.length > 1 && <p className="text-sm text-stone-700">{t('Compare prices within the same unit.')}</p>}
      {quoteUnits.map((code) => {
        const offers = comparisons.filter((quote) => quote.unit === code);
        const lowest = offers.find(canAdd);
        return (
          <section key={code} aria-label={unit(code)} className="space-y-3">
            {quoteUnits.length > 1 && <h3 className="text-base font-semibold">{unit(code)}</h3>}
            <div className="grid gap-4 sm:grid-cols-2">
              {offers.map((quote) => (
                <article key={quote.supplierProductId} className="min-w-0 space-y-4 rounded-xl border border-stone-200 bg-white p-4">
                  <div className="space-y-1">
                    <p id={`quote-supplier-${quote.supplierProductId}`} className="break-words font-semibold text-stone-900">{quote.businessName}</p>
                    {quote === lowest && <p className="text-sm font-medium text-emerald-800">{t('Lowest delivered total')}</p>}
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex flex-wrap justify-between gap-x-2"><dt>{t('Order quantity')}</dt><dd>{quantity} {unit(code)}</dd></div>
                    <div className="flex flex-wrap justify-between gap-x-2"><dt>{t('Unit price')}</dt><dd>{formatPrice(quote.sellingPrice)} / {unit(quote.unit)}</dd></div>
                    <div className="flex flex-wrap justify-between gap-x-2"><dt>{t('Delivery charge')}</dt><dd>{formatPrice(quote.deliveryCharge)}</dd></div>
                    <div className="flex flex-wrap justify-between gap-x-2 border-t border-stone-200 pt-2 font-semibold"><dt>{t('Delivered total')}</dt><dd>{formatPrice(quote.totalEstimated)}</dd></div>
                  </dl>
                  {quantity > availableToAdd(quote) && <p className="text-sm text-red-800">{t('Available to add')}: {availableToAdd(quote)} {unit(code)}</p>}
                  {!quote.meetsMinOrder && <p className="text-sm text-red-800">{t('Minimum order quantity:')} {quote.minOrderQty} {unit(quote.unit)}</p>}
                  <button
                    type="button"
                    className="klink-primary flex w-full items-center justify-center gap-2"
                    aria-describedby={`quote-supplier-${quote.supplierProductId}`}
                    onClick={() => handleAdd(quote)}
                    disabled={!canAdd(quote)}
                  >
                    <ShoppingCart className="size-4" aria-hidden="true" /> {t('Add to Cart')}
                  </button>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
