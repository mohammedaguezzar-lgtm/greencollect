# Analytics & Reporting

## Principles

- Metrics derived from **completed pickups** and **paid payments** only unless noted
- All amounts in **MAD**
- Date filters use timezone `Africa/Casablanca`
- Read-only queries; no mutations in analytics module

---

## Core metrics (definitions)

| Metric | Formula | Source |
|--------|---------|--------|
| `pickupsRequested` | count status ≥ REQUESTED in range | `Pickup` |
| `pickupsCompleted` | count `status = COMPLETED` | `Pickup` |
| `completionRate` | completed / (completed + cancelled + no_show) | derived |
| `totalWeightKg` | sum `actualWeightKg` where completed | `Pickup` |
| `revenueMad` | sum `Payment.amountMad` where `status = PAID` | `Payment` |
| `averageOrderValueMad` | revenueMad / paid pickup count | derived |
| `co2SavedKg` | totalWeightKg × emission factor | see below |

### CO₂ estimation (transparent)

Use simple factors (document in UI as estimates):

| `WasteTypeCode` | kg CO₂ saved per kg waste |
|-----------------|---------------------------|
| PLASTIC | 2.0 |
| PAPER | 1.5 |
| METAL | 3.0 |
| GLASS | 0.8 |
| ELECTRONIC | 4.0 |
| MIXED | 1.8 |

```
co2SavedKg = Σ (actualWeightKg × factor[wasteType.code])
```

If `actualWeightKg` null, use `estimatedWeightKg` with badge "estimated" in UI.

---

## API: `GET /api/v1/admin/analytics`

**Roles:** `ADMIN`  
**Query:** `from=2026-05-01&to=2026-05-31&groupBy=day|week|wasteType`

**Response example:**

```json
{
  "data": {
    "summary": {
      "pickupsCompleted": 120,
      "totalWeightKg": 450.5,
      "revenueMad": 5400.00,
      "co2SavedKg": 720.3,
      "completionRate": 0.92
    },
    "series": [
      {
        "date": "2026-05-01",
        "pickupsCompleted": 5,
        "revenueMad": 225.00,
        "totalWeightKg": 18.2
      }
    ],
    "byWasteType": [
      { "code": "PLASTIC", "pickupsCompleted": 40, "totalWeightKg": 150 }
    ]
  }
}
```

---

## Dashboards by role

| Role | Dashboard widgets |
|------|-------------------|
| `USER` | My pickups count, kg recycled, CO₂ estimate (personal) |
| `COLLECTOR` | Today's stops, completed count |
| `DISPATCHER` | Pending queue, active collectors, today's completion rate |
| `ADMIN` | Full analytics + revenue chart + waste breakdown |

---

## Implementation

`src/server/analytics/service.ts`

| Function | Purpose |
|----------|---------|
| `getAdminSummary(from, to)` | Summary block |
| `getTimeSeries(from, to, groupBy)` | Chart data |
| `getByWasteType(from, to)` | Pie/bar chart |
| `getUserImpact(userId)` | Customer dashboard |

Use Prisma `aggregate` + `groupBy`; raw SQL only if performance requires.

---

## Caching (v1.1)

Pre-aggregate daily rows into `AnalyticsDaily` table via nightly job:

```prisma
model AnalyticsDaily {
  date             DateTime @db.Date
  pickupsCompleted Int
  totalWeightKg    Decimal
  revenueMad       Decimal
  co2SavedKg       Decimal
  @@id([date])
}
```

---

## Export (v1.1)

`GET /api/v1/admin/analytics/export?format=csv` — ADMIN only

---

## Privacy

- Admin analytics never expose individual PII in aggregate endpoints
- User dashboard shows only own data

---

## Checklist

- [ ] CO₂ labeled as estimate in UI
- [ ] Revenue uses `Payment` PAID rows
- [ ] Timezone Africa/Casablanca for "today" stats
