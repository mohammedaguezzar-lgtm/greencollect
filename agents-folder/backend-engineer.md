# Backend Engineer Agent

## Stack

- Next.js 15 Route Handlers (`src/app/api/v1/...`)
- Prisma + PostgreSQL
- Zod validation
- Auth.js session in handlers

## Layered architecture

```
Route Handler  →  Service  →  Prisma
     ↓              ↓
   Zod parse    Business rules + RBAC
```

**Do not** call Prisma directly from Route Handlers except in trivial health check.

---

## Directory structure

```
src/
├── app/api/v1/
│   ├── me/route.ts
│   ├── users/[id]/route.ts
│   ├── addresses/route.ts
│   ├── pickups/route.ts
│   ├── pickups/[id]/route.ts
│   ├── pickups/[id]/status/route.ts
│   ├── pickups/[id]/assign/route.ts
│   ├── collectors/route.ts
│   ├── routes/route.ts
│   ├── waste-types/route.ts
│   ├── geo/geocode/route.ts
│   └── admin/stats/route.ts
├── lib/
│   ├── db.ts
│   ├── auth.ts          # Auth.js config
│   ├── permissions.ts
│   └── validators/      # Zod schemas
└── server/
    ├── pickups/service.ts
    ├── pickups/transitions.ts
    ├── users/service.ts
    ├── routes/service.ts
    ├── payments/service.ts
    ├── geo/nominatim.ts
    └── notifications/email.ts
```

---

## Route Handler template

```typescript
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return jsonError(401, 'UNAUTHORIZED');
  requireRole(session, ['USER']);

  const body = createPickupSchema.safeParse(await req.json());
  if (!body.success) return jsonError(400, 'VALIDATION_ERROR', body.error.flatten());

  const pickup = await pickupService.create(session.user.id, body.data);
  return NextResponse.json({ data: pickup }, { status: 201 });
}
```

---

## Pickup service (core logic)

`src/server/pickups/service.ts`

| Method | Description |
|--------|-------------|
| `create(customerId, dto)` | Validate address ownership, city, waste type; set fee from catalog |
| `list(filters, session)` | Scope by role |
| `getById(id, session)` | IDOR check |
| `transition(id, session, dto)` | `assertTransition` + history + optional notifications |
| `assign(id, session, dto)` | Verify collector role; set ASSIGNED |
| `cancel(id, session, reason)` | CANCELLED + timestamp |

`src/server/pickups/transitions.ts` — state machine from `software-architect.md`.

---

## Auth configuration

- Provider: Credentials (email + password)
- Optional v1.1: Google OAuth
- Callbacks: attach `role` and `id` to session token from DB
- File: `src/lib/auth.ts`

```typescript
// Session shape extension
interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}
```

---

## Validation (Zod)

One file per resource: `src/lib/validators/pickup.ts`

- Reuse enums: `z.enum(['REQUESTED', 'CONFIRMED', ...])`
- Phone: Morocco format `+212[5-7]\d{8}`
- Time window: regex `^([01]\d|2[0-3]):[0-5]\d$`
- `scheduledDate`: not in past (Morocco timezone `Africa/Casablanca`)

---

## Notifications (MVP)

| Event | Template | Channel |
|-------|----------|---------|
| Pickup CONFIRMED | `pickup-confirmed` | EMAIL |
| Pickup ASSIGNED | `pickup-assigned` | EMAIL |
| Pickup COMPLETED | `pickup-completed` | EMAIL |

Implementation: insert `Notification` row + send via Resend/SMTP async (inline await MVP; queue v1.1).

---

## Geo service

`src/server/geo/nominatim.ts`

- User-Agent header required by Nominatim policy
- Cache geocode results in Redis 24h keyed by query hash
- Morocco bounding box validation on results

---

## Payments service

See `monetization-strategy.md`.

- `calculateFee(wasteTypeId)` → `flatFeeMad`
- `recordPayment(pickupId, provider)` → create `Payment`, update pickup `paymentStatus`

---

## Error codes (canonical)

| Code | HTTP |
|------|------|
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `VALIDATION_ERROR` | 400 |
| `INVALID_STATUS_TRANSITION` | 409 |
| `ADDRESS_IN_USE` | 409 |
| `SERVICE_CITY_MISMATCH` | 400 |

---

## Background jobs (v1.1)

| Job | Queue | Trigger |
|-----|-------|---------|
| Send email | BullMQ | After pickup transition |
| Daily analytics rollup | BullMQ cron | 02:00 Africa/Casablanca |

---

## Health check

`GET /api/health` (no version prefix):

```json
{ "status": "ok", "db": "connected" }
```

---

## Backend checklist

- [ ] Handler → service → Prisma
- [ ] Zod on all inputs
- [ ] RBAC on all mutations
- [ ] Status history on every pickup transition
- [ ] API response matches `api-contracts.md`
