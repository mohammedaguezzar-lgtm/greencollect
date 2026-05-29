import type { Pickup, UserRole } from '@prisma/client';
import type { Session } from 'next-auth';

export type AppSessionUser = {
  id: string;
  email: string;
  role: UserRole;
  status: string;
};

export function getSessionUser(session: Session | null): AppSessionUser | null {
  if (!session?.user?.id || !session.user.email) return null;
  const u = session.user as Session['user'] & { role?: UserRole; status?: string };
  if (!u.role) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    role: u.role,
    status: u.status ?? 'ACTIVE',
  };
}

export function requireRole(user: AppSessionUser, allowed: UserRole[]): void {
  if (!allowed.includes(user.role)) {
    throw new PermissionError('FORBIDDEN', 'Insufficient permissions');
  }
}

export function canAccessPickup(user: AppSessionUser, pickup: Pickup): boolean {
  if (user.role === 'ADMIN' || user.role === 'DISPATCHER') return true;
  if (user.role === 'USER' && pickup.customerId === user.id) return true;
  if (user.role === 'COLLECTOR' && pickup.assignedCollectorId === user.id) return true;
  return false;
}

export class PermissionError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}
