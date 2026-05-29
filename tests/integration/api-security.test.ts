import { describe, expect, it } from 'vitest';
import { authMock } from '../helpers/auth-mock';
import { GET } from '@/app/api/v1/pickups/route';
import {
  loadSeedContext,
  mockAuthSession,
  shouldRunIntegrationTests,
} from '../helpers/test-context';
import { prisma } from '@/lib/db';

describe.skipIf(!shouldRunIntegrationTests())('Security integration', () => {
  it('SUSPENDED user receives 403 on API', async () => {
    const ctx = await loadSeedContext();

    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { status: 'SUSPENDED' },
    });

    authMock.mockResolvedValue(
      mockAuthSession({ ...ctx.user, role: 'USER', status: 'SUSPENDED' }),
    );

    const res = await GET();
    expect(res.status).toBe(403);

    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { status: 'ACTIVE' },
    });
  });
});
