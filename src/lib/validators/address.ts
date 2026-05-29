import { z } from 'zod';
import { SERVICE_CITY } from '@/lib/utils';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  district: z.string().max(100).optional(),
  city: z.string().refine((c) => c === SERVICE_CITY, {
    message: `City must be ${SERVICE_CITY}`,
  }),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(27).max(36),
  longitude: z.number().min(-13.5).max(-0.5),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

export { timeRegex };
