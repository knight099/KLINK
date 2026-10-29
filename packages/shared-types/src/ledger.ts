import { z } from 'zod';

export const PaymentModeEnum = z.enum([
  'CASH',
  'UPI_DIRECT',
  'BANK_TRANSFER',
  'CHEQUE',
  'UDHAAR'
]);
export type PaymentMode = z.infer<typeof PaymentModeEnum>;

export const RecordPaymentInputSchema = z.object({
  orderId: z.string().optional(),
  customerId: z.string().optional(),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMode: PaymentModeEnum,
  notes: z.string().optional(),
  isUdhaarSettlement: z.boolean().default(false)
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentInputSchema>;

export const PaymentRecordSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  customerId: z.string(),
  orderId: z.string().nullable().optional(),
  amount: z.number(),
  paymentMode: PaymentModeEnum,
  notes: z.string().nullable().optional(),
  recordedAt: z.string()
});
export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;

export const CustomerLedgerSummarySchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  totalPurchased: z.number(),
  totalPaid: z.number(),
  outstandingBalance: z.number(),
  lastOrderDate: z.string().nullable().optional(),
  lastPaymentDate: z.string().nullable().optional()
});
export type CustomerLedgerSummary = z.infer<typeof CustomerLedgerSummarySchema>;

