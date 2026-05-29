# Maps & Routing System

## Goals by phase

| Phase | Capability |
|-------|------------|
| **v1** | Display pickup pins; geocode addresses; manual route ordering |
| **v1.1** | Collector last-known location (manual refresh button) |
| **v2** | OSRM driving distances; automated route optimization |

---

## Map stack (v1)

| Layer | Technology |
|-------|------------|
| Tiles | OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) |
| Library | Leaflet 1.9 + `react-leaflet` |
| Default center | Casablanca `33.5731, -7.5898`, zoom 12 |
| Attribution | © OpenStreetMap contributors (required in UI) |

**Components:**

- `MapPicker` — customer selects/confirms pin (draggable marker)
- `PickupMap` — dispatcher/collector view of multiple markers
- `RouteMap` — polyline through ordered pickups (straight lines v1; OSRM geometry v2)

---

## Geocoding

**Provider:** Nominatim (self-hosted recommended at scale; public API for MVP with strict rate limits)

**Flow:**

1. User types address → debounce 500ms
2. Client calls `POST /api/v1/geo/geocode` (server proxy)
3. Server calls Nominatim with `countrycodes=ma` bias
4. Validate result inside Morocco bbox:
   - lat: 27.0 – 36.0
   - lng: -13.5 – -0.5
5. Return lat/lng + `displayName`

**Caching:** Redis key `geo:{hash(query)}` TTL 86400s

**Failure:** Show manual pin drop on map; user adjusts marker.

---

## Address storage

Persist on `Address` model:

- `latitude`, `longitude` — `Decimal(9,6)`
- Do not re-geocode on every page load unless user edits address

---

## Routing (v1 — manual)

`Route.pickupOrder` is JSON array of pickup UUIDs:

```json
["uuid-1", "uuid-2", "uuid-3"]
```

**Dispatcher UI:**

- Drag-and-drop reorder list
- `PATCH /api/v1/routes/:id` saves order

**Collector UI:**

- Ordered list + map markers numbered 1..n
- Straight-line polyline for visual only (not driving directions)

---

## Routing (v2 — optimized)

| Component | Tool |
|-----------|------|
| Distance matrix | OSRM `/table` (self-hosted Morocco extract) |
| Solver | OR-Tools VRP or simple nearest-neighbor heuristic |
| Constraints | Time windows, max stops per route, vehicle capacity (kg) |

**Job:** nightly + on-demand `POST /api/v1/routes/optimize` (ADMIN)

---

## Collector location (v1.1)

Optional fields on `Route` or new `CollectorLocation` model:

```prisma
model CollectorLocation {
  id          String   @id @default(uuid())
  collectorId String
  latitude    Decimal  @db.Decimal(9, 6)
  longitude   Decimal  @db.Decimal(9, 6)
  recordedAt  DateTime @default(now())
}
```

Collector app: "Update my location" button → `POST /api/v1/collectors/me/location`

Real-time WebSocket tracking deferred to v2.

---

## Performance & compliance

| Rule | Detail |
|------|--------|
| Nominatim usage | Max 1 req/s globally; identify via `User-Agent` |
| Tile CDN | Use OSM tiles directly in MVP; switch to MapTiler if volume high |
| Privacy | Do not log exact queries with user id in production logs |

---

## Map module files

```
src/components/map/
├── map-picker.tsx
├── pickup-map.tsx
└── route-map.tsx
src/server/geo/
├── nominatim.ts
├── bbox.ts
└── distance.ts    # haversine for v1 sorting hints
```

---

## Distance helper (v1)

Haversine km between two lat/lng pairs — used to **suggest** nearest pickup for dispatcher (UI hint only, not authoritative).

---

## Checklist

- [ ] OSM attribution visible
- [ ] Geocode only via server proxy
- [ ] Morocco bbox validation
- [ ] Route order persisted in `Route.pickupOrder`
