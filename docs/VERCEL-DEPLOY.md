# Deploy GreenCollect on Vercel

## Prerequisites

- [Vercel account](https://vercel.com)
- Git repo connected (GitHub/GitLab) **or** Vercel CLI
- **Postgres** (Neon via Vercel Marketplace recommended)

---

## Step 1 — Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import this repository (`SaaS` / `greencollect`)
3. Framework preset: **Next.js** (auto-detected)

---

## Step 2 — Add Upstash Redis (Rate Limiting)

The app uses Upstash Redis for serverless-compatible rate limiting (replaces the old in-memory Map).

1. Go to [upstash.com](https://upstash.com) → Sign up / Log in
2. Create a **Redis** database (free tier: 10 MB — plenty for rate limiting)
3. Choose a region close to your Vercel deployment (e.g., `eu-west-1`)
4. Copy the **REST URL** and **REST Token** from the Upstash dashboard
5. Add them as environment variables in Vercel (see Step 3)

---

## Step 3 — Add Postgres (Neon)

1. Vercel Dashboard → Project → **Storage** → **Create Database**
2. Choose **Neon** (Postgres)
3. Connect to project — Vercel auto-sets `DATABASE_URL` (and often `POSTGRES_URL`)

> If only `POSTGRES_URL` is set, add in Settings → Environment Variables:  
> `DATABASE_URL` = same value as `POSTGRES_URL` (all environments)

---

## Step 3 — Environment variables

Set for **Production**, **Preview**, and **Development**:

| Variable | Example | Required |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://...` | ✅ from Neon |
| `AUTH_SECRET` | `openssl rand -base64 32` | ✅ min 32 chars |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | ✅ use production URL |
| `NEXT_PUBLIC_APP_URL` | same as NEXTAUTH_URL | ✅ |
| `UPSTASH_REDIS_REST_URL` | `https://your-upstash-url.upstash.io` | ✅ from Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | `your-token` | ✅ from Upstash |
| `SERVICE_CITY` | `Casablanca` | optional |
| `NOMINATIM_USER_AGENT` | `GreenCollect/1.0 (you@email.com)` | recommended |
| `RESEND_API_KEY` | `re_...` | optional (email) |
| `SEED_PASSWORD` | strong password | only for one-time seed |

**Generate AUTH_SECRET (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

---

## Step 5 — Build settings (already in repo)

`vercel.json`:
- **Build:** `prisma generate && prisma migrate deploy && next build`
- **Region:** `cdg1` (Paris — close to Morocco)

`package.json` includes `postinstall: prisma generate` and `vercel-build` script.

---

## Step 6 — Deploy

### Option A — Git push (recommended)

Push to `main` → Vercel deploys automatically.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
vercel --prod
```

### Option C — Cursor Vercel plugin

Use command **deploy** or MCP **deploy_to_vercel**.

---

## Step 7 — Seed database (first time only)

After first successful deploy, run seed against production DB **once**:

```bash
# With production DATABASE_URL in shell
npx prisma migrate deploy
npm run db:seed
```

Or use Neon SQL console / local machine with production `DATABASE_URL` from Vercel env pull.

**Seed logins** (change password in production via admin UI):
- `admin@greencollect.ma`
- `user1@greencollect.ma`

---

## Step 8 — Verify

1. Open `https://your-project.vercel.app/fr`
2. `GET https://your-project.vercel.app/api/health` → `{ "status": "ok", "db": "connected" }`
3. Login as admin, confirm dashboard loads

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on `prisma migrate` | Ensure `DATABASE_URL` is set for **Build** environment |
| `AUTH_SECRET` error at runtime | Set 32+ char secret; redeploy |
| Auth redirect loop | `NEXTAUTH_URL` must match exact production URL (https) |
| Empty waste types | Run `npm run db:seed` against production DB |
| Geocode slow/blocked | Set `NOMINATIM_USER_AGENT`; respect rate limits |
| Rate limiting not working | Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set |
| `@upstash/redis` connection error | Verify Upstash Redis region matches Vercel region (use `cdg1` or `eu-west-1`) |

---

## Production checklist

- [ ] `AUTH_SECRET` set (not placeholder)
- [ ] `NEXTAUTH_URL` = https production domain
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set
- [ ] Neon backups enabled
- [ ] Uptime monitor on `/api/health`
- [ ] [`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md) signed off
