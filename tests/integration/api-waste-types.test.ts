import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/v1/waste-types/route';
import {
  loadSeedContext,
  parseJsonResponse,
  shouldRunIntegrationTests,
} from '../helpers/test-context';

describe.skipIf(!shouldRunIntegrationTests())('GET /api/v1/waste-types', () => {
  it('returns active waste types without auth', async () => {
    await loadSeedContext();
    const res = await GET();
    const { status, body } = await parseJsonResponse<{ data: Array<{ code: string; flatFeeMad: number }> }>(res);

    expect(status).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(6);
    expect(body.data.some((w) => w.code === 'PLASTIC')).toBe(true);
    expect(typeof body.data[0].flatFeeMad).toBe('number');
  });
});
