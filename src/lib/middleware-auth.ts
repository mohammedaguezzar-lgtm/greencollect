import { hkdf } from '@panva/hkdf';
import { jwtDecrypt } from 'jose';
import type { NextRequest } from 'next/server';

/** Lightweight session shape extracted from the JWT — no NextAuth dependency. */
export interface MiddlewareSession {
  user: {
    id: string;
    role: string;
    status: string;
  };
}

const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';

/**
 * Derive the encryption key the same way `@auth/core` does internally.
 *
 * NextAuth v5 / Auth.js encrypts JWTs using JWE with algorithm "dir"
 * and content encryption "A256CBC-HS512". The encryption key is **not**
 * the raw AUTH_SECRET — it is derived via HKDF-SHA256 using:
 *
 *   - `ikm` = raw AUTH_SECRET (UTF-8 bytes)
 *   - `salt` = the cookie name (e.g. `__Secure-authjs.session-token`)
 *   - `info` = `Auth.js Generated Encryption Key (${salt})`
 *   - `length` = 64 bytes (for A256CBC-HS512)
 *
 * @see node_modules/@auth/core/src/jwt.ts
 */
async function getDerivedEncryptionKey(enc: string, salt: string): Promise<Uint8Array> {
  let length: number;
  switch (enc) {
    case 'A256CBC-HS512':
      length = 64;
      break;
    case 'A256GCM':
      length = 32;
      break;
    default:
      throw new Error('Unsupported JWT Content Encryption Algorithm');
  }
  return await hkdf(
    'sha256',
    AUTH_SECRET,
    salt,
    `Auth.js Generated Encryption Key (${salt})`,
    length,
  );
}

/**
 * Decode the NextAuth v5 session cookie directly using `jose`.
 *
 * NextAuth v5 stores the session token as a **JWE** (encrypted JWT) in a cookie
 * named `__Secure-authjs.session-token` (HTTPS) or `authjs.session-token` (HTTP).
 *
 * The encryption key is derived from AUTH_SECRET via HKDF — we replicate the
 * exact derivation from `@auth/core/src/jwt.ts` to avoid pulling the entire
 * NextAuth + PrismaAdapter + bcrypt bundle into the Edge middleware.
 */
export async function getMiddlewareSession(
  request: NextRequest,
): Promise<MiddlewareSession | null> {
  if (!AUTH_SECRET) return null;

  // NextAuth v5 cookie names (note: "authjs" not "next-auth" in v5)
  const cookieName =
    request.cookies.get('__Secure-authjs.session-token')?.value
      ? '__Secure-authjs.session-token'
      : request.cookies.get('authjs.session-token')?.value
        ? 'authjs.session-token'
        : null;

  if (!cookieName) return null;

  const cookie = request.cookies.get(cookieName)!.value;

  try {
    // Derive the encryption key using HKDF (same as @auth/core)
    const encryptionSecret = await getDerivedEncryptionKey('A256CBC-HS512', cookieName);

    // Decrypt + verify the JWE in one step (jose's jwtDecrypt handles both)
    const { payload } = await jwtDecrypt(cookie, encryptionSecret, {
      clockTolerance: 15,
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256CBC-HS512', 'A256GCM'],
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
