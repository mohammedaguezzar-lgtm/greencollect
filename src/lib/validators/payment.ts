import { z } from 'zod';
import { PaymentProvider } from '@prisma/client';

export const createPaymentSchema = z.object({
  provider: z.nativeEnum(PaymentProvider),
  amountMad: z.number().positive().max(100000),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
