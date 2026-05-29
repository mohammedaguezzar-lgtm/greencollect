import { describe, expect, it } from 'vitest';
import { createPickupSchema } from '@/lib/validators/pickup';

describe('createPickupSchema', () => {
  const valid = {
    addressId: '00000000-0000-4000-8000-000000000010',
    wasteTypeId: '00000000-0000-4000-8000-000000000011',
    scheduledDate: '2026-06-01',
    timeWindowStart: '09:00',
    timeWindowEnd: '12:00',
  };

  it('accepts valid payload', () => {
    expect(createPickupSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects bad time format', () => {
    expect(
      createPickupSchema.safeParse({ ...valid, timeWindowStart: '9:00' }).success,
    ).toBe(false);
  });

  it('rejects invalid uuid', () => {
    expect(
      createPickupSchema.safeParse({ ...valid, addressId: 'not-uuid' }).success,
    ).toBe(false);
  });
});
