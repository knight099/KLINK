import { Prisma } from '@klink/database';

// A supplier row is the lock shared by ALL order, payment and ledger mutations.
// Read state only after acquiring it; a transaction alone does not prevent lost updates.
export async function lockSupplier(tx: Prisma.TransactionClient, supplierId: string) {
  await tx.$queryRaw`SELECT id FROM "Supplier" WHERE id = ${supplierId} FOR UPDATE`;
}
export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const acceptedStatuses = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
const transitions: Record<string, string[]> = {
  PENDING_APPROVAL: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['CANCELLED'],

  DELIVERED: ['COMPLETED'],
};
export function canTransition(from: string, to: string) { return transitions[from]?.includes(to) ?? false; }
export async function reserveStock(tx: Prisma.TransactionClient, supplierId: string, items: { supplierProductId: string; quantity: number }[]) {
  for (const item of items) {
    const updated = await tx.supplierProduct.updateMany({
      where: { id: item.supplierProductId, supplierId, stockQuantity: { gte: item.quantity }, isAvailable: true, masterProduct: { isActive: true } },
      data: { stockQuantity: { decrement: item.quantity } }
    });
    if (updated.count !== 1) throw Object.assign(new Error('Insufficient or unavailable yard stock'), { statusCode: 400 });
  }
}
