# Daily Line

Your routine, live. Sign up, build weekly routines out of categorized time
blocks, and see exactly what you should be doing **right now** — a glowing
timeline rail, the current block front and center, and what's up next.

Dark-first Material Design 3 Expressive UI. Accessibility-first (text
scaling, high contrast, reduced motion, full keyboard support).

**Live:** https://dailyline.spacend-digital.workers.dev

## Stack

- Next.js 16 (App Router, Server Components + Server Actions)
- Cloudflare Workers (via `@opennextjs/cloudflare`) + D1 (SQLite) via Kysely
- better-auth (email + password)
- Hand-rolled M3 Expressive design system (no UI library)

## Develop

```bash
npm install
npm run db:migrate:local   # create local D1 schema
npm run dev                # next dev (bindings via miniflare)
npm run preview            # build + run in the real Workers runtime
```

## Deploy

```bash
npm run deploy             # opennextjs-cloudflare build + deploy
npm run db:migrate:remote  # apply D1 migrations to prod
```

Every push to `main` also auto-deploys via Cloudflare Workers Builds
(connected to this repo; build command `npm run deploy`).

## Features

- **Now view** — live day rail with past/current dimming, hero card with
  wavy expressive progress + countdown, up-next queue, past-midnight handling
- **Week view** — all seven days at a glance, live "now" highlight
- **Editor** — per-day block CRUD (FAB + dialogs), overlap warnings,
  editable day taglines
- **Categories** — full CRUD with color swatches; deleting one gracefully
  falls back to "Uncategorized"
- **Routines** — multiple routines (e.g. semester vs. break), switch / copy /
  rename / delete from the app bar
- **Accounts** — email + password sign-up; your original Daily Line routine
  is seeded automatically on first sign-up
