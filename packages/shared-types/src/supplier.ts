import { z } from 'zod';
import { UnitEnum, MasterProductSchema } from './catalog';

export const SupplierStatusEnum = z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED']);
export type SupplierStatus = z.infer<typeof SupplierStatusEnum>;

export const SupplierProfileSchema = z.object({
  id: z.string(),
  businessName: z.string(),
  ownerName: z.string(),
  phone: z.string(),
  address: z.string(),
  districtId: z.string(),
  districtName: z.string().optional(),
  gstin: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: SupplierStatusEnum,
  rating: z.number().default(5.0),
  totalOrdersCount: z.number().default(0),
  isVerified: z.boolean().default(false),
  createdAt: z.string()
});
export type SupplierProfile = z.infer<typeof SupplierProfileSchema>;

export const UpdateSupplierProfileInputSchema = z.object({
  businessName: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  gstin: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional()
});
export type UpdateSupplierProfileInput = z.infer<typeof UpdateSupplierProfileInputSchema>;

export const SupplierProductSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  masterProductId: z.string(),
  sellingPrice: z.number().positive('Price must be greater than 0'),
  unit: UnitEnum,
  stockQuantity: z.number().min(0),
  minOrderQty: z.number().min(1).default(1),
  deliveryCharge: z.number().min(0).default(0),
  isAvailable: z.boolean().default(true),
  lowStockThreshold: z.number().min(0).default(10),
  masterProduct: MasterProductSchema.optional()
});
export type SupplierProduct = z.infer<typeof SupplierProductSchema>;

export const AddSupplierProductInputSchema = z.object({
  masterProductId: z.string(),
  sellingPrice: z.number().positive(),
  unit: UnitEnum,
  stockQuantity: z.number().min(0),
  minOrderQty: z.number().min(1).default(1),
  deliveryCharge: z.number().min(0).default(0),
  lowStockThreshold: z.number().min(0).default(10)
});
export type AddSupplierProductInput = z.infer<typeof AddSupplierProductInputSchema>;

export const VehicleTypeEnum = z.enum([
  'TRACTOR_TROLLEY',
  'TIPPER_TRUCK',
  'CHHOTA_HATHI',
  'PICKUP_TRUCK'
]);
export type VehicleType = z.infer<typeof VehicleTypeEnum>;

export const VehicleStatusEnum = z.enum(['AVAILABLE', 'ON_TRIP', 'MAINTENANCE']);
export type VehicleStatus = z.infer<typeof VehicleStatusEnum>;

export const CreateSupplierVehicleInputSchema = z.object({
  vehicleNumber: z.string().min(3, 'Vehicle number is required'),
  vehicleType: VehicleTypeEnum.default('TRACTOR_TROLLEY'),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  capacityInfo: z.string().optional(),
  status: VehicleStatusEnum.default('AVAILABLE')
});
export type CreateSupplierVehicleInput = z.infer<typeof CreateSupplierVehicleInputSchema>;

export const UpdateSupplierVehicleInputSchema = z.object({
  vehicleNumber: z.string().min(3).optional(),
  vehicleType: VehicleTypeEnum.optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  capacityInfo: z.string().optional(),
  status: VehicleStatusEnum.optional()
});
export type UpdateSupplierVehicleInput = z.infer<typeof UpdateSupplierVehicleInputSchema>;

export const UpdateSupplierProductInputSchema = z.object({
  sellingPrice: z.number().positive().optional(),
  stockQuantity: z.number().min(0).optional(),
  minOrderQty: z.number().min(1).optional(),
  deliveryCharge: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  lowStockThreshold: z.number().min(0).optional()
});
export type UpdateSupplierProductInput = z.infer<typeof UpdateSupplierProductInputSchema>;
