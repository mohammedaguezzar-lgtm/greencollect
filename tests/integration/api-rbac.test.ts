import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { authMock } from '../helpers/auth-mock';
import { PATCH as assignPickup } from '@/app/api/v1/pickups/[id]/assign/route';
import { GET as getUsers } from '@/app/api/v1/users/route';
import { prisma } from '@/lib/db';
import {
  cleanupTestPickups,
  loadSeedContext,
  mockAuthSession,
  parseJsonResponse,
  shouldRunIntegrationTests,
  type SeedContext,
} from '../helpers/test-context';

const MARKER = 'integration-rbac-pickup';

describe.skipIf(!shouldRunIntegrationTests())('RBAC API integration', () => {
  let ctx: SeedContext;

  beforeAll(async () => {
    ctx = await loadSeedContext();
  });

  beforeEach(() => {
    authMock.mockReset();
  });

  it('USER cannot list all users', async () => {
    authMock.mockResolvedValue(mockAuthSession({ ...ctx.user, role: 'USER' }));
    const res = await getUsers();
    expect(res.status).toBe(403);
  });

  it('ADMIN can list users', async () => {
    authMock.mockResolvedValue(mockAuthSession({ ...ctx.admin, role: 'ADMIN' }));
    const res = await getUsers();
    const { status, body } = await parseJsonResponse<{ data: unknown[] }>(res);
    expect(status).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('USER cannot assign a collector', async () => {
    const pickup = await prisma.pickup.create({
      data: {
        customerId: ctx.user.id,
        addressId: ctx.addressId,
        wasteTypeId: ctx.wasteTypeId,
        scheduledDate: new Date(Date.now() + 86400000 * 4),
        timeWindowStart: '09:00',
        timeWindowEnd: '12:00',
        feeAmountMad: 40,
        status: 'CONFIRMED',
        notes: MARKER,
      },
    });

    authMock.mockResolvedValue(mockAuthSession({ ...ctx.user, role: 'USER' }));

    const req = new Request(`http://localhost/api/v1/pickups/${pickup.id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedCollectorId: ctx.collector.id }),
    });

    const res = await assignPickup(req, { params: Promise.resolve({ id: pickup.id }) });
    expect(res.status).toBe(403);

    await cleanupTestPickups(MARKER);
  });

  it('DISPATCHER can assign a collector', async () => {
    const pickup = await prisma.pickup.create({
      data: {
        customerId: ctx.user.id,
        addressId: ctx.addressId,
        wasteTypeId: ctx.wasteTypeId,
        scheduledDate: new Date(Date.now() + 86400000 * 5),
        timeWindowStart: '09:00',
        timeWindowEnd: '12:00',
        feeAmountMad: 40,
        status: 'CONFIRMED',
        notes: MARKER,
      },
    });

    authMock.mockResolvedValue(
      mockAuthSession({ ...ctx.dispatcher, role: 'DISPATCHER' }),
    );

    const req = new Request(`http://localhost/api/v1/pickups/${pickup.id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedCollectorId: ctx.collector.id }),
    });

    const res = await assignPickup(req, { params: Promise.resolve({ id: pickup.id }) });
    const { status, body } = await parseJsonResponse<{
      data: { status: string; assignedCollectorId: string };
    }>(res);

    expect(status).toBe(200);
    expect(body.data.status).toBe('ASSIGNED');
    expect(body.data.assignedCollectorId).toBe(ctx.collector.id);

    await cleanupTestPickups(MARKER);
  });
});
