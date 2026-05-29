import { z } from 'zod';
import { RouteStatus } from '@prisma/client';

export const createRouteSchema = z.object({
  collectorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pickupIds: z.array(z.string().uuid()).min(1),
});

export const updateRouteSchema = z.object({
  pickupIds: z.array(z.string().uuid()).min(1).optional(),
  status: z.nativeEnum(RouteStatus).optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
