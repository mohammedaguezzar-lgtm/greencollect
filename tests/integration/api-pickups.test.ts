import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { authMock } from '../helpers/auth-mock';
import { GET, POST } from '@/app/api/v1/pickups/route';
import { PATCH as patchStatus } from '@/app/api/v1/pickups/[id]/status/route';
import {
  cleanupTestPickups,
  loadSeedContext,
  mockAuthSession,
  parseJsonResponse,
  shouldRunIntegrationTests,
  type SeedContext,
} from '../helpers/test-context';

const MARKER = 'integration-test-pickup';

describe.skipIf(!shouldRunIntegrationTests())('Pickups API integration', () => {
  let ctx: SeedContext;

  beforeAll(async () => {
    ctx = await loadSeedContext();
  });

  beforeEach(() => {
    authMock.mockReset();
  });

  it('USER can create a pickup', async () => {
    authMock.mockResolvedValue(mockAuthSession({ ...ctx.user, role: 'USER' }));

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const scheduledDate = tomorrow.toISOString().slice(0, 10);

    const req = new Request('http://localhost/api/v1/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addressId: ctx.addressId,
        wasteTypeId: ctx.wasteTypeId,
        scheduledDate,
        timeWindowStart: '09:00',
        timeWindowEnd: '12:00',
        notes: MARKER,
      }),
    });

    const res = await POST(req);
    const { status, body } = await parseJsonResponse<{ data: { id: string; status: string } }>(res);

    expect(status).toBe(201);
    expect(body.data.status).toBe('REQUESTED');
    await cleanupTestPickups(MARKER);
  });

  it('USER cannot access dispatcher-only stats', async () => {
    authMock.mockResolvedValue(mockAuthSession({ ...ctx.user, role: 'USER' }));

    const { GET: adminStats } = await import('@/app/api/v1/admin/stats/route');
    const res = await adminStats();
    expect(res.status).toBe(403);
  });

  it('DISPATCHER can confirm pickup (status transition)', async () => {
    authMock.mockResolvedValue(mockAuthSession({ ...ctx.user, role: 'USER' }));

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const createReq = new Request('http://localhost/api/v1/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addressId: ctx.addressId,
        wasteTypeId: ctx.wasteTypeId,
        scheduledDate: tomorrow.toISOString().slice(0, 10),
        timeWindowStart: '10:00',
        timeWindowEnd: '13:00',
        notes: MARKER,
      }),
    });
    const created = await POST(createReq);
    const { body: createdBody } = await parseJsonResponse<{ data: { id: string } }>(created);
    const pickupId = createdBody.data.id;

    authMock.mockResolvedValue(
      mockAuthSession({ ...ctx.dispatcher, role: 'DISPATCHER' }),
    );

    const patchReq = new Request(`http://localhost/api/v1/pickups/${pickupId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });

    const patchRes = await patchStatus(patchReq, {
      params: Promise.resolve({ id: pickupId }),
    });
    const { status, body } = await parseJsonResponse<{ data: { status: string } }>(patchRes);

    expect(status).toBe(200);
    expect(body.data.status).toBe('CONFIRMED');

    await cleanupTestPickups(MARKER);
  });

  it('unauthenticated request returns 401', async () => {
    authMock.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });
});
