import { describe, expect, it } from 'vitest';
import { assertTransition, isValidTransition, InvalidStatusTransitionError } from '@/server/pickups/transitions';

describe('pickup transitions', () => {
  it('allows dispatcher to confirm', () => {
    expect(() => assertTransition('DISPATCHER', 'REQUESTED', 'CONFIRMED')).not.toThrow();
  });

  it('allows collector en route flow', () => {
    expect(() => assertTransition('COLLECTOR', 'ASSIGNED', 'EN_ROUTE')).not.toThrow();
    expect(() => assertTransition('COLLECTOR', 'EN_ROUTE', 'ARRIVED')).not.toThrow();
    expect(() => assertTransition('COLLECTOR', 'ARRIVED', 'COMPLETED')).not.toThrow();
  });

  it('blocks user from assigning', () => {
    expect(() => assertTransition('USER', 'CONFIRMED', 'ASSIGNED')).toThrow(
      InvalidStatusTransitionError,
    );
  });

  it('validates transition keys', () => {
    expect(isValidTransition('REQUESTED', 'CONFIRMED')).toBe(true);
    expect(isValidTransition('COMPLETED', 'REQUESTED')).toBe(false);
  });
});
