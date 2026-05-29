# DevOps Engineer Agent

## Environments

| Env | Purpose | URL pattern |
|-----|---------|-------------|
| `local` | Developer machines | `http://localhost:3000` |
| `staging` | Pre-prod testing | `https://staging.greencollect.ma` |
| `production` | Live users | `https://app.greencollect.ma` |

---

## Docker Compose (local)

```yaml
# docker-compose.yml services
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: greencollect
      POSTGRES_PASSWORD: greencollect
      POSTGRES_DB: greencollect_ma
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  # app runs on host in dev: npm run dev
```

**Production:** deploy Next.js to Vercel or Docker on VPS; managed Postgres (Neon, Supabase, or RDS).

---

## Environment variables

`.env.example`:

```bash
# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
SERVICE_CITY=Casablanca

# Database
DATABASE_URL=postgresql://greencollect:greencollect@localhost:5432/greencollect_ma

# Auth
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Redis (optional MVP)
REDIS_URL=redis://localhost:6379

# Email
EMAIL_FROM=noreply@greencollect.ma
RESEND_API_KEY=

# Geo
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=GreenCollect/1.0 (contact@greencollect.ma)

# Payments (v1 stub)
CMI_MERCHANT_ID=
CMI_SECRET=

# Seed
SEED_PASSWORD=ChangeMeInDevOnly!
```

**Rules:**

- `NEXT_PUBLIC_*` only for non-secret client config
- Never commit real secrets
- Staging/production secrets in GitHub Environments

---

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml`:

| Step | Command |
|------|---------|
| Install | `npm ci` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Unit tests | `npm run test` |
| Build | `npm run build` |
| Migrate (staging/prod only) | `npx prisma migrate deploy` |

**Deploy workflow** (on tag `v*` or merge to `main`):

1. Run CI
2. `prisma migrate deploy` against target DB
3. Deploy Next.js (Vercel auto or `docker build && push`)
4. Smoke test `GET /api/health`

---

## Dockerfile (production alternative)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Enable `output: 'standalone'` in `next.config.ts`.

---

## Observability (MVP → growth)

| Concern | MVP | v1.1 |
|---------|-----|------|
| Logs | stdout JSON (Vercel logs) | Axiom / Datadog |
| Errors | Sentry SDK | Sentry + alerts |
| Uptime | UptimeRobot on `/api/health` | PagerDuty |
| Metrics | Vercel Analytics | Prometheus |

---

## Backup

- Managed Postgres: enable provider daily backups
- Self-hosted: cron `pg_dump` → S3-compatible storage (encrypted)
- Test restore quarterly

**RPO:** 24h | **RTO:** 4h

---

## Security ops

- TLS everywhere (Let's Encrypt or platform TLS)
- Dependabot enabled
- Branch protection: require CI pass on `main`
- Separate DB credentials per environment

---

## DevOps checklist

- [ ] `docker compose up -d` starts postgres + redis
- [ ] CI runs on every PR
- [ ] Migrations run before app deploy
- [ ] Health endpoint monitored
- [ ] `.env.example` complete
