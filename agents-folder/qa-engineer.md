# QA Engineer

## Test pyramid

| Layer | Tool | Coverage target (MVP) |
|-------|------|----------------------|
| Unit | Vitest | Services, validators, transitions |
| Integration | Vitest + test DB | API routes with mocked session |
| E2E | Playwright | Critical paths below |

---

## Test setup

```
tests/
├── unit/
│   ├── pickups/transitions.test.ts
│   └── validators/pickup.test.ts
├── integration/
│   └── api/pickups.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── book-pickup.spec.ts
    └── collector-flow.spec.ts
```

**DB:** `greencollect_e2e` — reset with `prisma migrate reset --force` before E2E CI job.

**Auth in tests:** seed user tokens via direct session cookie injection or test-only `POST /api/test/login` (non-production only).

---

## Critical paths (must pass before release)

### CP-1: Resident books pickup

1. Register / login as USER
2. Add address with map
3. Create pickup → status REQUESTED
4. See pickup on dashboard

### CP-2: Dispatcher assigns collector

1. Login DISPATCHER
2. Confirm pickup → CONFIRMED
3. Assign collector → ASSIGNED
4. Customer receives notification record (email mocked)

### CP-3: Collector completes route

1. Login COLLECTOR
2. View today's route
3. Transition ASSIGNED → EN_ROUTE → ARRIVED → COMPLETED with weight
4. Record CASH payment → PAID

### CP-4: Admin manages catalog

1. Login ADMIN
2. Update waste type fee
3. New pickup uses new fee

### CP-5: RBAC negative tests

1. USER cannot assign collector → 403
2. COLLECTOR cannot access admin stats → 403
3. USER cannot read another user's pickup → 404/403

---

## Unit test examples

**`transitions.test.ts`**

- All allowed transitions pass `assertTransition`
- Invalid transition throws `INVALID_STATUS_TRANSITION`
- Role matrix spot-check per `security-engineer.md`

**`validators.test.ts`**

- Rejects past `scheduledDate`
- Rejects phone without +212
- Rejects city ≠ SERVICE_CITY

---

## E2E conventions

- Use `data-testid` sparingly: `pickup-submit`, `assign-collector`, `status-complete`
- Base URL: `http://localhost:3000/fr`
- Run headless in CI; headed locally for debug

---

## CI quality gates

| Gate | Command |
|------|---------|
| Lint | `npm run lint` |
| Types | `npm run typecheck` |
| Unit+integration | `npm run test` |
| E2E (staging) | `npm run test:e2e` on merge to `main` |

Minimum coverage: **70%** on `src/server/**` for v1.

---

## Bug tracking

- GitHub Issues labels: `bug`, `p0`, `p1`, `p2`
- `p0`: payment wrong, auth bypass, data leak — block release
- Template: steps, expected, actual, role, locale

---

## Manual test matrix (pre-release)

| Case | fr | ar | en |
|------|----|----|-----|
| Book pickup | ✓ | ✓ | ✓ |
| RTL layout | — | ✓ | — |
| Login | ✓ | ✓ | ✓ |

---

## QA checklist

- [ ] CP-1 through CP-5 automated
- [ ] No test depends on external Nominatim (mock geo in tests)
- [ ] Seed data documented for reproducibility
