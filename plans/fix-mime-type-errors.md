# Fix: NS_ERROR_CORRUPTED_CONTENT / MIME Type Errors for Next.js Static Assets

## Problem

When accessing `http://localhost:3000`, the browser blocks Next.js static assets (CSS and JS chunks under `/_next/static/`) because they are served with `Content-Type: text/plain` instead of their correct MIME types (`text/css`, `application/javascript`). The `X-Content-Type-Options: nosniff` header then causes the browser to refuse processing them.

## Root Cause Analysis

There are **two contributing factors** working together to cause this bug:

### 1. Security Headers Applied Too Broadly in [`next.config.ts`](next.config.ts:21-23)

The `async headers()` function applies the `X-Content-Type-Options: nosniff` header to **all routes** via the pattern `source: '/(.*)'`. While this header is good for HTML pages, it becomes problematic when combined with incorrect MIME types on static assets.

### 2. Middleware Interfering with Static Assets — [`src/middleware.ts`](src/middleware.ts:66-68)

The middleware matcher is:
```ts
matcher: ['/((?!api|_next|.*\\..*).*)']
```

This regex is supposed to **exclude** `_next` paths, but let's analyze it:
- `(?!api|_next|.*\\..*)` — matches paths that do NOT contain `api`, `_next`, or a file extension
- The regex `.*\\..*` matches any path containing a dot (file extensions like `.js`, `.css`)

So paths like `/_next/static/chunks/webpack-xxx.js` **should** be excluded because they contain both `_next` and a file extension `.js`. However, the issue is that the middleware might still be processing these requests in certain edge cases, or the `intlMiddleware` (next-intl) is modifying the response headers.

**The real culprit**: The `next-intl` middleware (`createMiddleware(routing)`) is likely matching these static asset paths and either:
- Setting incorrect content types on the response
- Or the Next.js standalone server in Docker is not properly handling static file serving

### 3. Docker Standalone Output — [`Dockerfile`](Dockerfile:14-21)

The Dockerfile uses `output: 'standalone'` which copies only the standalone build output. The `COPY --from=builder /app/public ./public` copies the public directory, but the `_next/static` files are inside `.next/static` which is part of the standalone output. The standalone server should handle these correctly, but the middleware interference is the key issue.

## The Fix

### Fix A: Update [`next.config.ts`](next.config.ts:21-23) — Exclude static assets from security headers

The `async headers()` function should exclude `/_next/static` paths from the security headers, since Next.js already handles these correctly internally. Add a more specific source pattern that excludes static assets.

**Current:**
```ts
async headers() {
  return [{ source: '/(.*)', headers: securityHeaders }];
},
```

**Fixed:**
```ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ];
},
```

Actually, the better approach is to add a separate rule that **removes** the problematic headers for static assets, or better yet, ensure the headers are only applied to non-static routes. The cleanest fix is:

```ts
async headers() {
  return [
    {
      source: '/:path((?!_next/static/).*)',
      headers: securityHeaders,
    },
  ];
},
```

But this regex approach in Next.js `source` patterns can be tricky. The most reliable approach is to add an exclusion:

```ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ];
},
```

Wait — the issue is that the static files are being served with `text/plain` MIME type. The `X-Content-Type-Options: nosniff` header is just exposing the underlying problem. The real fix needs to ensure Next.js serves static files with correct MIME types.

### Fix B: Update [`src/middleware.ts`](src/middleware.ts:66-68) — Ensure middleware never touches static assets

The matcher regex needs to be more robust. The current regex `/((?!api|_next|.*\\..*).*)` should work, but let's verify by checking if the `intlMiddleware` is somehow processing these paths.

The fix is to make the matcher more explicit:

```ts
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
```

Adding `_next/static` and `_next/image` explicitly to the exclusion list ensures the middleware never touches these paths.

### Fix C: The Most Likely Root Cause — next-intl Middleware

The `next-intl` middleware (`createMiddleware(routing)`) is the most likely cause. When it processes a request for a static file, it may be stripping or modifying the `Content-Type` header. The middleware matcher should prevent this, but if the regex isn't working correctly, the intl middleware will process the request and potentially corrupt the response.

The `next-intl` middleware's `createMiddleware` function returns a middleware that handles locale detection and redirects. If it matches a static asset path, it might pass it through without proper content type handling.

## Implementation Steps

### Step 1: Update [`next.config.ts`](next.config.ts)

Add explicit header rules for `/_next/static` paths to ensure correct caching and content types:

```ts
async headers() {
  return [
    {
      source: '/:path((?!_next/static/).*)',
      headers: securityHeaders,
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
},
```

### Step 2: Update [`src/middleware.ts`](src/middleware.ts)

Make the matcher more explicit to exclude all static asset paths:

```ts
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
```

### Step 3: Rebuild and Test

1. If running via Docker: `docker compose -f docker-compose.local.yml up --build`
2. If running locally: `npm run build && npm start`
3. Verify that `/_next/static/css/*.css` returns `Content-Type: text/css`
4. Verify that `/_next/static/chunks/*.js` returns `Content-Type: application/javascript`
5. Verify the page loads without console errors

## Verification

After applying the fixes, check:
1. Browser console has no `NS_ERROR_CORRUPTED_CONTENT` errors
2. No `bloquée en raison d'un type MIME incorrect` (blocked due to incorrect MIME type) errors
3. Network tab shows correct `Content-Type` headers for all `/_next/static` assets
4. `/_next/static/css/*.css` → `Content-Type: text/css`
5. `/_next/static/chunks/*.js` → `Content-Type: application/javascript`
6. `favicon.ico` no longer returns 404 (optional, add a favicon to `/public/favicon.ico`)
