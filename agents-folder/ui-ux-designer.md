# UI/UX Designer Agent

## Design principles

1. **Mobile-first** — collectors and residents primarily use phones
2. **Morocco context** — French default, Arabic RTL, MAD pricing, Casablanca-first
3. **Clarity over density** — large touch targets (min 44px), simple status language
4. **Trust** — show fee before confirm; show pickup status timeline

---

## Design tokens

| Token | Value |
|-------|-------|
| Primary | `#16a34a` (green-600) |
| Primary hover | `#15803d` |
| Secondary | `#0f766e` (teal-700) |
| Accent | `#d97706` (amber-600) |
| Background | `#fafafa` |
| Surface | `#ffffff` |
| Text | `#171717` |
| Muted text | `#737373` |
| Error | `#dc2626` |
| Font | `Inter` (Latin), `Noto Sans Arabic` for `ar` |
| Radius | `8px` (`rounded-lg`) |
| Shadow | `shadow-sm` cards |

---

## Pickup status colors

| Status | Color | Icon |
|--------|-------|------|
| REQUESTED | gray-500 | clock |
| CONFIRMED | blue-500 | check |
| ASSIGNED | indigo-500 | user |
| EN_ROUTE | amber-500 | truck |
| ARRIVED | orange-500 | map-pin |
| COMPLETED | green-600 | check-circle |
| CANCELLED | red-400 | x |
| NO_SHOW | red-600 | alert |

---

## Screen inventory

### Public

| Screen | Key elements |
|--------|--------------|
| **Landing** | Hero ("Recycle smarter in Casablanca"), how it works (3 steps), waste types, CTA register, language switcher |
| **Login** | Email/password, forgot password link (v1.1) |
| **Register** | Name, email, phone, password, consent checkbox, locale select |

### Customer (`USER`)

| Screen | Key elements |
|--------|--------------|
| **Dashboard** | Upcoming pickup card, quick "Book pickup", impact stats (kg, CO₂) |
| **Book pickup** | 3-step wizard with progress bar |
| **My pickups** | Filter tabs: Upcoming / Past |
| **Pickup detail** | Timeline, map pin, fee, pay button (if pending) |
| **Addresses** | List + add/edit with map |

### Collector

| Screen | Key elements |
|--------|--------------|
| **Dashboard** | Today's count, start route CTA |
| **Route** | Ordered cards, swipe or tap for status actions |
| **Pickup action** | Large buttons: En route → Arrived → Complete + weight field |

### Dispatcher

| Screen | Key elements |
|--------|--------------|
| **Dashboard** | Pending count, map overview |
| **Pickup queue** | Table: customer, waste, window, assign dropdown |
| **Route builder** | Select collector + date + drag order |

### Admin

| Screen | Key elements |
|--------|--------------|
| **Dashboard** | KPI cards, charts |
| **Users** | CRUD table, role badges |
| **Waste types** | Edit fees |
| **Analytics** | Date range picker, charts |

---

## Booking wizard UX

```
Step 1: Waste type     →  Step 2: Address/Map  →  Step 3: Schedule  →  Review & Pay
         [cards]              [map picker]            [date + slot]        [fee TTC]
```

- Persistent footer: Back / Continue
- Review shows: address line, date window, `flatFeeMad` TTC
- Submit loading state + success confetti (subtle)

---

## Accessibility

- WCAG 2.1 AA contrast on buttons
- Focus rings visible
- `aria-label` on icon-only collector buttons
- Form errors linked with `aria-describedby`
- RTL layout tested for Arabic

---

## Empty & error states

| State | Copy direction (FR example) |
|-------|----------------------------|
| No pickups | "Vous n'avez pas encore demandé de collecte." + CTA |
| No collectors available | "Aucun collecteur disponible — réessayez demain." |
| Geocode failed | "Placez le repère sur la carte manuellement." |
| Network error | "Connexion interrompue. Réessayez." |

---

## Logo & brand (placeholder)

- Wordmark: **GreenCollect** with leaf icon
- Favicon: green circle + recycle symbol

Assets path: `public/brand/` (to be added in implementation)

---

## UX checklist

- [ ] Fee visible before confirm
- [ ] Status timeline on pickup detail
- [ ] Collector actions usable one-handed
- [ ] Arabic RTL layout approved
- [ ] OSM attribution on all maps
