# NRL22 Target Printer

A PWA for building an NRL22 course of fire and printing exact-scale
practice targets — scaled to whatever distance you'll actually be shooting
from, not just the official match distance.

## What it does

1. Add each target from your course of fire: shape (circle/square/diamond/
   rectangle), angular size (MIL or MOA), and the official represented
   distance.
2. Optionally set a global practice distance (e.g. "I'll be shooting from
   25 yd") — every target scales down to look correct from that distance
   and prints it at the top of every page. Leave it unset to print targets
   at true/full scale.
3. Export a PDF, feed graph paper into your printer, and print at
   **Actual Size / 100%** (never "fit to page").

Everything runs client-side — no account, no backend, works offline once
installed as a PWA.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Note: the PWA service worker is only generated
in production builds (`npm run build && npm start`) — see `CLAUDE.md` for
why.

## Scripts

| Script              | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Local dev server (Turbopack)                       |
| `npm run build`     | Production build (webpack, for the service worker) |
| `npm run test`      | Unit tests (Vitest)                                |
| `npm run typecheck` | `tsc --noEmit`                                     |
| `npm run lint`      | ESLint                                             |
| `npm run format`    | Prettier (write)                                   |

## Project docs

See `CLAUDE.md` for architecture, and
`.claude/skills/nrl22-target-math/SKILL.md` for the verified MIL/MOA sizing
math this app is built on.
