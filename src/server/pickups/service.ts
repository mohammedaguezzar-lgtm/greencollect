import { prisma } from '@/lib/db';
import type { AppSessionUser } from '@/lib/permissions';
import { canAccessPickup, PermissionError } from '@/lib/permissions';
import type { CreatePickupInput, UpdatePickupStatusInput } from '@/lib/validators/pickup';
import type { PickupStatus, Prisma } from '@prisma/client';
import { assertTransition, InvalidStatusTransitionError } from './transitions';
import { writeAuditLog } from '@/server/audit';
import { notifyPickupEvent } from '@/server/notifications/service';

const pickupInclude = {
  address: true,
  wasteType: true,
  customer: { select: { id: true, name: true, email: true, phone: true } },
  assignedCollector: { select: { id: true, name: true, email: true, phone: true } },
  statusHistory: { orderBy: { createdAt: 'asc' as const }, include: { actor: { select: { id: true, name: true } } } },
};

type PickupWithRelations = Prisma.PickupGetPayload<{ include: typeof pickupInclude }>;

async function maybeNotifyCustomer(
  pickup: PickupWithRelations,
  type: 'PICKUP_CONFIRMED' | 'PICKUP_ASSIGNED' | 'PICKUP_COMPLETED',
) {
  if (!pickup.customer?.email) return;
  const date = pickup.scheduledDate.toISOString().slice(0, 10);
  const address = pickup.address?.line1 ?? 'Casablanca';
  await notifyPickupEvent(type, pickup.customerId, pickup.customer.email, {
    date,
    address,
  });
}

export async function createPickup(customerId: string, input: CreatePickupInput) {
  const [address, wasteType] = await Promise.all([
    prisma.address.findFirst({ where: { id: input.addressId, userId: customerId } }),
    prisma.wasteType.findFirst({ where: { id: input.wasteTypeId, active: true } }),
  ]);

  if (!address) throw new Error('ADDRESS_NOT_FOUND');
  if (!wasteType) throw new Error('WASTE_TYPE_NOT_FOUND');

  const scheduledDate = new Date(input.scheduledDate + 'T12:00:00.000Z');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (scheduledDate < today) throw new Error('INVALID_DATE');

  return prisma.$transaction(async (tx) => {
    const pickup = await tx.pickup.create({
      data: {
        customerId,
        addressId: input.addressId,
        wasteTypeId: input.wasteTypeId,
        scheduledDate,
        timeWindowStart: input.timeWindowStart,
        timeWindowEnd: input.timeWindowEnd,
        estimatedWeightKg: input.estimatedWeightKg,
        notes: input.notes,
        feeAmountMad: wasteType.flatFeeMad,
        status: 'REQUESTED',
        paymentStatus: 'PENDING',
      },
      include: pickupInclude,
    });

    await tx.pickupStatusHistory.create({
      data: {
        pickupId: pickup.id,
        fromStatus: null,
        toStatus: 'REQUESTED',
        actorId: customerId,
      },
    });

    return pickup;
  });
}

export async function listPickups(
  session: AppSessionUser,
  params: {
    page: number;
    pageSize: number;
    status?: PickupStatus;
    scheduledDate?: string;
    collectorId?: string;
  },
) {
  const where: Prisma.PickupWhereInput = {};

  if (session.role === 'USER') {
    where.customerId = session.id;
  } else if (session.role === 'COLLECTOR') {
    where.assignedCollectorId = session.id;
  } else if (session.role === 'DISPATCHER' || session.role === 'ADMIN') {
    if (params.collectorId) where.assignedCollectorId = params.collectorId;
  } else {
    throw new PermissionError('FORBIDDEN', 'Insufficient permissions');
  }

  if (params.status) where.status = params.status;
  if (params.scheduledDate) {
    where.scheduledDate = new Date(params.scheduledDate + 'T12:00:00.000Z');
  }

  const [total, data] = await Promise.all([
    prisma.pickup.count({ where }),
    prisma.pickup.findMany({
      where,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy: { scheduledDate: 'asc' },
      include: pickupInclude,
    }),
  ]);

  return { data, total };
}

