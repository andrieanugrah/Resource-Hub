# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

**ResourceHub** — web IT asset management. Tracks laptops, desktops, monitors, printers, servers, switches, routers, APs, peripherals, software licenses from purchase to disposal. Replaces spreadsheets with role-based, auditable, searchable, reportable system. Desktop-first, tablet-responsive.

## Stack

**Next.js 16** App Router, **React 19**, **TypeScript 5**, **Tailwind 4**, **shadcn/ui** (`@base-ui/react`, `clsx`, `class-variance-authority`, `tailwind-merge`), **SQLite** (better-sqlite3) + **Drizzle ORM**, **zustand**, **zod 4**, **motion** (prev framer-motion), **Geist** font via `next/font/google`, **lucide-react** icons, **qrcode**.

DB at `data/resource-hub.db` (gitignored). Drizzle schema in `drizzle/schema.ts`, instantiated in `drizzle/db.ts`. WAL mode + foreign keys on.

## Build / Lint / Test

```bash
npm install           # install
npm run dev           # next dev (Turbopack)
npm run build         # next build
npm run start         # next start
npm run lint          # eslint .
npm run typecheck     # tsc --noEmit
npm run test          # vitest run (tests/**/*.test.ts)
npm run test:watch    # vitest
npm run seed          # node scripts/seed.js  (reset DB, migrate, seed demo)
npm run db:generate   # drizzle-kit generate --config drizzle.config.ts
npm run db:migrate    # node scripts/migrate.mjs
npm run db:push       # drizzle-kit push (skip migration files)
```

CI gate: `npm run lint && npm run typecheck && npm run test`.

Demo login: `admin@example.com` / `password`.

## Architecture

### Layering

- `app/` — routes. App Router with route groups: `(dashboard)` = authenticated shell (sidebar + topbar), bare routes = public (`/login`, `/`).
- `app/api/` — Route Handlers. Server-side only. Each handler calls `requireUser()` (page → redirect) or `requireApiUser()` (API → 401 JSON) from `lib/auth.ts`, re-checks via `can(role, action)` from `lib/permissions.ts`, mutates via `lib/db.ts`, calls `writeAudit()` from `lib/audit.ts`.
- `lib/` — server-only modules: `db.ts` (types + read/write wrappers), `auth.ts` (session, CSRF, RBAC re-export), `audit.ts`, `permissions.ts` (RBAC matrix), `password.ts` (scrypt), `format.ts` (id-ID locale), `utils.ts` (cn helper), `validate.ts` (zod schemas), `crud.ts` (lookup-table factory), `request-transitions.ts` (state machine engine), `notifications.ts`, `depreciation.ts`.
- `drizzle/` — `schema.ts` (Drizzle table defs), `db.ts` (better-sqlite3 + Drizzle init), `migrations/`.
- `components/` — UI. `ui/` = shadcn primitives; top-level = domain components.
- `stores/` — client state (zustand). Currently `split-view-store.ts`.

### Route Groups

- `app/(dashboard)/` — authenticated shell. Layout calls `requireUser()`.
- `app/` — public routes (`/login`, `/`, `/reset-password`). Root checks auth → redirects to `/dashboard` or `/login`.
- `app/api/` — Route Handlers. `requireApiUser()` + `can(role, action)` + `writeAudit()` + `validateBody()`.

### Proxy (`proxy.ts`)

Proxy checks cookie **presence** (`rh_session`) — edge has no FS. Route handlers must still call `requireUser()` / `requireApiUser()` for real verification. Also sets `rh_csrf` cookie if missing.

**Public routes**: Add to `PUBLIC_PAGE_PREFIXES` or `PUBLIC_API_PREFIXES` in `proxy.ts`.

### Auth & CSRF

Custom session auth (scrypt password hash + cookie token). 8hr TTL. In-memory login rate limit (5 attempts/min per IP, resets on server restart).

`requireApiUser()` returns `User | NextResponse`. Callers MUST check:
```ts
const user = await requireApiUser();
if (user instanceof NextResponse) return user;
```

**CSRF**: Every mutating route (POST/PATCH/DELETE) must call `requireCsrf(req)` — returns `NextResponse | null`, return it if non-null. Double-submit cookie (`rh_csrf`) validated against `x-csrf-token` header. Client-side helper in `app/api-client.ts` auto-attaches the header.

### DB Layer (`lib/db.ts`)

All route handlers use `readTable(name)` / `writeTable(name, data)` — wrappers over Drizzle. `writeTable` diffs by PK: inserts new, updates existing, deletes missing. Batched at 50/100. Must be called inside a transaction.

IDs via `newId("prefix")` — returns `prefix_timestamp+random`. Timestamps via `nowIso()`.

### Key Abstractions

