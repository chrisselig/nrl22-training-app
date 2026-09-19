@AGENTS.md

# NRL22 Target Printer

A client-only Next.js PWA that turns an NRL22 course of fire (target
shapes, angular sizes in MIL/MOA, and official distances) into an
exact-scale printable PDF, scaled to whatever distance the shooter will
actually practice at. No backend — everything lives in the browser
(localStorage) and the exported PDF.

**Before touching target sizing/scaling math**, read
`.claude/skills/nrl22-target-math/SKILL.md` — it's the verified
source-of-truth for the MIL/MOA formulas and the reasoning behind them.
Don't re-derive or "simplify" the constants in `lib/target-math.ts`.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4
- `@cantoo/pdf-lib` for exact-scale, vector PDF generation (client-side —
  browser CSS print (`@media print`) is deliberately not used, since
  browsers/printers frequently auto-scale printed HTML and would corrupt
  real-world dimensional accuracy)
- Serwist (`serwist` + `@serwist/next`) for the offline-capable PWA service
  worker
- Vitest for unit tests

## Scripts

```
npm run dev          # next dev (Turbopack)
npm run build         # next build --webpack (see "Turbopack vs webpack" below)
npm run lint           # eslint
npm run typecheck     # tsc --noEmit
npm run test            # vitest run
npm run format:check  # prettier --check .
npm run format          # prettier --write .
```

## Architecture

Pipeline, in order:

1. **`lib/types.ts`** — `Target` (discriminated union on `shape`) and
   `Session` (a course of fire: paper size, optional global practice
   distance, ordered list of targets).
2. **`lib/target-math.ts`** — MIL/MOA → inches conversion. The only place
   that knows about angular units. See the skill file above.
3. **`lib/packing.ts`** — pure geometry shelf/row (next-fit) bin packing.
   Knows nothing about targets or MIL/MOA, only `{ widthIn, heightIn }`
   items. Deliberately **not** a space-optimizing packer — reordering items
   would break course-of-fire stage order. Validates up front that no
   single item exceeds the printable page area, throwing
   `OversizedItemError` rather than silently clipping.
4. **`lib/target-layout.ts`** — `layoutSession(session)` glues 2 and 3
   together: computes each target's print size, then packs them onto pages.
   This is the **single shared pipeline** used by both the on-screen
   preview and the PDF export, so they can never visually disagree.
5. **`components/PreviewCanvas.tsx`** — SVG preview at a fixed on-screen
   scale (`PX_PER_IN`). Not physically accurate on screen — the PDF is the
   source of truth for exact dimensions; the preview just needs to look
   right and use the same layout.
6. **`lib/pdf/`** — `generate-target-pdf.ts` (page/document assembly) and
   `shapes.ts` (per-shape drawing). **PDF coordinate gotcha:** PDF origin
   is bottom-left; `packing.ts` output is top-down inches from the page's
   top edge. The Y-axis flip happens in exactly one place —
   `shapeGeometryPt()` in `shapes.ts` — don't introduce a second flip
   elsewhere. Diamonds are drawn via four explicit `page.drawLine()` calls
   rather than `drawSvgPath`, which has contested/ambiguous Y-axis-flip
   behavior in pdf-lib (see comment in `shapes.ts`).

State: `components/SessionProvider.tsx` holds the session in React Context,
persisted to `localStorage` via `lib/storage.ts` (SSR-safe: seeds a default
session, hydrates from storage in a mount-only `useEffect`).

## Turbopack vs webpack

Next 16 defaults both `next dev` and `next build` to Turbopack, but
`@serwist/next` only hooks into webpack's build pipeline (Turbopack support
is still experimental upstream — see
https://github.com/serwist/serwist/issues/54). So:

- `npm run dev` stays on Turbopack (fast local loop) — the service worker
  is **not** generated in dev; PWA/offline behavior can only be verified
  against a production build (`npm run build && npm start`).
- `npm run build` explicitly passes `--webpack` so `public/sw.js` actually
  gets generated. This is what Vercel will run.
- `app/sw.ts` is excluded from the main `tsconfig.json` (its
  `ServiceWorkerGlobalScope` types conflict with the app's `dom` lib) and
  typechecked separately via `tsconfig.worker.json`.

## Git workflow

Work happens on `dev`, as incremental logical commits. Open a PR `dev` →
`main` when a milestone is ready; don't merge or deploy without explicit
confirmation. Branch protection settings are not changed automatically.

## Known stretch goal (not yet implemented)

Logging into NRL22/NRL22 Canada to auto-import a course of fire's official
target list (credentials via a local `.env`, not deployed). Needs its own
scoping pass (site ToS, auth mechanism, where the script should run) before
starting — see conversation history / a future plan doc, not started as of
this writing.
