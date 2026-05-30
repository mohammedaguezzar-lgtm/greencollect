import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

/** Lightweight session shape extracted from the JWT — no NextAuth dependency. */
export interface MiddlewareSession {
  user: {
    id: string;
    role: string;
    status: string;
  };
}

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '',
);

/**
 * Decode the NextAuth session cookie directly using `jose`.
 *
 * NextAuth v5 stores the JWT in a cookie named `next-auth.session-token`
 * (or `__Secure-next-auth.session-token` on HTTPS).
 *
 * This avoids pulling the entire NextAuth + PrismaAdapter + bcrypt bundle
 * into the Edge middleware, keeping it well under the 1 MB limit.
 */
export async function getMiddlewareSession(
  request: NextRequest,
): Promise<MiddlewareSession | null> {
  const secret = AUTH_SECRET;
  if (!secret.byteLength) return null;

  // Try secure cookie first, then fallback
  const cookie =
    request.cookies.get('__Secure-next-auth.session-token')?.value ??
    request.cookies.get('next-auth.session-token')?.value;

  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, secret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub) return null;

    return {
      user: {
        id: payload.sub as string,
        role: (payload.role as string) ?? '',
        status: (payload.status as string) ?? '',
      },
    };
  } catch {
    return null;
  }
}
