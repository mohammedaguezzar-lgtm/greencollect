# Prisma Schema Guide (Canonical)

**Database:** PostgreSQL 16  
**ORM:** Prisma 6  
**Primary keys:** UUID (`@default(uuid())`)  
**Timestamps:** `createdAt`, `updatedAt` on all mutable entities (`@updatedAt`)

---

## Canonical enums

Copy these **exactly** into `schema.prisma`, API docs, and frontend types.

```prisma
enum UserRole {
  USER
  COLLECTOR
  DISPATCHER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

enum PickupStatus {
  REQUESTED
  CONFIRMED
  ASSIGNED
  EN_ROUTE
  ARRIVED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum PaymentStatus {
  PENDING
  PAID
  WAIVED
  REFUNDED
  FAILED
}

enum PaymentProvider {
  CASH
  CMI
  STRIPE
  MANUAL
}

enum WasteTypeCode {
  PLASTIC
  PAPER
  METAL
  GLASS
  ELECTRONIC
  MIXED
}

enum RouteStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
}

enum NotificationChannel {
  EMAIL
  SMS
  PUSH
}

enum Locale {
  ar
  fr
  en
}
```

---

## Entity relationship overview

```
Organization 1──* User
User 1──* Address
User 1──* Pickup (as customer)
User 1──* Pickup (as assignedCollector)
User 1──* Route (as collector)
WasteType 1──* Pickup
Address 1──* Pickup
Pickup 1──* PickupStatusHistory
Pickup 1──* Payment
Route 1──* Pickup (optional routeId)
```

---

