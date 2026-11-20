import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { Prisma } from '@klink/database';
import { money } from './orders';

export const pinCode = z.string().regex(/^[1-9][0-9]{5}$/);
const hours = z.number().int().min(1).max(336);
export const yardDeliverySettings = z.object({
  deliveryPincodes: z.array(pinCode).max(100).refine(pins => new Set(pins).size === pins.length),
  deliveryMinHours: hours.nullable(),
  deliveryMaxHours: hours.nullable()
}).refine(value => value.deliveryPincodes.length === 0
  ? value.deliveryMinHours === null && value.deliveryMaxHours === null
  : value.deliveryMinHours !== null && value.deliveryMaxHours !== null && value.deliveryMinHours < value.deliveryMaxHours,
'Configure PIN codes and an increasing delivery estimate, or clear all delivery settings');

type Yard = z.infer<typeof yardDeliverySettings>;
export function deliveryOffer(yard: Yard, pincode?: string) {
  if (!yard.deliveryPincodes.length || yard.deliveryMinHours === null || yard.deliveryMaxHours === null) return null;
  return {
    eligible: pincode ? yard.deliveryPincodes.includes(pincode) : null,
    minHours: yard.deliveryMinHours,
    maxHours: yard.deliveryMaxHours
  };
}

const dateTime = z.iso.datetime({ offset: true });
export const deliveryWindow = z.object({ startsAt: dateTime, endsAt: dateTime })
  .refine(value => Date.parse(value.startsAt) < Date.parse(value.endsAt), 'The window must end after it starts');
type Window = z.infer<typeof deliveryWindow>;
type DeliveryEvent = { type: 'PROPOSED' | 'BUYER_APPROVED' | 'YARD_CONFIRMED'; at: string; window: Window };
export type DeliverySchedule = {
  requested: Window;
  respondBy: string;
  confirmed?: Window;
  proposed?: Window;
  events: DeliveryEvent[];
};

export function scheduleFromOffer(offer: NonNullable<ReturnType<typeof deliveryOffer>>, now = Date.now()): DeliverySchedule {
  const after = (hours: number) => new Date(now + hours * 3_600_000).toISOString();
  return {
    requested: { startsAt: after(offer.minHours), endsAt: after(offer.maxHours) },
    respondBy: after(1),
    events: []
  };
}

export const checkoutQuoteInput = z.object({
  supplierId: z.string().min(1),
  districtId: z.string().min(1),
  pincode: pinCode,
  items: z.array(z.object({
    supplierProductId: z.string().min(1),
    quantity: z.number().finite().positive().max(1_000_000_000)
  })).min(1).max(100).refine(items => new Set(items.map(item => item.supplierProductId)).size === items.length)
});

function invalid(message: string): never {
  throw Object.assign(new Error(message), { statusCode: 400 });
}

export async function buildCheckout(
  tx: Prisma.TransactionClient,
  { supplierId, districtId, pincode, items }: Omit<z.infer<typeof checkoutQuoteInput>, 'pincode'> & { pincode?: string }
) {
  const supplier = await tx.supplier.findFirst({ where: { id: supplierId, status: 'ACTIVE' } });
  if (!supplier) return invalid('Supplier not found or not currently active');
  const area = await tx.supplierServiceArea.findFirst({
    where: { districtId, supplierId, isActive: true, district: { isActive: true } }
  });
  if (!area) return invalid('Supplier does not serve this active district');
  const offer = deliveryOffer(supplier, pincode);
  if (offer && offer.eligible !== true) return invalid('This yard does not deliver to the requested PIN code');
  const products = await tx.supplierProduct.findMany({
    where: { supplierId, id: { in: items.map(item => item.supplierProductId) } },
    include: { masterProduct: true }
  });
  const byId = new Map(products.map(product => [product.id, product]));
  let deliveryCharge = 0;
  const lines = items.map(item => {
    const product = byId.get(item.supplierProductId);
    if (!product || !product.isAvailable || !product.masterProduct.isActive || product.stockQuantity < item.quantity) {
      return invalid('Material is unavailable or has insufficient stock');
    }
    if (item.quantity < product.minOrderQty) {
      return invalid(`Minimum order quantity for ${product.masterProduct.name} is ${product.minOrderQty} ${product.unit}`);
    }
    deliveryCharge = Math.max(deliveryCharge, product.deliveryCharge);
    return {
      supplierProductId: product.id,
      masterProductName: product.masterProduct.name,
      unit: product.unit,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      totalPrice: money(product.sellingPrice * item.quantity)
    };
  });
  const materialTotal = money(lines.reduce((sum, line) => sum + line.totalPrice, 0));
  return { lines, materialTotal, deliveryCharge, finalTotal: money(materialTotal + deliveryCharge), offer };
}

export function checkoutToken(
  input: { supplierId: string; districtId: string; pincode?: string },
  quote: Awaited<ReturnType<typeof buildCheckout>>,
  expiresAt: number
) {
  const { supplierId, districtId, pincode } = input;
  const digest = createHmac('sha256', process.env.JWT_SECRET!).update('yard-delivery-quote:').update(JSON.stringify({
    supplierId, districtId, pincode, quote, expiresAt
  })).digest('hex');
  return `${expiresAt}.${digest}`;
}

type CheckoutIntent = Omit<z.infer<typeof checkoutQuoteInput>, 'pincode'> & { pincode?: string };

function signCheckoutIntent(token: string, { supplierId, districtId, pincode, items }: CheckoutIntent) {
  return createHmac('sha256', process.env.JWT_SECRET!)
    .update('yard-delivery-quote-intent:')
    .update(JSON.stringify([token, supplierId, districtId, pincode, items.map(item => [item.supplierProductId, item.quantity])]))
    .digest('base64url');
}

export function issueCheckoutToken(intent: CheckoutIntent, quote: Awaited<ReturnType<typeof buildCheckout>>, expiresAt: number) {
  const token = checkoutToken(intent, quote, expiresAt);
  return quote.offer ? `${token}.${signCheckoutIntent(token, intent)}` : token;
}

export function checkoutQuoteStatus(token: string | undefined, intent: CheckoutIntent, quote: Awaited<ReturnType<typeof buildCheckout>>) {
  if (!token) return quote.offer ? 'INVALID' : 'CURRENT';
  const match = /^(\d+)\.([a-f0-9]{64})(?:\.([A-Za-z0-9_-]{43}))?$/.exec(token);
  if (!match) return 'INVALID';
  const [, timestamp, digest, signature] = match;
  const expiresAt = Number(timestamp);
  const now = Date.now();
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + 15 * 60_000) return 'INVALID';
  const reviewed = `${timestamp}.${digest}`;
  const current = checkoutToken(intent, quote, expiresAt);
  if (!signature) return reviewed === current ? 'CURRENT' : 'INVALID';
  const expected = signCheckoutIntent(reviewed, intent);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return 'INVALID';
  return reviewed === current ? 'CURRENT' : 'CHANGED';
}
