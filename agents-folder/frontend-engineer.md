# Frontend Engineer Agent

## Stack

- Next.js 15 App Router
- TypeScript strict
- Tailwind CSS 4 + shadcn/ui
- `next-intl` for `ar` | `fr` | `en`
- React Hook Form + Zod resolvers
- TanStack Query (optional) or native `fetch` + Server Components

---

## Route structure

```
src/app/[locale]/
├── (public)/
│   ├── page.tsx                 # Landing
│   ├── login/page.tsx
│   └── register/page.tsx
├── (customer)/
│   ├── dashboard/page.tsx
│   ├── pickups/
│   │   ├── page.tsx             # List
│   │   ├── new/page.tsx         # Booking wizard
│   │   └── [id]/page.tsx        # Detail + status
│   └── addresses/page.tsx
├── (collector)/
│   ├── dashboard/page.tsx
│   └── route/page.tsx           # Today's route + map
├── (dispatcher)/
│   ├── dashboard/page.tsx
│   ├── pickups/page.tsx         # Queue + assign
│   └── routes/page.tsx
└── (admin)/
    ├── dashboard/page.tsx
    ├── users/page.tsx
    ├── waste-types/page.tsx
    └── analytics/page.tsx
```

**Middleware** (`src/middleware.ts`):

- Locale detection + `next-intl`
- Auth redirect: unauthenticated → `/login`
- Role guard: wrong role → `/unauthorized`

---

## Role-based home redirects

| Role | Default path after login |
|------|--------------------------|
| `USER` | `/[locale]/dashboard` |
| `COLLECTOR` | `/[locale]/collector/dashboard` |
| `DISPATCHER` | `/[locale]/dispatcher/dashboard` |
| `ADMIN` | `/[locale]/admin/dashboard` |

---

## Key UI flows

### Booking wizard (`USER`)

1. Select waste type (cards with `flatFeeMad` from `GET /api/v1/waste-types`)
2. Select or create address (map pin preview via Leaflet)
3. Pick date + time window
4. Review fee → submit `POST /api/v1/pickups`
5. Success → pickup detail with status timeline

### Dispatcher assign

1. Table of `REQUESTED` / `CONFIRMED` pickups
2. Select collector dropdown (`GET /api/v1/collectors`)
3. `PATCH /api/v1/pickups/:id/assign`
4. Optional: add to route (`POST /api/v1/routes`)

### Collector mobile flow

1. Today's route list ordered by `pickupOrder`
2. Per pickup: buttons En route → Arrived → Complete (weight input)
3. Map tab with Leaflet markers

---

## Components (shadcn-based)

| Component | Path | Usage |
|-----------|------|-------|
| `PickupStatusBadge` | `components/pickup/status-badge.tsx` | Color per `PickupStatus` |
| `PickupTimeline` | `components/pickup/timeline.tsx` | Status history |
| `AddressForm` | `components/address/form.tsx` | Geocode button |
| `MapPicker` | `components/map/map-picker.tsx` | Leaflet select lat/lng |
| `CollectorSelect` | `components/admin/collector-select.tsx` | Dispatcher |
| `StatCard` | `components/admin/stat-card.tsx` | Dashboard KPIs |

---

## Data fetching

| Pattern | Use |
|---------|-----|
| Server Component + direct service | Admin stats on first paint |
| Client `fetch('/api/v1/...')` | Interactive tables, mutations |
| `useSession()` from Auth.js | Client role checks (UI only — server enforces) |

**Never** expose `DATABASE_URL` or service role keys to client.

---

## Forms & validation

- Share Zod schemas with backend (`@/lib/validators`)
- Show field errors in FR/AR via `next-intl`
- Morocco phone mask: `+212 6XX XXX XXX`

---

## Styling conventions

- Primary brand: green `#16a34a` (tailwind `green-600`)
- Accent: sand `#d97706` for Morocco warmth
- Radius: `rounded-lg` default
- Cards: shadcn `Card` for dashboards

See `ui-ux-designer.md` for full design tokens.

---

## RTL (Arabic)

- `dir="rtl"` when `locale === 'ar'`
- Use logical properties: `ms-`, `me-`, `ps-`, `pe-` (Tailwind v4)
- Mirror icons for arrows/chevrons in nav

---

## Error & loading UX

- Skeleton loaders on tables
- Toast (sonner) on mutation success/failure
- 403 page: friendly “no access” with link home

---

## Frontend checklist

- [ ] All pages under `[locale]`
- [ ] Role middleware matches `security-engineer.md`
- [ ] Pickup status colors consistent with `PickupStatusBadge` map
- [ ] API types match `api-contracts.md` responses
