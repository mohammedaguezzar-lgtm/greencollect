import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/db';
import * as pickupService from '@/server/pickups/service';
import {
  cleanupTestPickups,
  loadSeedContext,
  shouldRunIntegrationTests,
  type SeedContext,
} from '../helpers/test-context';

vi.mock('@/server/notifications/service', () => ({
  notifyPickupEvent: vi.fn().mockResolvedValue({ id: 'notif-test' }),
}));

const MARKER = 'integration-service-lifecycle';

describe.skipIf(!shouldRunIntegrationTests())('Pickup service lifecycle', () => {
  let ctx: SeedContext;

  beforeAll(async () => {
    ctx = await loadSeedContext();
  });

  afterEach(async () => {
    await cleanupTestPickups(MARKER);
  });

  it('runs REQUESTED → CONFIRMED → ASSIGNED → COMPLETED', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 6);

    const created = await pickupService.createPickup(ctx.user.id, {
      addressId: ctx.addressId,
      wasteTypeId: ctx.wasteTypeId,
      scheduledDate: tomorrow.toISOString().slice(0, 10),
      timeWindowStart: '09:00',
      timeWindowEnd: '12:00',
      notes: MARKER,
    });

    expect(created.status).toBe('REQUESTED');

    const confirmed = await pickupService.transitionPickup(created.id, {
      id: ctx.dispatcher.id,
      email: ctx.dispatcher.email,
      role: 'DISPATCHER',
      status: 'ACTIVE',
    }, { status: 'CONFIRMED' });

    expect(confirmed.status).toBe('CONFIRMED');

    const assigned = await pickupService.assignPickup(
      created.id,
      {
        id: ctx.dispatcher.id,
        email: ctx.dispatcher.email,
        role: 'DISPATCHER',
        status: 'ACTIVE',
      },
      ctx.collector.id,
    );

    expect(assigned.status).toBe('ASSIGNED');

    await pickupService.transitionPickup(created.id, {
      id: ctx.collector.id,
      email: ctx.collector.email,
      role: 'COLLECTOR',
      status: 'ACTIVE',
    }, { status: 'EN_ROUTE' });

    await pickupService.transitionPickup(created.id, {
      id: ctx.collector.id,
      email: ctx.collector.email,
      role: 'COLLECTOR',
      status: 'ACTIVE',
    }, { status: 'ARRIVED' });

    const completed = await pickupService.transitionPickup(created.id, {
      id: ctx.collector.id,
      email: ctx.collector.email,
      role: 'COLLECTOR',
      status: 'ACTIVE',
    }, { status: 'COMPLETED', actualWeightKg: 8.5 });

    expect(completed.status).toBe('COMPLETED');
    expect(Number(completed.actualWeightKg)).toBe(8.5);

    const history = await prisma.pickupStatusHistory.count({
      where: { pickupId: created.id },
    });
    expect(history).toBeGreaterThanOrEqual(4);
  });

  it('rejects invalid USER transition', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);

    const created = await pickupService.createPickup(ctx.user.id, {
      addressId: ctx.addressId,
      wasteTypeId: ctx.wasteTypeId,
      scheduledDate: tomorrow.toISOString().slice(0, 10),
      timeWindowStart: '09:00',
      timeWindowEnd: '12:00',
      notes: MARKER,
    });

    await expect(
      pickupService.transitionPickup(created.id, {
        id: ctx.user.id,
        email: ctx.user.email,
        role: 'USER',
        status: 'ACTIVE',
      }, { status: 'CONFIRMED' }),
    ).rejects.toThrow();
  });
});
