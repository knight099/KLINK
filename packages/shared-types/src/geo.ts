import { z } from 'zod';

export const StateSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  isActive: z.boolean()
});
export type State = z.infer<typeof StateSchema>;

export const DistrictSchema = z.object({
  id: z.string(),
  stateId: z.string(),
  code: z.string(),
  name: z.string(),
  isActive: z.boolean()
});
export type District = z.infer<typeof DistrictSchema>;

export const CreateDistrictInputSchema = z.object({
  stateId: z.string(),
  code: z.string().toUpperCase(),
  name: z.string().min(2),
  isActive: z.boolean().default(true)
});
export type CreateDistrictInput = z.infer<typeof CreateDistrictInputSchema>;

