# NRL22 Training App

A PWA for NRL22 prep: build a course of fire and print exact-scale practice
targets, keep a prop/position strategy notebook, log stage results during a
match, pull official results, and archive the monthly course of fire from
nrl22.com.

## What it does

- **Target Printer** (`/`) — add each target from a course of fire (shape,
  angular size in MIL/MOA, official distance), optionally set a practice
  distance to scale targets down to what you'll actually shoot from, export
  a PDF, print at **Actual Size / 100%** on graph paper.
- **Props & Strategy** (`/props`) — catalog of props (barricades, barrels,
  tank traps, etc.) with per-position equipment/bag-placement notes, so you
  have a ready answer at the range instead of guessing.
- **Match Log** (`/log`) — quick per-stage capture during a match (prop,
  position, impacts, time, comments), saved to localStorage first and
  synced to the DB in the background so it works with bad range signal.
- **Results** (`/results`) — on-demand scrape of your nrl22.com match
  results.
- **Course of Fire** (`/cof`) — auto-imports the monthly COF PDF from
  nrl22.com (stage number/name/time parsed automatically; prop/position/
  distance are manual since COF prose isn't reliable enough to guess from),
  with a paste-it-yourself fallback. `npm run backfill-cof-archive` does a
  one-time pull of the whole archive.

The target printer works fully client-side/offline as a PWA. Everything
else (props, logs, results, COF) needs a Postgres DB and is behind a shared
write password — see Environment below.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Note: the PWA service worker is only generated
in production builds (`npm run build && npm start`) — see `CLAUDE.md` for
why.

### Environment

| Var                                 | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                      | Postgres (Neon/Vercel Postgres)                        |
| `APP_PASSWORD`                      | shared password gating writes (props/logs/results/cof) |
| `SESSION_SECRET`                    | HMAC key for the signed auth cookie                    |
| `NRL22_USERNAME` / `NRL22_PASSWORD` | your nrl22.com login, for results scrape + COF import  |

Run `npm run migrate` once against a fresh `DATABASE_URL` to create the
schema (`lib/db/schema.sql`).

## Scripts

| Script                         | What it does                                       |
| ------------------------------ | -------------------------------------------------- |
| `npm run dev`                  | Local dev server (Turbopack)                       |
| `npm run build`                | Production build (webpack, for the service worker) |
| `npm run test`                 | Unit tests (Vitest)                                |
| `npm run typecheck`            | `tsc --noEmit`                                     |
| `npm run lint`                 | ESLint                                             |
| `npm run format`               | Prettier (write)                                   |
| `npm run migrate`              | Create/update DB schema from `lib/db/schema.sql`   |
| `npm run seed-props`           | Seed the `props` table with common NRL22 props     |
| `npm run backfill-cof-archive` | One-time pull of the full nrl22.com COF archive    |

## Project docs

See `CLAUDE.md` for architecture, and
`.claude/skills/nrl22-target-math/SKILL.md` for the verified MIL/MOA sizing
math this app is built on.
