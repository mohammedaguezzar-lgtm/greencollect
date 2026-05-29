# GreenCollect — Implementation Plan & Step Tracker

**Last updated:** 2026-05-25  
**Current phase:** ✅ **MVP complete — cleared for production**  
**Overall progress:** ~125 / 127 files · **48 / 48 steps**

> **Release order:** E1 → E2 → E3 → E4 → E5 → **E6** ✅

**Status legend:** `⬜ pending` · `🔄 in progress` · `✅ done` · `⏭ skipped`

---

## Step tracker (high level)

| Phase | Steps | Done | Status |
|-------|-------|------|--------|
| **A** Foundation | 8 | 8 | ✅ done |
| **B** Core API | 10 | 10 | ✅ done |
| **C** Operations UI | 12 | 12 | ✅ done |
| **D** Payments & admin | 8 | 8 | ✅ done |
| **E** QA & deploy | 6 | 6 | ✅ **E6 PASS** |
| **F** Advanced polish | 4 | 4 | ✅ done |

---

## Phase E — QA & deploy (complete)

| Order | ID | Step | Status |
|-------|-----|------|--------|
| 1 | E1 | Vitest unit tests | ✅ done |
| 2 | E2 | API integration tests | ✅ done |
| 3 | E3 | Playwright E2E smoke | ✅ done |
| 4 | E4 | GitHub Actions CI | ✅ done |
| 5 | E5 | README runbook | ✅ done |
| 6 | **E6** | **Security checklist** | ✅ **PASS** — [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md) |

### E6 sign-off

| Field | Value |
|-------|--------|
| Status | ✅ PASS |
| Date | 2026-05-25 |
| Checklist | [SECURITY-CHECKLIST.md](./SECURITY-CHECKLIST.md) (all items checked) |
| Ops guide | [docs/PRODUCTION-OPS.md](./docs/PRODUCTION-OPS.md) |
| Privacy | `/fr/legal/privacy`, `/ar/legal/privacy` |

### E6 code changes applied

- `src/lib/env.ts` — production `AUTH_SECRET` validation
- `src/instrumentation.ts` — startup check
- `src/lib/auth.ts` — secure cookies, trustHost, suspended session revoke
- `src/lib/rate-limit.ts` — geocode + register limits
- `src/middleware.ts` — block suspended users
- `next.config.ts` — security headers
- `src/app/[locale]/legal/privacy/page.tsx` — FR/AR/EN
- `.github/dependabot.yml`
- `tests/integration/api-security.test.ts`

---

## Vercel deploy

| Item | Status |
|------|--------|
| `vercel.json` + `vercel-build` script | ✅ ready |
| Deploy guide | [`docs/VERCEL-DEPLOY.md`](./docs/VERCEL-DEPLOY.md) |
| MCP / CLI deploy | Run `vercel --prod` locally (see guide) |

---

## Pre-deploy checklist (human ops)

1. `openssl rand -base64 32` → set `AUTH_SECRET` in hosting
2. `NEXTAUTH_URL=https://your-domain`
3. Enable managed Postgres daily backups
4. Monitor `GET /api/health`
5. `npm audit` on release branch

---

## Test commands

```bash
npm run test:unit
npm run test:integration   # needs DATABASE_URL + seed
npm run test:e2e
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-25 | **E6 PASS** — security audit, hardening, privacy pages, 48/48 steps |
| 2026-05-25 | E2 integration tests + CI split |
| 2026-05-25 | MVP feature-complete (phases A–D, F) |
