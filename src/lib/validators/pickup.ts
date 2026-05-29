import { z } from 'zod';
import { PickupStatus } from '@prisma/client';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createPickupSchema = z.object({
  addressId: z.string().uuid(),
  wasteTypeId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeWindowStart: z.string().regex(timeRegex),
  timeWindowEnd: z.string().regex(timeRegex),
  estimatedWeightKg: z.number().positive().max(10000).optional(),
  notes: z.string().max(1000).optional(),
});

export const updatePickupStatusSchema = z.object({
  status: z.nativeEnum(PickupStatus),
  note: z.string().max(500).optional(),
  actualWeightKg: z.number().positive().max(10000).optional(),
  proofPhotoUrl: z.string().url().optional(),
});

export const assignPickupSchema = z.object({
  assignedCollectorId: z.string().uuid(),
  routeId: z.string().uuid().optional(),
});

export const cancelPickupSchema = z.object({
  cancellationReason: z.string().min(3).max(500),
});

export type CreatePickupInput = z.infer<typeof createPickupSchema>;
export type UpdatePickupStatusInput = z.infer<typeof updatePickupStatusSchema>;