## Full schema (implement verbatim)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth.js models ─────────────────────────────────────────
model User {
  id            String     @id @default(uuid())
  email         String     @unique
  emailVerified DateTime?
  phone         String?    @unique
  name          String?
  passwordHash  String?    // bcrypt; null if OAuth-only
  image         String?
  role          UserRole   @default(USER)
  status        UserStatus @default(PENDING_VERIFICATION)
  locale        Locale     @default(fr)
  organizationId String?
  organization  Organization? @relation(fields: [organizationId], references: [id])
  addresses     Address[]
  pickupsAsCustomer Pickup[] @relation("CustomerPickups")
  pickupsAsCollector Pickup[] @relation("CollectorPickups")
  routes        Route[]
  accounts      Account[]
  sessions      Session[]
  notifications Notification[]
  auditLogs     AuditLog[] @relation("ActorAuditLogs")
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([role])
  @@index([organizationId])
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── B2B ────────────────────────────────────────────────────
model Organization {
  id           String   @id @default(uuid())
  name         String
  taxId        String?
  billingEmail String?
  users        User[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// ─── Addresses ──────────────────────────────────────────────
model Address {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label      String?  // "Home", "Office"
  line1      String
  line2      String?
  district   String?
  city       String   // must match SERVICE_CITY for MVP validation
  postalCode String?
  latitude   Decimal  @db.Decimal(9, 6)
  longitude  Decimal  @db.Decimal(9, 6)
  isDefault  Boolean  @default(false)
  pickups    Pickup[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
  @@index([city])
}

// ─── Catalog ──────────────────────────────────────────────────
model WasteType {
  id              String        @id @default(uuid())
  code            WasteTypeCode @unique
  nameKey         String        // i18n key e.g. "waste.plastic"
  descriptionKey  String?
  flatFeeMad      Decimal       @db.Decimal(10, 2) // MVP per-pickup fee
  pricePerKgMad   Decimal?      @db.Decimal(10, 2) // v2
  active          Boolean       @default(true)
  pickups         Pickup[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

// ─── Pickups ──────────────────────────────────────────────────
model Pickup {
  id                  String        @id @default(uuid())
  customerId          String
  customer            User          @relation("CustomerPickups", fields: [customerId], references: [id])
  addressId           String
  address             Address       @relation(fields: [addressId], references: [id])
  wasteTypeId         String
  wasteType           WasteType     @relation(fields: [wasteTypeId], references: [id])
  status              PickupStatus  @default(REQUESTED)
  scheduledDate       DateTime      @db.Date
  timeWindowStart     String        // "09:00" local Morocco
  timeWindowEnd       String        // "12:00"
  estimatedWeightKg   Decimal?      @db.Decimal(8, 2)
  actualWeightKg      Decimal?      @db.Decimal(8, 2)
  notes               String?       @db.Text
  proofPhotoUrl       String?
  feeAmountMad        Decimal       @db.Decimal(10, 2)
  paymentStatus       PaymentStatus @default(PENDING)
  assignedCollectorId String?
  assignedCollector   User?         @relation("CollectorPickups", fields: [assignedCollectorId], references: [id])
  routeId             String?
  route               Route?        @relation(fields: [routeId], references: [id])
  cancelledAt         DateTime?
  cancellationReason  String?
  statusHistory       PickupStatusHistory[]
  payments            Payment[]
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([customerId])
  @@index([assignedCollectorId])
  @@index([status])
  @@index([scheduledDate])
  @@index([routeId])
}

model PickupStatusHistory {
  id         String       @id @default(uuid())
  pickupId   String
  pickup     Pickup       @relation(fields: [pickupId], references: [id], onDelete: Cascade)
  fromStatus PickupStatus?
  toStatus   PickupStatus
  actorId    String?
  actor      User?        @relation(fields: [actorId], references: [id])
  note       String?
  createdAt  DateTime     @default(now())

  @@index([pickupId])
}

// ─── Routes ───────────────────────────────────────────────────
model Route {
  id          String      @id @default(uuid())
  collectorId String
  collector   User        @relation(fields: [collectorId], references: [id])
  date        DateTime    @db.Date
  status      RouteStatus @default(PLANNED)
  pickupOrder Json        // string[] of pickup UUIDs in visit order
  pickups     Pickup[]
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([collectorId, date])
  @@index([date])
}

// ─── Payments ─────────────────────────────────────────────────
model Payment {
  id         String          @id @default(uuid())
  pickupId   String
  pickup     Pickup          @relation(fields: [pickupId], references: [id])
  amountMad  Decimal         @db.Decimal(10, 2)
  provider   PaymentProvider
  status     PaymentStatus   @default(PENDING)
  externalId String?
  metadata   Json?
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt

  @@index([pickupId])
}

// ─── Notifications ────────────────────────────────────────────
model Notification {
  id        String              @id @default(uuid())
  userId    String
  user      User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel   NotificationChannel @default(EMAIL)
  type      String              // PICKUP_CONFIRMED, PICKUP_COMPLETED, etc.
  title     String
  body      String              @db.Text
  readAt    DateTime?
  sentAt    DateTime?
  createdAt DateTime            @default(now())

  @@index([userId])
}

// ─── Audit ────────────────────────────────────────────────────
model AuditLog {
  id         String   @id @default(uuid())
  actorId    String?
  actor      User?    @relation("ActorAuditLogs", fields: [actorId], references: [id])
  action     String   // e.g. USER_SUSPENDED, PICKUP_ASSIGNED
  entityType String
  entityId   String
  metadata   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([actorId])
}
```

**Note:** Add `actor` relation on `PickupStatusHistory` only if `User` model includes reverse relation; otherwise use `actorId` without relation for simpler MVP.

---

## Seed data requirements (`prisma/seed.ts`)

| Entity | Records |
|--------|---------|
| `WasteType` | All 6 `WasteTypeCode` values with `flatFeeMad` (e.g. 30–80 MAD) |
| `User` | 1 ADMIN, 1 DISPATCHER, 2 COLLECTOR, 3 USER (password: from `SEED_PASSWORD` env) |
| `Organization` | 1 demo B2B org with 1 USER |
| `Address` | 2 per USER in Casablanca with real-ish coordinates |
| `Pickup` | 5 sample pickups in various statuses |

---

## Business rules (DB-level + app-level)

1. Only one `isDefault` address per user — enforce in service layer transaction.
2. `Address.city` must equal `process.env.SERVICE_CITY` (default `Casablanca`) in MVP.
3. `feeAmountMad` copied from `WasteType.flatFeeMad` at pickup creation (immutable unless ADMIN overrides).
4. `Pickup.assignedCollectorId` must reference user with `role = COLLECTOR`.
5. Soft-delete not used in v1 — use `CANCELLED` / `SUSPENDED` statuses.

---

## Migration policy

- One migration per logical feature branch.
- Never edit applied migrations; add new migration to fix.
- Run `prisma migrate deploy` in CI/CD before app start.

See `database-engineer.md` for indexes and query patterns.
