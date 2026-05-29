/**
 * Production environment validation — fails fast at startup (instrumentation.ts).
 */
export function validateProductionEnv(): void {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET must be at least 32 characters. Generate: openssl rand -base64 32',
    );
  }
  const lowered = secret.toLowerCase();
  if (
    lowered.includes('change-me') ||
    lowered.includes('changeme') ||
    lowered.includes('your-secret')
  ) {
    throw new Error('AUTH_SECRET must not use a placeholder value in production');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
  }

  if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
    console.warn(
      '[security] NEXTAUTH_URL should use https:// in production for secure cookies',
    );
  }
}
