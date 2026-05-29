import { prisma } from '@/lib/db';
import type { CreateRouteInput, UpdateRouteInput } from '@/lib/validators/route';
import type { AppSessionUser } from '@/lib/permissions';
import type { RouteStatus } from '@prisma/client';

export async function createRoute(input: CreateRouteInput) {
  const collector = await prisma.user.findFirst({
    where: { id: input.collectorId, role: 'COLLECTOR', status: 'ACTIVE' },
  });
  if (!collector) throw new Error('COLLECTOR_NOT_FOUND');

  const date = new Date(input.date + 'T12:00:00.000Z');

  return prisma.$transaction(async (tx) => {
    const route = await tx.route.create({
      data: {
        collectorId: input.collectorId,
        date,
        pickupOrder: input.pickupIds,
        status: 'PLANNED',
      },
    });

    await tx.pickup.updateMany({
      where: { id: { in: input.pickupIds } },
      data: { routeId: route.id, assignedCollectorId: input.collectorId },
    });

    return tx.route.findUniqueOrThrow({
      where: { id: route.id },
      include: {
        pickups: { include: { address: true, wasteType: true } },
        collector: { select: { id: true, name: true, email: true } },
      },
    });
  });
}

export async function listRoutes(session: AppSessionUser, date?: string) {
  const where: { collectorId?: string; date?: Date } = {};
  if (session.role === 'COLLECTOR') where.collectorId = session.id;
  if (date) where.date = new Date(date + 'T12:00:00.000Z');

  return prisma.route.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      pickups: { include: { address: true, wasteType: true } },
      collector: { select: { id: true, name: true } },
    },
  });
}

export async function updateRoute(
  id: string,
  session: AppSessionUser,
  input: UpdateRouteInput,
) {
  const route = await prisma.route.findUnique({ where: { id } });
  if (!route) throw new Error('NOT_FOUND');

  if (session.role === 'COLLECTOR') {
    if (route.collectorId !== session.id) throw new Error('FORBIDDEN');
    if (input.pickupIds) throw new Error('FORBIDDEN');
    const allowed: RouteStatus[] = ['IN_PROGRESS', 'COMPLETED'];
    if (input.status && !allowed.includes(input.status)) throw new Error('FORBIDDEN');
  }

  return prisma.$transaction(async (tx) => {
    if (input.pickupIds) {
      await tx.pickup.updateMany({
        where: { routeId: id },
        data: { routeId: null },
      });
      await tx.pickup.updateMany({
        where: { id: { in: input.pickupIds } },
        data: { routeId: id, assignedCollectorId: route.collectorId },
      });
    }

    return tx.route.update({
      where: { id },
      data: {
        pickupOrder: input.pickupIds ?? undefined,
        status: input.status,
        startedAt: input.status === 'IN_PROGRESS' ? new Date() : undefined,
        completedAt: input.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        pickups: { include: { address: true, wasteType: true } },
        collector: { select: { id: true, name: true } },
      },
    });
  });
}
