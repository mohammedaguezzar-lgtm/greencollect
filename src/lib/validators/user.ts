import { z } from 'zod';
import { Locale, UserRole, UserStatus } from '@prisma/client';

const moroccoPhone = z
  .string()
  .regex(/^\+212[5-7]\d{8}$/, 'Phone must be +212XXXXXXXXX')
  .optional();

export const updateMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: moroccoPhone,
  locale: z.nativeEnum(Locale).optional(),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
  role: z.nativeEnum(UserRole),
  phone: moroccoPhone,
});

export const adminUpdateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  name: z.string().min(1).max(100).optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
