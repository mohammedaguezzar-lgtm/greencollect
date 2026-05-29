# Coding Standards

## Language & tooling

| Tool | Config |
|------|--------|
| TypeScript | `"strict": true` in `tsconfig.json` |
| ESLint | `eslint-config-next` + `@typescript-eslint` |
| Prettier | single quotes, semi, printWidth 100 |
| Package manager | npm (lockfile committed) |

---

## Naming conventions

| Item | Convention | Example |
|------|------------|---------|
| Files (components) | kebab-case | `pickup-status-badge.tsx` |
| Files (services) | kebab-case | `pickup/service.ts` |
| React components | PascalCase | `PickupStatusBadge` |
| Functions | camelCase | `createPickup` |
| Constants | UPPER_SNAKE | `SERVICE_CITY` |
| Prisma models | PascalCase | `Pickup` |
| DB columns | camelCase in Prisma | `scheduledDate` |
| API routes | kebab-case folders | `waste-types/route.ts` |
| Enums | PascalCase type, UPPER values | `PickupStatus.REQUESTED` |

---

## Project rules

1. **No `any`** — use `unknown` + narrow or Zod infer
2. **No default exports** except Next.js `page.tsx` / `layout.tsx` / `route.ts`
3. **Imports** — use `@/` alias for `src/`
4. **Env access** — only in server files; `process.env.X` never in client except `NEXT_PUBLIC_*`

---

## React / Next.js

- Prefer Server Components; add `'use client'` only when needed (hooks, Leaflet, forms)
- Colocate component tests as `*.test.tsx` next to file or in `__tests__`
- Do not fetch in `useEffect` if Server Component can load data

---

## API & services

- Return typed DTOs from services, not raw Prisma objects with passwords
- Use `jsonError` / `jsonSuccess` helpers for consistent API shape
- Log errors with `requestId`; never log passwords or tokens

---

## Prisma

- One migration per feature
- Use transactions for multi-step writes
- Select only needed fields: `select: { id: true, ... }` on large tables

---

## Git conventions

| Type | Prefix |
|------|--------|
| Feature | `feat:` |
| Fix | `fix:` |
| Chore | `chore:` |
| Docs | `docs:` |

Example: `feat(pickups): add status transition endpoint`

---

## PR checklist

- [ ] `npm run lint && npm run typecheck && npm run test`
- [ ] No secrets in diff
- [ ] i18n keys added for new UI strings (all 3 locales)
- [ ] API change reflected in `api-contracts.md` if contract changed

---

## File size

- Keep files under ~300 lines; split services if larger
- One component per file unless tightly coupled subcomponents