export async function getPickup(id: string, session: AppSessionUser) {
  const pickup = await prisma.pickup.findUnique({
    where: { id },
    include: pickupInclude,
  });
  if (!pickup) throw new Error('NOT_FOUND');
  if (!canAccessPickup(session, pickup)) {
    throw new PermissionError('FORBIDDEN', 'Cannot access pickup');
  }
  return pickup;
}

export async function transitionPickup(
  id: string,
  session: AppSessionUser,
  input: UpdatePickupStatusInput,
) {
  const pickup = await prisma.pickup.findUnique({ where: { id } });
  if (!pickup) throw new Error('NOT_FOUND');
  if (!canAccessPickup(session, pickup)) {
    throw new PermissionError('FORBIDDEN', 'Cannot access pickup');
  }

  try {
    assertTransition(session.role, pickup.status, input.status);
  } catch {
    throw new InvalidStatusTransitionError();
  }

  if (input.status === 'COMPLETED' && input.actualWeightKg == null) {
    throw new Error('WEIGHT_REQUIRED');
  }

  const userCancel =
    session.role === 'USER' &&
    input.status === 'CANCELLED' &&
    !['REQUESTED', 'CONFIRMED'].includes(pickup.status);
  if (userCancel) throw new InvalidStatusTransitionError();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.pickup.update({
      where: { id },
      data: {
        status: input.status,
        actualWeightKg: input.actualWeightKg,
        proofPhotoUrl: input.proofPhotoUrl,
        cancelledAt: input.status === 'CANCELLED' ? new Date() : undefined,
        cancellationReason:
          input.status === 'CANCELLED' ? input.note : undefined,
      },
      include: pickupInclude,
    });

    await tx.pickupStatusHistory.create({
      data: {
        pickupId: id,
        fromStatus: pickup.status,
        toStatus: input.status,
        actorId: session.id,
        note: input.note,
      },
    });

    return updated;
  }).then(async (updated) => {
    if (input.status === 'CONFIRMED') {
      await maybeNotifyCustomer(updated, 'PICKUP_CONFIRMED');
    }
    if (input.status === 'COMPLETED') {
      await maybeNotifyCustomer(updated, 'PICKUP_COMPLETED');
    }
    return updated;
  });
}

export async function assignPickup(
  id: string,
  session: AppSessionUser,
  assignedCollectorId: string,
  routeId?: string,
) {
  const pickup = await prisma.pickup.findUnique({ where: { id } });
  if (!pickup) throw new Error('NOT_FOUND');

  const collector = await prisma.user.findFirst({
    where: { id: assignedCollectorId, role: 'COLLECTOR', status: 'ACTIVE' },
  });
  if (!collector) throw new Error('COLLECTOR_NOT_FOUND');

  const newStatus: PickupStatus =
    pickup.status === 'CONFIRMED' ? 'ASSIGNED' : pickup.status;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.pickup.update({
      where: { id },
      data: {
        assignedCollectorId,
        routeId: routeId ?? pickup.routeId,
        status: newStatus,
      },
      include: pickupInclude,
    });

    if (newStatus !== pickup.status) {
      await tx.pickupStatusHistory.create({
        data: {
          pickupId: id,
          fromStatus: pickup.status,
          toStatus: newStatus,
          actorId: session.id,
        },
      });
    }

    return result;
  });

  await writeAuditLog({
    actorId: session.id,
    action: 'PICKUP_ASSIGNED',
    entityType: 'Pickup',
    entityId: id,
    metadata: { assignedCollectorId, routeId },
  });

  if (newStatus === 'ASSIGNED') {
    await maybeNotifyCustomer(updated, 'PICKUP_ASSIGNED');
  }

  return updated;
}

export async function cancelPickup(
  id: string,
  session: AppSessionUser,
  reason: string,
) {
  return transitionPickup(id, session, {
    status: 'CANCELLED',
    note: reason,
  });
}
