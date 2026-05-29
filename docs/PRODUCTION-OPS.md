# Production operations — GreenCollect

Referenced by E6 security checklist.

## Database backups

| Item | Recommendation |
|------|----------------|
| Managed Postgres (Neon, Supabase, RDS) | Enable **daily automated backups**, 30-day retention |
| Self-hosted Docker | Cron `pg_dump` → encrypted S3-compatible storage |
| RPO | 24 hours |
| RTO | 4 hours |
| Restore test | Quarterly drill |

## Health monitoring

- **Endpoint:** `GET /api/health` → `{ "status": "ok", "db": "connected" }`
- **Tool:** UptimeRobot, Better Stack, or Datadog synthetic — interval 5 min
- **Alert:** Pager/email on 2 consecutive failures

## Docker deployment

- Local development: `docker compose -f docker-compose.local.yml up --build`
- Production-style: `docker compose -f docker-compose.prod.yml up --build -d`
- Use `.env` for environment configuration and secrets.

## Secrets (production)

```bash
openssl rand -base64 32   # AUTH_SECRET
```

Set in hosting provider secrets (Vercel, Railway, etc.):

- `AUTH_SECRET` (≥ 32 chars)
- `DATABASE_URL`
- `NEXTAUTH_URL` (https://)
- `RESEND_API_KEY` (optional)

`validateProductionEnv()` runs at startup via `src/instrumentation.ts`.

## HTTPS

- Enforce TLS at load balancer / Vercel edge
- `useSecureCookies: true` when `NODE_ENV=production`

## npm audit

Before each release:

```bash
npm audit
npm audit fix   # review breaking changes
```

Dependabot opens weekly PRs (`.github/dependabot.yml`).
