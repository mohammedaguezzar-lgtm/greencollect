# GreenCollect Morocco — AI Agent Workspace

Production-grade SaaS for **recyclable waste collection in Morocco**. Residents and businesses request pickups; collectors execute routes; dispatchers and admins operate the platform.

## Product codename

**GreenCollect** (`greencollect` in repos, `greencollect_ma` in DB names).

## MVP scope (v1.0)

| In scope | Out of scope (v2+) |
|----------|-------------------|
| Single service zone: **Casablanca** (configurable `SERVICE_CITY`) | Multi-city tenancy |
| Roles: `USER`, `COLLECTOR`, `DISPATCHER`, `ADMIN` | Fine-grained custom permissions |
| Pickup booking + admin/dispatcher assignment | Automated OR-Tools routing |
| Collector status updates + map pin | Real-time WebSocket GPS |
| NextAuth (email/password) + session cookies | Mobile JWT API |
| Per-pickup flat fee (MAD) + cash/CMI stub | Full Stripe subscriptions |
| Email notifications | SMS (Infobip) |
| i18n: `ar`, `fr`, `en` (RTL for `ar`) | Darija locale file |
| Leaflet + OSM map display | Turn-by-turn navigation app |

## Tech stack (canonical)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router), TypeScript strict |
| API | Route Handlers under `/app/api/v1/*` |
| Auth | Auth.js (NextAuth v5) — database sessions |
| ORM | Prisma 6 + PostgreSQL 16 |
| Validation | Zod (shared `packages/validators` or `src/lib/validators`) |
| UI | Tailwind CSS 4 + shadcn/ui |
| i18n | `next-intl` |
| Maps | Leaflet + OpenStreetMap tiles; Nominatim geocoding |
| Cache / jobs | Redis 7 (BullMQ for async jobs — v1.1) |
| Containers | Docker Compose: `app`, `postgres`, `redis` |
| CI | GitHub Actions: lint, typecheck, test, migrate deploy |

## Repository layout (target)

```
/
├── agents-folder/          # This documentation (source of truth for agents)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── [locale]/       # Localized pages
│   │   └── api/v1/         # REST API
│   ├── components/
│   ├── lib/                # auth, db, validators, permissions
│   └── server/             # services (pickup, route, payment)
├── docker-compose.yml
└── .env.example
```

## Documentation index

| File | Purpose |
|------|---------|
| [software-architect.md](./software-architect.md) | System architecture, modules, ADRs |
| [prisma-schema-guide.md](./prisma-schema-guide.md) | Canonical database schema |
| [database-engineer.md](./database-engineer.md) | Indexes, migrations, performance |
| [api-contracts.md](./api-contracts.md) | REST API specification |
| [security-engineer.md](./security-engineer.md) | Auth, RBAC, threat model |
| [backend-engineer.md](./backend-engineer.md) | Services, validation, jobs |
| [frontend-engineer.md](./frontend-engineer.md) | Pages, components, data fetching |
| [ui-ux-designer.md](./ui-ux-designer.md) | Screens, flows, accessibility |
| [devops-engineer.md](./devops-engineer.md) | Docker, CI/CD, environments |
| [maps-routing-system.md](./maps-routing-system.md) | Geocoding, maps, routing phases |
| [monetization-strategy.md](./monetization-strategy.md) | Pricing, payments, billing states |
| [analytics-reporting.md](./analytics-reporting.md) | Metrics, dashboards, formulas |
| [localization-guide.md](./localization-guide.md) | Locales, RTL, translation keys |
| [coding-standards.md](./coding-standards.md) | Naming, structure, lint rules |
| [qa-engineer.md](./qa-engineer.md) | Test strategy, critical paths |
| [project-roadmap.md](./project-roadmap.md) | Phased delivery aligned with implementation |

## Cross-file consistency rules

1. **Enums** — `PickupStatus`, `UserRole`, `PaymentStatus` are defined once in `prisma-schema-guide.md` and copied verbatim to API and frontend docs.
2. **IDs** — All primary keys are UUID v4 (`String @id @default(uuid())` in Prisma).
3. **Money** — Amounts stored as integer **centimes** (`amountMadCents`) or `Decimal(10,2)` in MAD; API exposes `amountMad` as number with 2 decimals.
4. **Timestamps** — ISO 8601 UTC in JSON; DB uses `timestamptz`.
5. **Authorization** — Every mutating endpoint lists required role(s) in `api-contracts.md` matching `security-engineer.md`.

## Implementation progress

Live step + file tracker: [`../IMPLEMENTATION-PLAN.md`](../IMPLEMENTATION-PLAN.md)

## Agent workflow

1. Read `software-architect.md` for boundaries.
2. Implement schema from `prisma-schema-guide.md`.
3. Implement APIs from `api-contracts.md` with RBAC from `security-engineer.md`.
4. Build UI per `frontend-engineer.md` + `ui-ux-designer.md`.
5. Verify against `qa-engineer.md` critical paths.

## Environment variables (minimum)

See `devops-engineer.md` for full list. Required for local dev:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `REDIS_URL` (optional in MVP)
- `NOMINATIM_BASE_URL` (default: public Nominatim with rate limit respect)
