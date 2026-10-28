import { z } from 'zod';

export const UnitEnum = z.enum(['BAG', 'KG', 'QUINTAL', 'TONNE', 'CFT', 'PIECE', 'THOUSAND_PIECES', 'TRUCK_LOAD']);
export type Unit = z.infer<typeof UnitEnum>;

export const CategorySlugEnum = z.enum([
  'cement',
  'sariya',
  'balu',
  'gitti',
  'eent',
  'blocks'
]);
export type CategorySlug = z.infer<typeof CategorySlugEnum>;

export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  hindiName: z.string().optional(),
  sortOrder: z.number(),
  iconUrl: z.string().optional()
});
export type Category = z.infer<typeof CategorySchema>;

export const BrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().optional()
});
export type Brand = z.infer<typeof BrandSchema>;

export const CreateBrandInputSchema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().optional()
});
export type CreateBrandInput = z.infer<typeof CreateBrandInputSchema>;

export const MasterProductSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  brandId: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().optional(),
  defaultUnit: UnitEnum,
  allowedUnits: z.array(UnitEnum).optional(),
  specifications: z.record(z.any()).optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean(),
  category: CategorySchema.optional(),
  brand: BrandSchema.nullable().optional()
});
export type MasterProduct = z.infer<typeof MasterProductSchema>;

export const CreateMasterProductInputSchema = z.object({
  categoryId: z.string(),
  brandId: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  defaultUnit: UnitEnum,
  specifications: z.record(z.any()).optional(),
  imageUrl: z.string().optional()
});
export type CreateMasterProductInput = z.infer<typeof CreateMasterProductInputSchema>;

export const UpdateMasterProductInputSchema = z.object({
  categoryId: z.string().optional(),
  brandId: z.string().nullable().optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  defaultUnit: UnitEnum.optional(),
  specifications: z.record(z.any()).optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional()
});
export type UpdateMasterProductInput = z.infer<typeof UpdateMasterProductInputSchema>;
