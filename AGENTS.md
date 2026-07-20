<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Daily Line

A routine-tracking SaaS: sign up, build weekly routines out of categorized time
blocks, and see exactly what you should be doing **right now**. Dark-first
Material Design 3 Expressive UI, accessibility-first.

Production: https://dailyline.spacend-digital.workers.dev 

## Stack

- **Next.js 16** (App Router, Server Components + Server Actions) on
  **Cloudflare Workers** via `@opennextjs/cloudflare`
- **Cloudflare D1** (SQLite) via **Kysely** (`kysely-d1`)
- **better-auth** (email + password) — session cookie gate in
  `src/middleware.ts` (edge middleware; OpenNext does not support Next 16's
  Node-runtime `proxy.ts` — must keep as `middleware.ts`)
- Hand-rolled **M3 Expressive** design system in `src/app/globals.css`
  (tokens: color roles, type/shape/motion, state layers; components as BEM-ish
  classes + thin React wrappers in `src/components/m3/`)

## Commands

| Task | Command |
| --- | --- |
| Dev (Node, bindings via miniflare) | `npm run dev` |
| Preview in Workers runtime | `npm run preview` |
| Deploy to Cloudflare | `npm run deploy` |
| Migrations (local / remote) | `npm run db:migrate:local` / `db:migrate:remote` |
| Typecheck | `npx tsc --noEmit` |

## Layout

- `src/app/(main)/` — authed shell: `page.tsx` (Now), `week/`, `edit/`
- `src/app/(auth)/` — `login/`, `signup/`
- `src/middleware.ts` — auth gate (checks session cookie, redirects to login)
- `src/app/api/auth/[...all]/route.ts` — better-auth handler
- `src/lib/` — `db.ts` (Kysely + D1 + queries), `auth.ts` (better-auth
  factory + starter-routine seed), `actions.ts` (all server actions),
  `schedule.ts` (routine engine: instances, now-state), `starter-routine.ts`
  (the original hard-coded routine, seeded on signup)
- `migrations/` — D1 SQL migrations (applied with wrangler, never edited
  after being applied remotely)

## Conventions

- **Time model**: blocks store `start_min`/`end_min` = minutes from midnight;
  `end_min` may exceed 1440 (past-midnight). All "what's now" math happens
  client-side (`NowView`/`WeekView`) because Workers run in UTC.
- **Mutations**: server actions in `src/lib/actions.ts`; they always
  `requireUser()` + scope queries to that user / their active routine, then
  `revalidatePath("/", "/week", "/edit")`.
- **D1 gotcha**: max 100 bound params/statement — use `chunkedInsert()`
  from `db.ts` for multi-row inserts.
- **A11y is a feature**: 48px targets, `:focus-visible` rings, aria-live for
  block changes, `prefers-reduced-motion` / `prefers-contrast` /
  `forced-colors` support, user display prefs (theme/text size/contrast/motion)
  stored in `localStorage["dl-display"]` and applied via `data-*` on `<html>`.
- IDs: `crypto.randomUUID()`. Money-style numbers use `tabular-nums`.

## Secrets

- `BETTER_AUTH_SECRET` — set via `wrangler secret put` (prod) and `.dev.vars`
  (local; gitignored).
