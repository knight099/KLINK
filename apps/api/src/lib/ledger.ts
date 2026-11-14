import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@klink/database';
import { acceptedStatuses, lockSupplier, money } from './orders';

async function ledgerTotals(tx: Prisma.TransactionClient, supplierId: string, customerId: string) {
  const accepted = { supplierId, customerId, status: { in: acceptedStatuses } };
  const [orders, payments, lastOrder, lastPayment] = await Promise.all([
    tx.order.aggregate({ where: accepted, _sum: { finalTotal: true } }),
    tx.paymentRecord.aggregate({ where: { supplierId, customerId }, _sum: { amount: true } }),
    tx.order.findFirst({ where: accepted, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    tx.paymentRecord.findFirst({ where: { supplierId, customerId }, orderBy: { recordedAt: 'desc' }, select: { recordedAt: true } })
  ]);
  const totalPurchased = money(orders._sum.finalTotal || 0);
  const totalPaid = money(payments._sum.amount || 0);
  return { totalPurchased, totalPaid, outstandingBalance: Math.max(0, money(totalPurchased - totalPaid)), lastOrderDate: lastOrder?.createdAt || null, lastPaymentDate: lastPayment?.recordedAt || null };
}

// Call while holding the supplier lock used by every financial mutation.
export async function recalculateCustomerLedger(tx: Prisma.TransactionClient, supplierId: string, customerId: string) {
  const data = await ledgerTotals(tx, supplierId, customerId);
  return tx.customerLedger.upsert({ where: { supplierId_customerId: { supplierId, customerId } }, update: data, create: { supplierId, customerId, ...data } });
}

export async function reconcileLedgers(db: PrismaClient, reason: string, apply = false) {
  if (!reason.trim()) throw new Error('A reconciliation reason is required');
  return db.$transaction(async tx => {
    const suppliers = await tx.supplier.findMany({ select: { id: true }, orderBy: { id: 'asc' } });
    for (const supplier of suppliers) await lockSupplier(tx, supplier.id);
    const ledgers = await tx.customerLedger.findMany();
    const [orderPairs, paymentPairs] = await Promise.all([
      tx.order.findMany({ where: { status: { in: acceptedStatuses } }, distinct: ['supplierId', 'customerId'], select: { supplierId: true, customerId: true } }),
      tx.paymentRecord.findMany({ distinct: ['supplierId', 'customerId'], select: { supplierId: true, customerId: true } })
    ]);
    const pairKey = (row: { supplierId: string; customerId: string }) => JSON.stringify([row.supplierId, row.customerId]);
    const existing = new Map(ledgers.map(row => [pairKey(row), row]));
    const pairs = new Map([...ledgers, ...orderPairs, ...paymentPairs].map(row => [pairKey(row), row]));
    const changes = [];
    for (const [key, { supplierId, customerId }] of pairs) {
      const ledger = existing.get(key);
      const before = ledger ? { totalPurchased: ledger.totalPurchased, totalPaid: ledger.totalPaid, outstandingBalance: ledger.outstandingBalance, lastOrderDate: ledger.lastOrderDate, lastPaymentDate: ledger.lastPaymentDate } : null;
      const after = await ledgerTotals(tx, supplierId, customerId);
      if (JSON.stringify(before) === JSON.stringify(after)) continue;
      const id = ledger?.id || randomUUID();
      changes.push({ ledgerId: id, before, after });
      if (apply) {
        await tx.$executeRaw`INSERT INTO "LedgerReconciliation" ("id", "ledgerId", "reason", "before", "after") VALUES (${randomUUID()}, ${id}, ${reason}, ${JSON.stringify(before)}::jsonb, ${JSON.stringify(after)}::jsonb)`;
        if (ledger) await tx.customerLedger.update({ where: { id }, data: after });
        else await tx.customerLedger.create({ data: { id, supplierId, customerId, ...after } });
      }
    }
    return changes;
  }, { timeout: 30_000, isolationLevel: 'Serializable' });
}
