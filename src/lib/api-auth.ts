import { auth } from '@/lib/auth';
import { jsonError } from '@/lib/api-response';
import { getSessionUser, type AppSessionUser } from '@/lib/permissions';
import type { UserRole } from '@prisma/client';

export async function requireApiSession(
  allowedRoles?: UserRole[],
): Promise<AppSessionUser | Response> {
  const session = await auth();
  const user = getSessionUser(session);
  if (!user) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  if (user.status === 'SUSPENDED') {
    return jsonError(403, 'FORBIDDEN', 'Account suspended');
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return jsonError(403, 'FORBIDDEN', 'Insufficient permissions');
  }
  return user;
}

export function isErrorResponse(value: unknown): value is Response {
  return value instanceof Response;
}
