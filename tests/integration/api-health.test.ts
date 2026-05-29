import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';
import {
  shouldRunIntegrationTests,
  verifyDatabaseConnection,
} from '../helpers/test-context';

describe('GET /api/health', () => {
  it('returns ok or degraded JSON', async () => {
    const res = await GET();
    const body = await res.json();
    expect(['ok', 'degraded']).toContain(body.status);
    expect(body).toHaveProperty('db');
  });

  it.runIf(shouldRunIntegrationTests())(
    'reports connected when DATABASE_URL is valid',
    async () => {
      const connected = await verifyDatabaseConnection();
      if (!connected) return;

      const res = await GET();
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toEqual({ status: 'ok', db: 'connected' });
    },
  );
});
