import { compactDecrypt, jwtVerify } from 'jose';
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
 * Decode the NextAuth v5 session cookie directly using `jose`.
 *
 * NextAuth v5 stores the session token as a **JWE** (encrypted JWT) in a cookie
 * named `__Secure-authjs.session-token` (HTTPS) or `authjs.session-token` (HTTP).
 *
 * The cookie value is NOT a plain JWT — it is a JWE compact serialization.
 * We must first decrypt it with `compactDecrypt`, then verify the inner JWT
 * with `jwtVerify`.
 *
 * This avoids pulling the entire NextAuth + PrismaAdapter + bcrypt bundle
 * into the Edge middleware, keeping it well under the 1 MB limit.
 */
export async function getMiddlewareSession(
  request: NextRequest,
): Promise<MiddlewareSession | null> {
  const secret = AUTH_SECRET;
  if (!secret.byteLength) return null;

  // NextAuth v5 cookie names (note: "authjs" not "next-auth" in v5)
  const cookie =
    request.cookies.get('__Secure-authjs.session-token')?.value ??
    request.cookies.get('authjs.session-token')?.value;

  if (!cookie) return null;

  try {
    // Step 1: Decrypt the JWE to get the inner JWT payload (bytes)
    const { plaintext } = await compactDecrypt(cookie, secret);

    // Step 2: Verify the inner JWT signature and extract claims
    const { payload } = await jwtVerify(plaintext, secret, {
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
