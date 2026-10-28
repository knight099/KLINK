import { z } from 'zod';
import { UnitEnum } from './catalog';

export const OrderStatusEnum = z.enum([
  'PENDING_APPROVAL',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const PaymentStatusEnum = z.enum([
  'PENDING',
  'PARTIALLY_PAID',
  'PAID',
  'UDHAAR'
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const OrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  supplierProductId: z.string(),
  masterProductName: z.string(),
  unit: UnitEnum,
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive()
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const CreateOrderItemInputSchema = z.object({
  supplierProductId: z.string(),
  quantity: z.number().positive()
});

export const CreateOrderInputSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required (1 cart = 1 supplier)'),
  districtId: z.string().min(1, 'District is required'),
  items: z.array(CreateOrderItemInputSchema).min(1, 'At least 1 item is required'),
  deliveryAddress: z.string().min(5, 'Delivery site address is required'),
  landmark: z.string().optional(),
  pincode: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  siteContactPhone: z.string().min(10, 'Contact phone for delivery site')
});
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const UpdateOrderStatusInputSchema = z.object({
  status: OrderStatusEnum,
  rejectionReason: z.string().optional(),
  note: z.string().optional()
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusInputSchema>;

export const DispatchDeliveryInputSchema = z.object({
  driverName: z.string().min(2, 'Driver name is required'),
  driverPhone: z.string().min(10, 'Driver phone is required'),
  vehicleNumber: z.string().min(4, 'Vehicle/Tractor/Lorry number is required'),
  deliveryChallanNo: z.string().optional(),
  deliveryInstructions: z.string().optional()
});
export type DispatchDeliveryInput = z.infer<typeof DispatchDeliveryInputSchema>;

export const CompleteDeliveryInputSchema = z.object({
  receivedBy: z.string().optional(),
  notes: z.string().optional()
});
export type CompleteDeliveryInput = z.infer<typeof CompleteDeliveryInputSchema>;

export const ManualOrderItemInputSchema = z.object({
  supplierProductId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive().optional()
});

export const CreateManualOrderInputSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(2).optional(),
  customerPhone: z.string().min(10).optional(),
  customerAddress: z.string().optional(),
  items: z.array(ManualOrderItemInputSchema).min(1, 'At least 1 product required'),
  deliveryCharge: z.number().min(0).default(0),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  landmark: z.string().optional(),
  pincode: z.string().optional(),
  siteContactPhone: z.string().min(10),
  deliveryInstructions: z.string().optional(),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  amountPaid: z.number().min(0).default(0),
  paymentMode: z.enum(['CASH', 'UPI_DIRECT', 'BANK_TRANSFER', 'CHEQUE', 'UDHAAR']).default('CASH'),
  paymentNotes: z.string().optional(),
  initialStatus: z.enum(['PENDING_APPROVAL', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED']).default('CONFIRMED')
});
export type CreateManualOrderInput = z.infer<typeof CreateManualOrderInputSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  supplierId: z.string(),
  supplierBusinessName: z.string().optional(),
  districtId: z.string(),
  totalMaterialAmount: z.number(),
  deliveryCharge: z.number(),
  finalTotal: z.number(),
  amountPaid: z.number().default(0),
  balancePending: z.number().default(0),
  status: OrderStatusEnum,
  paymentStatus: PaymentStatusEnum.default('PENDING'),
  rejectionReason: z.string().nullable().optional(),
  deliveryAddress: z.string(),
  landmark: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  deliveryInstructions: z.string().nullable().optional(),
  siteContactPhone: z.string(),
  driverName: z.string().nullable().optional(),
  driverPhone: z.string().nullable().optional(),
  vehicleNumber: z.string().nullable().optional(),
  deliveryChallanNo: z.string().nullable().optional(),
  dispatchedAt: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  items: z.array(OrderItemSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Order = z.infer<typeof OrderSchema>;

