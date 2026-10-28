import { z } from 'zod';

export const CustomerAddressSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  districtId: z.string(),
  addressLine: z.string(),
  landmark: z.string().optional(),
  pincode: z.string().optional(),
  isDefault: z.boolean().default(false)
});
export type CustomerAddress = z.infer<typeof CustomerAddressSchema>;

export const CustomerProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  phone: z.string(),
  defaultDistrictId: z.string(),
  addresses: z.array(CustomerAddressSchema).optional()
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