**Lookup-table CRUD** (`lib/crud.ts`): `createCollectionRoute()` generates GET+POST, `createDetailRoute()` generates GET/PATCH/DELETE for categories/departments/locations/licenses. Pass a `CrudConfig` (table name, ID prefix, required fields, duplicate-check fields, patch fields, asset ref field for delete guard). Don't hand-write lookup-table routes.

**Request transition engine** (`lib/request-transitions.ts`): `handleRequestTransition()` is a generic state-machine executor. Each request action route (approve, reject, submit, cancel, mark_in_progress, mark_completed) delegates to it with a `RequestTransition` config: `fromStatus`, `toStatus`, optional `permission`, optional `validate`, optional `mutate`, `actionType`. Handles RBAC check, status-guard (409 on illegal transition), audit logging, cache revalidation, and notifications — all in one call. Don't write per-action logic.

**Validation** (`lib/validate.ts`): Zod schemas per entity + `validate(schema, data)` helper returning `{ ok, data/error }`.

**Audit** (`lib/audit.ts`): `writeAudit()` appends immutable entry to `audit_logs`. Structured via `before`/`after` JSON diff. Auto-redacts `password_hash` and `password_salt`.

**Notifications** (`lib/notifications.ts`): `createNotification()` writes to `notifications` table. Type: `"request" | "maintenance" | "asset" | "system"`. Each has `link` for in-app navigation and `read` boolean.

**Depreciation** (`lib/db.ts`): `computeDepreciation(asset, asOf?)` — straight-line. Returns annual, accumulated, current_value, percent_depreciated.

### RBAC

Four roles: `super_admin`, `admin_it`, `manager`, `employee`. Matrix in `lib/permissions.ts` — `can(role, action)` returns boolean. Server enforces on every protected action; UI hides forbidden controls.

### Domain Modules (PRD §7)

1. **Auth** — login, logout, forgot/reset password, session expiry, hashed passwords, token invalidation on logout.
2. **RBAC** — matrix enforced server-side. Employee cannot self-approve.
3. **Dashboard** — widget tiles (totals by status, pending approvals, warranty/maintenance due, recent activity). Cards link to filtered lists.
4. **Asset CRUD** — strict enums: status (`available|assigned|reserved|in_repair|retired|lost|disposed`), condition (`new|good|fair|damaged|critical`). Soft delete (`deleted_at`). Detail page shows metadata + owner + QR + assignment history + maintenance + requests + timeline.
5. **Category / Location / Department / License** — lookup tables via `crud.ts` factory. Block delete if referenced.
6. **Assignment** — one active assignment per asset. Assign auto-sets status `assigned`; return closes it. Can assign to department without user.
7. **Check-in / Check-out** — transactional flow with condition_before/after, notes.
8. **Request** — types: `new_asset|replacement|temporary_loan|return|repair`. Draft → pending_approval → approved|rejected → in_progress → completed (or cancelled).
9. **Approval** — manager (or super_admin) decision with reason. Every decision logged.
10. **Maintenance** — `open → in_progress → waiting_vendor → resolved → closed`. Asset in maintenance not assignable unless overridden.
11. **QR / Barcode** — unique per asset, printable, scannable to detail page.
12. **Search / Filter / Pagination** — server-side pagination. Case-insensitive search across code/name/serial/user/dept/location.
13. **Reporting** — by status/category/location/department. Export CSV/XLSX.
14. **Notifications** — in-app. Read/unread per user. Triggers in PRD §7.16.
15. **Audit Trail** — immutable. Captures actor, action, entity, before/after JSON, ip, ua, timestamp.

### State Machines (enforce, don't improvise)

- **Asset**: `available ↔ assigned`, `assigned|available → in_repair`, `in_repair → available`, `available → retired`, `assigned → retired` only post-return or admin override, `available → lost`, `lost → disposed`.
- **Request**: `draft → pending_approval → approved|rejected`, `approved → in_progress → completed`, any active → `cancelled`.
- **Maintenance**: `open → in_progress → waiting_vendor → resolved → closed`.

Centralize transitions. Reject illegal with 409.

### Data Invariants

- `asset_transactions` append-only ledger. Source of truth for asset movement — never overwrite.
- `audit_logs` append-only. Never delete entries.
- One active assignment per asset: enforce 409 if `asset.status === "assigned"`.
- `assets.deleted_at` for soft delete; list queries filter it out, history joins keep it.
- `writeTable` runs inside a Drizzle transaction — all-or-nothing per table.
- `writeAudit` redacts `password_hash` and `password_salt` from before/after diffs — don't echo them yourself.

### API Shape

REST. Resource-oriented. Action endpoints under resource (`POST /assets/:id/assign`, `POST /requests/:id/approve`). Consistent error envelope. IDOR guarded on every detail endpoint.

## When Adding to This File

Update commands section when toolchain changes. Update data-model section only when PRD diverges from code (cite PRD section). Don't restate PRD content — cite the section (`PRD §X`) instead.
