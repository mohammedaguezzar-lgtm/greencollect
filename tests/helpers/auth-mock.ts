import { vi } from 'vitest';

/** Hoisted auth mock — use in integration tests that import API routes. */
export const authMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  auth: authMock,
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/server/notifications/service', () => ({
  notifyPickupEvent: vi.fn().mockResolvedValue({ id: 'notif-test' }),
}));
