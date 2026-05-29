# GreenCollect Morocco

SaaS platform for recyclable waste collection in Casablanca.

## Quick start

1. Install [Node.js 20+](https://nodejs.org/) (npm included).
2. Copy env: `cp .env.example .env`
3. Start database: `docker compose up -d`
4. Install & migrate:
   ```bash
   npm install
   npx prisma migrate dev --name init
   npm run db:seed
   ```
5. Run app: `npm run dev` → http://localhost:3000/fr

## Seed logins

Password: value of `SEED_PASSWORD` in `.env` (default `ChangeMeInDevOnly!`)

| Email | Role |
|-------|------|
| admin@greencollect.ma | ADMIN |
| dispatcher@greencollect.ma | DISPATCHER |
| collector1@greencollect.ma | COLLECTOR |
| user1@greencollect.ma | USER |

## Docs

- Agent specs: [`agents-folder/README.md`](./agents-folder/README.md)
- **Implementation tracker:** [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:deploy` | Apply migrations (prod/CI) |
| `npm run db:seed` | Seed database |
| `npm run test` | Vitest unit + integration |
| `npm run test:unit` | Unit tests only (no database) |
| `npm run test:integration` | API + service tests (needs Postgres + seed) |
| `npm run test:e2e` | Playwright smoke tests |

## Deploy on Vercel

Full guide: [`docs/VERCEL-DEPLOY.md`](./docs/VERCEL-DEPLOY.md)

**Quick steps:**
1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Add **Neon Postgres** (Storage → Create Database)
3. Set env vars: `DATABASE_URL`, `AUTH_SECRET` (32+ chars), `NEXTAUTH_URL` (https://your-app.vercel.app)
4. Deploy — build runs `prisma migrate deploy` automatically
5. Run `npm run db:seed` once against production DB

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

## Docker deployment

The project supports both local development and production-style Docker Compose setups.

### Local development

1. Copy env: `cp .env.example .env`
2. Update `.env` as needed for local testing.
3. Start local services:

```bash
docker compose -f docker-compose.local.yml up --build
```

4. Open: [http://localhost:3000](http://localhost:3000)

### Production-like deployment

1. Copy env: `cp .env.example .env`
2. Update `.env` with production values for `AUTH_SECRET`, `NEXTAUTH_URL`, and any mail/geo secrets.
3. Build and start:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

4. Open: [http://localhost:3000](http://localhost:3000)

> In both compose files, the app service connects to `postgres` and `redis` by service name.

## Production readiness

- **E6 security:** ✅ PASS — see [`SECURITY-CHECKLIST.md`](./SECURITY-CHECKLIST.md)
- **Ops:** [`docs/PRODUCTION-OPS.md`](./docs/PRODUCTION-OPS.md) (backups, monitoring, secrets)
- **Privacy:** `/fr/legal/privacy`, `/ar/legal/privacy`
- **Tracker:** [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) — 48/48 steps complete
