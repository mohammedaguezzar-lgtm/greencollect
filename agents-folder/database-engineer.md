# Database Engineer Agent

## Responsibilities

- Implement and maintain schema per `prisma-schema-guide.md`
- Indexing, query optimization, migrations, backups
- Seed data for dev/staging

---

## Connection & pooling

| Environment | Config |
|-------------|--------|
| Local Docker | `postgresql://greencollect:greencollect@localhost:5432/greencollect_ma` |
| Production | PgBouncer transaction mode; `?pgbouncer=true` on Prisma URL |

**Prisma client:** singleton in `src/lib/db.ts`; disconnect only in serverless if required by host.

---

## Indexes (beyond Prisma schema)

Verify these exist after first migration:

| Table | Index | Reason |
|-------|-------|--------|
| `Pickup` | `(status, scheduledDate)` | Dispatcher dashboard |
| `Pickup` | `(assignedCollectorId, scheduledDate)` | Collector daily list |
| `User` | `(email)` | unique — login |
| `AuditLog` | `(createdAt DESC)` | Admin audit viewer v1.1 |

Add composite via raw migration if Prisma DSL insufficient:

```sql
CREATE INDEX idx_pickup_status_date ON "Pickup" ("status", "scheduledDate");
```

---

## Common queries (optimized patterns)

### Dispatcher: pending pickups today

```typescript
prisma.pickup.findMany({
  where: {
    status: { in: ['REQUESTED', 'CONFIRMED'] },
    scheduledDate: today,
  },
  include: { customer: true, address: true, wasteType: true },
  orderBy: { createdAt: 'asc' },
  take: 100,
});
```

### Collector: my route today

```typescript
prisma.route.findUnique({
  where: { collectorId_date: { collectorId, date: today } },
  include: {
    pickups: {
      include: { address: true, wasteType: true },
      orderBy: { scheduledDate: 'asc' },
    },
  },
});
```

### Analytics: completed weight sum (date range)

```typescript
prisma.pickup.aggregate({
  where: {
    status: 'COMPLETED',
    updatedAt: { gte: from, lte: to },
  },
  _sum: { actualWeightKg: true },
});
```

Use `read replica` URL env `DATABASE_URL_REPLICA` for analytics in v2.

---

## Transactions

Use `$transaction` for:

1. Set default address (unset others + set one)
2. Pickup assignment + status history + audit log
3. Payment success + pickup `paymentStatus: PAID`

---

## Migrations workflow

```bash
npx prisma migrate dev --name describe_change
npx prisma generate
npx prisma migrate deploy   # production
```

**Naming:** `20260525_add_pickup_proof_photo`

Never delete production migrations.

---

## Backup & recovery

| Item | MVP | Production |
|------|-----|------------|
| Frequency | Manual weekly | Daily automated |
| Tool | `pg_dump` | Managed provider snapshots |
| Retention | 7 days local | 30 days |
| Test restore | Quarterly | Quarterly |

Document RPO/RTO in `devops-engineer.md`.

---

## Data integrity constraints

| Rule | Enforcement |
|------|-------------|
| FK cascades | `onDelete: Cascade` on child auth/address rows only |
| Pickup collector role | App service check before assign |
| One route per collector per day | `@@unique([collectorId, date])` |
| Monetary precision | `Decimal(10,2)` — never float |

---

## Fix schema relation gap

Add to `User` model in implementation:

```prisma
statusHistoryAuthored PickupStatusHistory[]
```

And on `PickupStatusHistory`:

```prisma
actor User? @relation(fields: [actorId], references: [id])
```

---

## Performance budgets

| Query | Max rows | Max time |
|-------|----------|----------|
| User pickup list | 100/page | 50ms |
| Admin stats | aggregates only | 200ms |
| Geocode | N/A (external) | 5s timeout |

Enable `log: ['query']` in dev only; use Prisma metrics in production.

---

## Seed & test data

- `prisma/seed.ts` idempotent (`upsert` by email/code)
- E2E database: separate `greencollect_e2e` — reset before Playwright suite

See `prisma-schema-guide.md` for seed record counts.
