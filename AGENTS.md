# AGENTS.md — ResourceHub

Stack: **Next.js 16** App Router, **React 19**, **TypeScript 5**, **Tailwind 4**, **shadcn/ui** (`@base-ui/react`), **SQLite** (better-sqlite3) + **Drizzle ORM**, **zustand**, **zod 4**, **motion** (prev framer-motion), **Geist** font.

## Commands

```bash
npm run seed        # Reset DB → run migrations → seed demo (admin@example.com / password)
npm run lint        # eslint . (Next 16 removed next lint)
npm run typecheck   # tsc --noEmit
npm run dev         # next dev (Turbopack)
npm run build       # next build
npm run db:generate # drizzle-kit generate
npm run db:migrate  # node scripts/migrate.mjs
npm run db:push     # drizzle-kit push (skip migration files)
```

CI gate: `npm run lint && npm run typecheck`. No tests — Playwright devDependency only, no config/specs yet.

## Auth & Proxy

Proxy (`proxy.ts`) checks only cookie **presence** (`rh_session`) — edge has no FS. Route handlers must still call `requireUser()` (page → redirect) or `requireApiUser()` (API → 401 JSON) for real verification.

**Gotcha**: `requireApiUser()` returns `User | NextResponse`. Callers MUST check:
```ts
const user = await requireApiUser();
if (user instanceof NextResponse) return user;
```

**CSRF**: Every mutating route (POST/PATCH/DELETE) must call `requireCsrf(req)` which returns `NextResponse | null` — return it if non-null. Double-submit cookie (`rh_csrf`) validated against `x-csrf-token` header. Client-side helper in `app/api-client.ts` auto-attaches the header.

**Public routes**: Update `PUBLIC_PAGE_PREFIXES` or `PUBLIC_API_PREFIXES` in `proxy.ts`.

## DB Layer

All route handlers use `readTable(name)` / `writeTable(name, data)` — backward-compat wrappers over Drizzle. `writeTable` does **delete-all + re-insert** (batched at 50 for assets, transactions, audit_logs). Not transactional across tables.

IDs via `newId("prefix")` — returns `prefix_timestamp+random`. Timestamps via `nowIso()`.

**Seed** (`scripts/seed.js`) uses raw better-sqlite3 (not Drizzle) — runs migration SQL then inserts demo data. DB at `data/resource-hub.db` (gitignored). Password hashing: Node `crypto.scryptSync` (N=16384, r=8, p=1, keylen=64).

**Auth sessions**: Custom (scrypt password hash + cookie token in `lib/auth.ts`). 8hr TTL. In-memory login rate limit (5 attempts/min per IP — resets on server restart).

## Key Patterns

- **Lookup-table CRUD** (`lib/crud.ts`): Categories, departments, locations, licenses routes are 4–10 line configs calling `createCollectionRoute()` / `createDetailRoute()`. Don't hand-write these.
- **Request transitions** (`lib/request-transitions.ts`): All request action routes delegate to `handleRequestTransition()` with a config object. Don't write per-action logic.
- **Validation** (`lib/validate.ts`): Zod schemas + `validate(schema, data)` helper returning `{ ok, data/error }`.
- **Audit** (`lib/audit.ts`): `writeAudit()` auto-redacts `password_hash` and `password_salt` from before/after diffs.
- **Notifications** (`lib/notifications.ts`): `createNotification()` writes to `notifications` table.

## Route Groups

- `app/(dashboard)/` — authenticated shell (sidebar + topbar). Layout calls `requireUser()`.
- `app/` — public routes (`/login`, `/`, `/reset-password`). Root page (`/`) checks auth → redirects to `/dashboard` or `/login`.
- `app/api/` — Route Handlers with `requireApiUser()` / `can(role, action)` / `writeAudit()` / `validateBody()`.

