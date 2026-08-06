# Security Audit — ResourceHub (2026-07-28)

Manual source audit for backdoors / malicious code + auth surface review.
`/security-review` skill unavailable (no remote origin).

## Verdict

**No backdoor found.** No `eval`, `Function()`, `child_process`, reverse shell,
hidden C2, obfuscated payload, or supply-chain plant in app source
(`app/`, `lib/`, `components/`, `scripts/`).

`scripts/seed.js` is a local demo seeder only (writes `data/*.json`). Not a
network listener. Demo password is the literal string `password` for all seed
users — expected for local MVP, change before any shared deploy.

## Critical findings (fixed this session)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Reset token returned in JSON as `_debug_token` — anyone who can hit forgot-password for a known email gets a usable reset token | `app/api/auth/forgot-password/route.ts` | Token no longer returned. Dev-only `console.info` log. |
| 2 | `/api/meta` shipped full `User` rows including `password_hash` + `password_salt` | `app/api/meta/route.ts` | Credential fields stripped before JSON. |
| 3 | Logout only deleted cookie; session row stayed valid in `data/sessions.json` | `app/logout/route.ts` | Calls `destroySession(token)` + `clearSessionCookie()`. |
| 4 | Password compare used `===` (timing-leaky) | `lib/password.ts` | `crypto.timingSafeEqual`. |
| 5 | `.gitignore` only had `node_modules` — `data/` (hashes, live sessions) and `.next/` could be committed | `.gitignore` | Expanded: `data/`, `.next/`, `.env*`, build artifacts. |

## Medium / residual risks (not fixed — product debt)

| # | Issue | Notes |
|---|-------|-------|
| A | `requireUser()` redirects HTML on API 401 | API clients get HTML login page. `requireApiUser()` added; migrate routes gradually. |
| B | Any authenticated user can `GET /api/requests` (all requests) and `GET /api/requests/:id` | No ownership / role filter. IDOR-ish for employees. |
| C | `GET /api/assets` + detail: any logged-in role reads all assets | Acceptable for IT inventory? Tighten if multi-tenant. |
| D | In-memory login rate limit | Resets on process restart; not shared across instances. |
| E | Seed passwords = `password` | Demo only. Re-seed / force change before prod. |
| F | JSON-file DB world-readable on host FS | Single-server MVP assumption. Real DB when multi-process. |
| G | No CSRF token on cookie-auth mutating routes | Mitigated by `SameSite=strict` cookie. Add CSRF if you ever loosen SameSite. |
| H | Users page calls `/api/users/:id` | Route may be missing — UI dead end, not a backdoor. |

## What was checked

- `lib/auth.ts`, `lib/password.ts`, `lib/db.ts`, `lib/permissions.ts`, `lib/crud.ts`, `lib/request-transitions.ts`, `lib/audit.ts`
- All `app/api/**/route.ts`
- `scripts/seed.js`
- `next.config.ts` (no remote redirects / dangerous rewrites)
- Grep for `eval`, `child_process`, `Function(`, base64 decode, outbound `fetch` to unknown hosts, hardcoded secrets

## Shadcn UI status

Already initialized (`components.json`, CSS variables, `cn()` helper).
Primitives present under `components/ui/`:

`avatar`, `badge`, `button`, `card`, `confirm-dialog`, `dialog`,
`dropdown-menu`, `input`, `label`, `select`, `separator`, `sheet`,
`skeleton`, `table`, `tabs`, `textarea`, `toast`.

Customize dashboard look via CSS vars in `app/globals.css` (`:root`) and/or
`npx shadcn@latest add <component>`.
