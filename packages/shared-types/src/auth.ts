import { z } from 'zod';

export const UserRoleEnum = z.enum(['ADMIN', 'SUPPLIER', 'CUSTOMER']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const LoginInputSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: UserRoleEnum.optional()
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterCustomerInputSchema = z.object({
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name is required'),
  districtId: z.string().min(1, 'District is required'),
  addressLine: z.string().optional(),
  landmark: z.string().optional(),
  pincode: z.string().optional()
});
export type RegisterCustomerInput = z.infer<typeof RegisterCustomerInputSchema>;

export const OnboardSupplierInputSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(6),
  businessName: z.string().min(2, 'Shop/Business name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  districtId: z.string().min(1, 'District is required'),
  address: z.string().min(5, 'Store address is required'),
  gstin: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional()
});
export type OnboardSupplierInput = z.infer<typeof OnboardSupplierInputSchema>;

export const AdminCreateSupplierInputSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  temporaryPassword: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(2, 'Shop/Business name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  districtId: z.string().min(1, 'District is required'),
  address: z.string().min(5, 'Store address is required'),
  gstin: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional()
});
export type AdminCreateSupplierInput = z.infer<typeof AdminCreateSupplierInputSchema>;

export const ChangePasswordInputSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

export const AuthTokenPayloadSchema = z.object({
  id: z.string(),
  phone: z.string(),
  role: UserRoleEnum,
  supplierId: z.string().optional(),
  customerId: z.string().optional(),
  name: z.string(),
  mustChangePassword: z.boolean().optional()
});
export type AuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;
