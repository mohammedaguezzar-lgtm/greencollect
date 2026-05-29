# Vercel Migration Plan — GreenCollect

## Overview

Migrate the GreenCollect Next.js application from Docker/local deployment to Vercel. This plan covers infrastructure, configuration changes, environment variables, and database migration.

## Architecture Changes

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Serverless)                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Next.js App  │  │  API Routes  │  │  Middleware    │  │
│  │  (Edge/Node)  │  │  (Node.js)   │  │  (Edge)       │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                 │                   │          │
│         └─────────────────┼───────────────────┘          │
│                           │                              │
│                    ┌──────┴──────┐                       │
│                    │  Prisma     │                       │
│                    │  Data Proxy │                       │
│                    └──────┬──────┘                       │
└───────────────────────────┼─────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │  Neon (Serverless  │
                    │  PostgreSQL)   │
                    └────────────────┘
```

## Prerequisites

1. **Vercel account** — Create at https://vercel.com
2. **Neon account** — Create at https://neon.tech (serverless PostgreSQL)
3. **GitHub repository** — Push the project to GitHub
4. **Domain (optional)** — Custom domain for production

## Step 1: Fix `next.config.ts` for Vercel

### Remove `output: 'standalone'`

Vercel handles deployments differently — `standalone` is only for Docker/self-hosted. Remove it.

### Keep `outputFileTracingRoot`

This is kept because it's needed for local builds (fixes a lockfile detection warning when there's a `package-lock.json` in the user's home directory). It's harmless on Vercel — only used during build tracing.

### Current problematic config:
```ts
const nextConfig: NextConfig = {
  output: 'standalone',          // ❌ Remove for Vercel
  outputFileTracingRoot: ...,    // ✅ Keep — needed for local builds
  ...
};
```

### Fixed config:
```ts
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  outputFileTracingRoot: process.cwd(),  // Keep — local build fix
  async headers() {
    return [
      {
        source: '/:path((?!_next/static/).*)',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
```

## Step 2: Database — Migrate to Neon (Serverless PostgreSQL)

### Why Neon?
- Serverless PostgreSQL compatible with Prisma
- Free tier available (0.5 GB storage)
- Connection pooling via Prisma Data Proxy or direct `?pgbouncer=true`
- Built-in branching for preview deployments

### Migration Steps:

1. **Create a Neon project** at https://neon.tech
2. **Get the connection string** from Neon dashboard
3. **Run migrations** against Neon:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```
4. **Seed the database**:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db seed
   ```

### Prisma Configuration Update

The current `schema.prisma` already uses `postgresql` provider — no changes needed to the schema itself.

However, for serverless environments, add connection pool config:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection limit for serverless — Neon uses PgBouncer
  // Set via DATABASE_URL: ?pgbouncer=true&connection_limit=5
}
```

## Step 3: Redis — Replace with Upstash (Serverless Redis)

### Why Upstash?
- Serverless Redis compatible with Vercel Edge Functions
- Free tier available (10 MB)
- HTTP-based API (no persistent TCP connections needed)
- Works in Edge Runtime

### Changes Needed:

1. **Create Upstash account** at https://upstash.com
2. **Get REST API credentials** (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
3. **Replace in-memory rate limiter** with Upstash Redis

### Update [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts):

```ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const now = Date.now();
  const windowKey = `rate_limit:${key}:${Math.floor(now / windowMs)}`;
  
  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, Math.ceil(windowMs / 1000));
  }
  
  if (count > limit) {
    const ttl = await redis.ttl(windowKey);
    return { ok: false, retryAfterMs: ttl * 1000 };
  }
  
  return { ok: true };
}
```

### Update [`src/app/api/v1/auth/register/route.ts`](src/app/api/v1/auth/register/route.ts):

The `rateLimit` call needs to be `await`ed since it's now async.

## Step 4: Authentication — Configure for Vercel

### Update [`src/lib/auth.ts`](src/lib/auth.ts):

```ts
const isProduction = process.env.NODE_ENV === 'production';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  useSecureCookies: isProduction,
  // Vercel uses NEXTAUTH_URL_INTERNAL for the server-side URL
  // and NEXTAUTH_URL for the public-facing URL
  ...
};
```

## Step 5: Environment Variables on Vercel

Set these in the Vercel Dashboard (Project → Settings → Environment Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...?pgbouncer=true&connection_limit=5` | From Neon |
| `AUTH_SECRET` | `openssl rand -base64 32` | Generate locally |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production URL |
| `NEXTAUTH_URL_INTERNAL` | (auto) | Vercel sets this automatically |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Public URL |
| `UPSTASH_REDIS_REST_URL` | From Upstash | For rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash | For rate limiting |
| `RESEND_API_KEY` | From Resend | For emails |
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` | Geocoding |
| `NOMINATIM_USER_AGENT` | `GreenCollect/1.0 (contact@greencollect.ma)` | Geocoding |
| `SERVICE_CITY` | `Casablanca` | Service area |
| `CMI_MERCHANT_ID` | (your value) | Payments |
| `CMI_SECRET` | (your value) | Payments |

## Step 6: Update `vercel.json`

Current [`vercel.json`](vercel.json) is mostly correct. Minor adjustments:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "installCommand": "npm install",
  "regions": ["cdg1"],
  "crons": []
}
```

The `buildCommand` runs Prisma migrations during build — ensure the `DATABASE_URL` environment variable is set in Vercel.

## Step 7: Deployment Steps

### 7.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-org/greencollect.git
git push -u origin main
```

### 7.2 Import to Vercel
1. Go to https://vercel.com/new
2. Import the GitHub repository
3. Configure project:
   - Framework: Next.js
   - Build Command: `prisma generate && prisma migrate deploy && next build` (already in vercel.json)
   - Install Command: `npm install` (already in vercel.json)
4. Add all environment variables from Step 5
5. Deploy

### 7.3 First Deployment
The first deployment will:
1. Install dependencies
2. Generate Prisma client
3. Run database migrations against Neon
4. Build the Next.js application
5. Deploy to Vercel Edge Network

## Step 8: Post-Deployment Verification

### 8.1 Check Health Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

### 8.2 Verify Static Assets
```bash
curl -I https://your-app.vercel.app/_next/static/css/*.css
# Should return: Content-Type: text/css
```

### 8.3 Test Authentication
```bash
curl -X POST https://your-app.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### 8.4 Check Rate Limiting
```bash
# Make 6 rapid requests — the 6th should be rate-limited
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://your-app.vercel.app/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
done
```

## Files to Modify

| File | Change | Reason |
|------|--------|--------|
| [`next.config.ts`](next.config.ts) | Remove `output: 'standalone'` and `outputFileTracingRoot` | Vercel handles this automatically |
| [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts) | Replace in-memory Map with Upstash Redis | Serverless needs distributed rate limiting |
| [`src/app/api/v1/auth/register/route.ts`](src/app/api/v1/auth/register/route.ts) | Make `rateLimit` call `await` | Upstash Redis is async |
| Any other route using `rateLimit` | Make `rateLimit` call `await` | Same reason |

## Files NOT to Modify

| File | Reason |
|------|--------|
| [`Dockerfile`](Dockerfile) | Not used on Vercel (keep for local dev) |
| [`docker-compose*.yml`](docker-compose.yml) | Not used on Vercel (keep for local dev) |
| [`package.json`](package.json) `start` script | Only used for local standalone server |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Already compatible with PostgreSQL |
| [`src/lib/db.ts`](src/lib/db.ts) | Already uses global singleton pattern |
| [`src/lib/auth.ts`](src/lib/auth.ts) | Already uses JWT strategy (serverless-compatible) |
| [`src/middleware.ts`](src/middleware.ts) | Already has correct matcher exclusions |

## Potential Issues & Mitigations

### 1. Serverless Function Timeout (10s on Hobby plan)
- **Issue**: Long-running API routes (e.g., email sending) may timeout
- **Mitigation**: Keep API routes lightweight; use background jobs for heavy tasks

### 2. Cold Starts
- **Issue**: First request after inactivity may be slow
- **Mitigation**: Use Vercel's Pro plan for better cold start performance

### 3. Prisma Connection Pool
- **Issue**: Serverless functions create many connections
- **Mitigation**: Use `?pgbouncer=true&connection_limit=5` in DATABASE_URL

### 4. Edge Runtime Incompatibility
- **Issue**: `bcryptjs` and `@prisma/client` use Node.js APIs not available in Edge Runtime
- **Mitigation**: Already handled — these are only used in API routes (Node.js runtime), not middleware (Edge)

### 5. Rate Limiting State
- **Issue**: In-memory rate limiting doesn't work across serverless instances
- **Mitigation**: Replace with Upstash Redis (Step 3)

## Cost Estimate (Vercel Hobby + Neon Free)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Neon | Free tier | Free |
| Upstash Redis | Free tier | Free |
| Resend | Free tier (100 emails/day) | Free |
| **Total** | | **$0/month** |

For production scale, upgrade to Vercel Pro ($20/month) and Neon Scale ($19/month).
