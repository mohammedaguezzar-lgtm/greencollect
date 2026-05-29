import { describe, expect, it } from 'vitest';
import { isInsideMorocco } from '@/server/geo/bbox';

describe('isInsideMorocco', () => {
  it('accepts Casablanca', () => {
    expect(isInsideMorocco(33.5731, -7.5898)).toBe(true);
  });

  it('rejects Paris', () => {
    expect(isInsideMorocco(48.8566, 2.3522)).toBe(false);
  });
});
