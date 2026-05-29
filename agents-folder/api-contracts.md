# API Contracts

**Base URL:** `/api/v1`  
**Format:** JSON (`Content-Type: application/json`)  
**Auth:** Auth.js session cookie (`next-auth.session-token`) — all protected routes return `401` if unauthenticated.  
**Versioning:** URL prefix `/v1`; breaking changes require `/v2`.

---

## Standard response shapes

### Success (single resource)

```json
{
  "data": { }
}
```

### Success (collection)

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error

```json
{
  "error": {
    "code": "PICKUP_NOT_FOUND",
    "message": "Human-readable message",
    "details": []
  }
}
```

| HTTP | When |
|------|------|
| 400 | Validation failed (`VALIDATION_ERROR`) |
| 401 | Not authenticated |
| 403 | Forbidden (`FORBIDDEN`) |
| 404 | Resource not found |
| 409 | Conflict (`INVALID_STATUS_TRANSITION`) |
| 429 | Rate limited |
| 500 | Internal error (no stack trace in body) |

---

## Pagination & filtering

Query params for list endpoints:

| Param | Type | Default |
|-------|------|---------|
| `page` | int ≥ 1 | 1 |
| `pageSize` | int 1–100 | 20 |
| `sort` | `createdAt:desc` | field:direction |
| `status` | enum | filter pickups |
| `scheduledDate` | ISO date | filter pickups |
| `collectorId` | UUID | admin/dispatcher |

---

## Auth endpoints

Auth.js handles these via `/api/auth/*` (not under `/v1`):

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signin` | Credentials sign-in |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/session` | Current session |

### `GET /api/v1/me`

