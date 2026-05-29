# Localization Guide

## Supported locales (v1)

| Code | Language | Direction | Priority |
|------|----------|-----------|----------|
| `fr` | French | LTR | Default |
| `ar` | Modern Standard Arabic | RTL | Required |
| `en` | English | LTR | Secondary |

**Darija:** not a separate locale in v1. Optional informal strings in `messages/fr.json` under `informal.*` or marketing copy only. Full Darija UI → v2 community translation effort.

---

## Implementation

- Library: **`next-intl`**
- Routing: `src/app/[locale]/...` with `locales = ['fr', 'ar', 'en']`
- Default: `fr`
- Middleware: `localeDetection` from `Accept-Language` + cookie `NEXT_LOCALE`

```
messages/
├── fr.json
├── ar.json
└── en.json
```

---

## Translation keys structure

```json
{
  "common": { "save": "...", "cancel": "..." },
  "auth": { "login": "...", "register": "..." },
  "pickup": {
    "status": {
      "REQUESTED": "...",
      "CONFIRMED": "..."
    }
  },
  "waste": {
    "plastic": "...",
    "paper": "..."
  }
}
```

**Waste type names:** DB stores `nameKey` (e.g. `waste.plastic`); UI uses `t(wasteType.nameKey)`.

---

## User locale preference

- `User.locale` enum matches `Locale` in Prisma
- On login, redirect to `/[user.locale]/...`
- `PATCH /api/v1/me` can update locale

---

## RTL guidelines (`ar`)

| Element | Rule |
|---------|------|
| `<html dir>` | `rtl` for `ar`, `ltr` otherwise |
| Layout | Tailwind logical properties (`ms-`, `pe-`) |
| Icons | Mirror directional icons (chevrons, arrows) |
| Numbers | Western digits `0-9` acceptable in Morocco UX |
| Dates | `Intl.DateTimeFormat('ar-MA', { timeZone: 'Africa/Casablanca' })` |

---

## Formats

| Type | Convention |
|------|------------|
| Currency | `50,00 MAD` (fr) / `50.00 د.م.` (ar) |
| Phone | `+212 6XX XXX XXX` |
| Time windows | 24h `09:00 – 12:00` |

---

## Email templates

Separate minimal HTML per locale (`fr`, `ar`, `en`) in `src/server/notifications/templates/`.

---

## Legal content

Privacy policy and terms: provide FR + AR at minimum before production (EN optional).

---

## Translation workflow

1. Add key to `messages/fr.json` (source of truth)
2. Copy to `ar.json`, `en.json`
3. PR checklist: no missing keys (`npm run i18n:check` script comparing fr keys)

---

## Checklist

- [ ] All user-facing strings via `t()`
- [ ] Pickup status enum labels translated
- [ ] RTL tested on dashboard + booking flow
- [ ] No hardcoded French in components
