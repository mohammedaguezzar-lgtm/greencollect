# Security Engineer

## Auth strategy (MVP)

| Concern | Implementation |
|---------|----------------|
| Web sessions | Auth.js v5 with **database sessions** (`Session` model) |
| Password storage | bcrypt, cost factor 12 |
| Session cookie | `httpOnly`, `secure` in production, `sameSite: lax` |
| CSRF | Built into Auth.js for auth routes; use CSRF token for state-changing forms if needed |
| API protection | `getServerSession()` in every `/api/v1/*` handler |
| JWT | **Not used in v1** — document for v2 mobile API only |

### Password policy

- Minimum 8 characters
- Block common passwords (optional lib: `zxcvbn` threshold 2)
- Rate limit login: 5 failures / 15 min per email (Redis or in-memory MVP)

### Email verification

- `User.status` stays `PENDING_VERIFICATION` until verified
- MVP: allow booking but show banner; production: block `POST /pickups` until verified

---

## RBAC permission matrix

Roles (hierarchy for override): `ADMIN` > `DISPATCHER` > `COLLECTOR` > `USER`

| Resource / Action | USER | COLLECTOR | DISPATCHER | ADMIN |
|-------------------|:----:|:---------:|:----------:|:-----:|
| Read own profile | ✓ | ✓ | ✓ | ✓ |
| Update own profile | ✓ | ✓ | ✓ | ✓ |
| Manage own addresses | ✓ | — | — | ✓ |
| Create pickup (self) | ✓ | — | — | ✓ |
| Cancel own pickup (REQUESTED/CONFIRMED) | ✓ | — | ✓ | ✓ |
| Read own pickups | ✓ | assigned | all | all |
| Transition pickup status | — | see below | see below | ✓ |
| Assign collector | — | — | ✓ | ✓ |
| Manage routes | — | own update | ✓ | ✓ |
| List all users | — | — | ✓ | ✓ |
| Change user role/status | — | — | — | ✓ |
| Manage waste type pricing | — | — | — | ✓ |
| Admin stats / analytics | — | — | ✓ | ✓ |
| Record payment | own pickup | — | ✓ | ✓ |

### Pickup status transitions by role

| From → To | USER | COLLECTOR | DISPATCHER | ADMIN |
|-----------|:----:|:---------:|:----------:|:-----:|
| REQUESTED → CONFIRMED | — | — | ✓ | ✓ |
| REQUESTED → CANCELLED | ✓ | — | ✓ | ✓ |
| CONFIRMED → ASSIGNED | — | — | ✓ | ✓ |
| CONFIRMED → CANCELLED | ✓ | — | ✓ | ✓ |
| ASSIGNED → EN_ROUTE | — | ✓ | — | ✓ |
| EN_ROUTE → ARRIVED | — | ✓ | — | ✓ |
| ARRIVED → COMPLETED | — | ✓ | — | ✓ |
| ARRIVED → NO_SHOW | — | ✓ | ✓ | ✓ |
| ASSIGNED → CANCELLED | — | — | ✓ | ✓ |

Enforce in `src/server/pickups/transition.ts` — single function `assertTransition(role, from, to)`.

---

## Authorization implementation

```typescript
// src/lib/permissions.ts
export function requireRole(session: Session, allowed: UserRole[]): void
export function canAccessPickup(session: Session, pickup: Pickup): boolean
```

- Never trust `customerId` from request body — derive from session.
- `assignedCollectorId` must match session user when role is `COLLECTOR`.

---

## API security

| Control | Detail |
|---------|--------|
| Input validation | Zod on all POST/PATCH bodies |
| SQL injection | Prisma parameterized queries only |
| XSS | React escaping; sanitize rich text if added |
| Rate limiting | `/api/v1/geo/geocode` 10/min; auth 5/15min; global 100/min per IP (Redis) |
| Headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` |
| CORS | Same-origin only for MVP (no public API) |

---

## Sensitive data

| Data | Classification | Storage | Retention |
|------|----------------|---------|-----------|
| email, phone, name | PII | PostgreSQL encrypted at rest (provider) | Account lifetime + 30d |
| passwordHash | Secret | PostgreSQL | Until account deleted |
| address, lat/lng | PII | PostgreSQL | User-deletable |
| proofPhotoUrl | PII | Object storage URL | 1 year |
| AuditLog | Operational | PostgreSQL | 2 years |

### Morocco Law 09-08 (personal data)

- Publish privacy policy (FR/AR) before launch
- Consent checkbox on registration
- Right to access/delete — `ADMIN` process + export endpoint v1.1
- Data processor agreements with hosting provider

---

## Audit logging

Write `AuditLog` on:

- User role/status change
- Pickup assignment
- Payment status → `PAID` / `REFUNDED`
- Admin login from new IP (optional v1.1)

Include `actorId`, `ipAddress` from `x-forwarded-for` (trust proxy only behind load balancer).

---

## Secrets management

| Secret | Location |
|--------|----------|
| `AUTH_SECRET` | Env / vault, rotate yearly |
| `DATABASE_URL` | Env only, never client |
| Payment API keys | Env, separate per environment |

Never commit `.env`. Use `.env.example` with placeholders.

---

## Threat model (top risks)

| Threat | Mitigation |
|--------|------------|
| Session hijack | HTTPS, httpOnly cookies, short session 30d max |
| IDOR on pickups | `canAccessPickup()` on every read/update |
| Privilege escalation | Role change ADMIN-only; deny self-promotion |
| Mass assignment | Zod strict schemas, no `role` in user self-update |
| Geocode abuse | Rate limit; server-side proxy only |
| File upload abuse | Presigned URLs; MIME whitelist; max 5MB (v1.1) |

---

## Security checklist (pre-release)

- [ ] All `/api/v1` routes call `getServerSession` or explicit public allowlist
- [ ] RBAC matrix covered by integration tests
- [ ] `AUTH_SECRET` ≥ 32 random bytes
- [ ] Production `secure` cookies enabled
- [ ] Dependencies scanned (`npm audit`, Dependabot)
- [ ] No PII in application logs