**Roles:** any authenticated  
**Response `data`:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "string",
  "phone": "+212...",
  "role": "USER",
  "status": "ACTIVE",
  "locale": "fr",
  "organizationId": null
}
```

### `PATCH /api/v1/me`

**Roles:** any authenticated  
**Body (partial):**

```json
{
  "name": "string",
  "phone": "+212612345678",
  "locale": "ar"
}
```

---

## Users (admin)

### `GET /api/v1/users`

**Roles:** `ADMIN`, `DISPATCHER`  
**Query:** `role`, `status`, `page`, `pageSize`, `search` (email/name)

### `GET /api/v1/users/:id`

**Roles:** `ADMIN`, `DISPATCHER`

### `PATCH /api/v1/users/:id`

**Roles:** `ADMIN`  
**Body:**

```json
{
  "role": "COLLECTOR",
  "status": "SUSPENDED"
}
```

### `POST /api/v1/users` (admin create)

**Roles:** `ADMIN`  
**Body:**

```json
{
  "email": "collector@greencollect.ma",
  "name": "string",
  "password": "min 8 chars",
  "role": "COLLECTOR",
  "phone": "+212..."
}
```

---

## Addresses

### `GET /api/v1/addresses`

**Roles:** `USER` (own), `ADMIN` (any with userId query)

### `POST /api/v1/addresses`

**Roles:** `USER`, `ADMIN`  
**Body:**

```json
{
  "label": "Home",
  "line1": "Bd Zerktouni",
  "line2": "Apt 4",
  "district": "Maarif",
  "city": "Casablanca",
  "postalCode": "20000",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "isDefault": true
}
```

**Validation:** `city` must equal `SERVICE_CITY`; lat/lng within Morocco bounding box (app config).

### `PATCH /api/v1/addresses/:id` — owner or `ADMIN`

### `DELETE /api/v1/addresses/:id` — owner or `ADMIN` (fail if open pickups reference it)

---

## Waste types (catalog)

### `GET /api/v1/waste-types`

**Roles:** public (no auth) or authenticated  
**Response:** active types with `code`, `nameKey`, `flatFeeMad`

### `PATCH /api/v1/waste-types/:id`

**Roles:** `ADMIN` — update `flatFeeMad`, `active`

---

## Pickups

### `POST /api/v1/pickups`

**Roles:** `USER` (and B2B `USER` with `organizationId`)  
**Body:**

```json
{
  "addressId": "uuid",
  "wasteTypeId": "uuid",
  "scheduledDate": "2026-05-26",
  "timeWindowStart": "09:00",
  "timeWindowEnd": "12:00",
  "estimatedWeightKg": 5,
  "notes": "optional"
}
```

**Server sets:** `status: REQUESTED`, `feeAmountMad` from waste type, `paymentStatus: PENDING`, `customerId` from session.

### `GET /api/v1/pickups`

| Caller | Scope |
|--------|-------|
| `USER` | Own pickups only |
| `COLLECTOR` | Assigned to self |
| `DISPATCHER`, `ADMIN` | All (filters) |

### `GET /api/v1/pickups/:id`

**Roles:** customer, assigned collector, `DISPATCHER`, `ADMIN`

### `PATCH /api/v1/pickups/:id/status`

**Roles:** depends on transition — see `security-engineer.md` matrix  
**Body:**

```json
{
  "status": "CONFIRMED",
  "note": "optional",
  "actualWeightKg": 12.5,
  "proofPhotoUrl": "https://..."
}
```

**Rules:**

- `actualWeightKg` required when → `COMPLETED`
- `proofPhotoUrl` optional MVP, required v1.1 for B2B
- Invalid transition → `409 INVALID_STATUS_TRANSITION`

### `PATCH /api/v1/pickups/:id/assign`

**Roles:** `DISPATCHER`, `ADMIN`  
**Body:**

```json
{
  "assignedCollectorId": "uuid",
  "routeId": "uuid"
}
```

**Side effect:** status → `ASSIGNED` if was `CONFIRMED`; append `PickupStatusHistory`.

### `DELETE /api/v1/pickups/:id` — cancel

**Roles:** `USER` (own, only if `REQUESTED` or `CONFIRMED`), `DISPATCHER`, `ADMIN`  
**Body:** `{ "cancellationReason": "string" }`  
**Side effect:** status → `CANCELLED`, `cancelledAt` set.

---

## Collectors

### `GET /api/v1/collectors`

**Roles:** `DISPATCHER`, `ADMIN`  
**Response:** users where `role = COLLECTOR` and `status = ACTIVE` with today's pickup count.

### `GET /api/v1/collectors/:id/pickups`

**Roles:** collector (self), `DISPATCHER`, `ADMIN`  
**Query:** `scheduledDate` (default today)

---

## Routes

### `POST /api/v1/routes`

**Roles:** `DISPATCHER`, `ADMIN`  
**Body:**

```json
{
  "collectorId": "uuid",
  "date": "2026-05-26",
  "pickupIds": ["uuid", "uuid"]
}
```

Creates `Route` with `pickupOrder` JSON; links pickups.

### `GET /api/v1/routes`

**Roles:** `COLLECTOR` (own), `DISPATCHER`, `ADMIN`

### `PATCH /api/v1/routes/:id`

**Roles:** `DISPATCHER`, `ADMIN` — update `pickupOrder`, `status`  
**Roles:** `COLLECTOR` — update route `status` to `IN_PROGRESS` | `COMPLETED` only

---

## Payments

### `POST /api/v1/pickups/:id/payments`

**Roles:** `USER`, `ADMIN`, `DISPATCHER`  
**Body:**

```json
{
  "provider": "CASH",
  "amountMad": 50.00
}
```

### `GET /api/v1/pickups/:id/payments`

**Roles:** customer, `ADMIN`, `DISPATCHER`

See `monetization-strategy.md` for status transitions.

---

## Admin / analytics

### `GET /api/v1/admin/stats`

**Roles:** `ADMIN`, `DISPATCHER`  
**Response:**

```json
{
  "data": {
    "pickupsToday": 0,
    "pickupsCompletedToday": 0,
    "revenueTodayMad": 0,
    "activeCollectors": 0,
    "pendingRequests": 0
  }
}
```

### `GET /api/v1/admin/analytics`

**Roles:** `ADMIN`  
**Query:** `from`, `to` (ISO dates)  
**Response:** see `analytics-reporting.md`

---

## Geocoding (proxy)

### `POST /api/v1/geo/geocode`

**Roles:** authenticated  
**Body:** `{ "query": "Bd Zerktouni, Casablanca" }`  
**Response:**

```json
{
  "data": {
    "latitude": 33.5731,
    "longitude": -7.5898,
    "displayName": "string"
  }
}
```

Rate limit: 10 req/min per user (Nominatim policy compliance).

---

## Organizations (B2B — v1 stub)

### `GET /api/v1/organizations/:id`

**Roles:** member `USER` or `ADMIN`

### `POST /api/v1/organizations`

**Roles:** `ADMIN`

---

## Webhooks (v2)

Reserved: `POST /api/v1/webhooks/cmi` for payment provider callbacks.

---

## TypeScript DTO alignment

Generate Zod schemas in `src/lib/validators/` mirroring request bodies above. Export inferred types for frontend.

| Prisma model | API resource name |
|--------------|-------------------|
| `User` | `user` |
| `Address` | `address` |
| `Pickup` | `pickup` |
| `WasteType` | `wasteType` |
| `Route` | `route` |
| `Payment` | `payment` |

**Field naming:** API uses camelCase; maps 1:1 to Prisma fields.
