---
name: nrl22-target-math
description: Source-of-truth formulas for converting NRL22 course-of-fire target angular sizes (MIL/MOA) and distances into exact printable dimensions. Use before touching lib/target-math.ts, lib/target-layout.ts, lib/pdf/, or any target-sizing/scaling logic in this repo.
---

# NRL22 target sizing math

This app turns a course-of-fire's target spec (angular size + official
distance) into a printed shape sized correctly for wherever the shooter is
actually going to stand. Getting this math wrong means printing a target
that doesn't represent the intended difficulty — so treat this file as
authoritative and `lib/target-math.ts` as its single implementation.

## The problem being solved

NRL22 stages specify targets like "1.2 MIL circle at 38 yards." That target
only subtends the correct angle if you're standing 38 yards away. If you're
practicing at a 25-yard range instead, printing the target at its "natural"
1.2 MIL/38 yd size would make it look too small on paper relative to how it
would appear at 38 yards through a scope — the target needs to be printed
_smaller_ (scaled to the shorter practice distance) so it still subtends
1.2 MIL from 25 yards.

## Verified constants

```ts
export const YARDS_PER_METER = 1.093613;
export const IN_PER_YD_PER_MIL = 0.036; // milliradian, NOT NATO 6400-mil
export const IN_PER_100YD_PER_MOA = 1.047; // TRUE/exact MOA, NOT "Shooter's MOA"
```

- **MIL** here means the **milliradian** (rifle-scope "MIL"), verified as
  3.6 in / 100 yd (equivalently 10 cm / 100 m). This is **not** the NATO
  6400-mil (angular mil), which works out to roughly 3.53 in/100yd — a
  different, incompatible unit that happens to share the name "mil."
- **MOA** here means **true/exact MOA** (1 arcminute = 1.047 in/100yd),
  verified against reputable sources ([NSSF's MOA
  explainer](https://www.nssf.org/shooting/minute-angle-moa/), [Everyday
  Marksman's MRAD vs MOA
  breakdown](https://www.everydaymarksman.co/marksmanship/mildots-vs-moa/)).
  This is **not** "Shooter's MOA" (≈1.0 in/100yd, a rounded approximation
  some scope turrets use). Quality precision scopes and NRL22 stage
  designers work in true MOA, so this app deliberately does not offer a
  Shooter's MOA toggle — silently picking the wrong constant would corrupt
  every printed target's real-world size.
- Cross-check: 1.2 MIL ≈ 4.13 MOA (both represent the same angle, ~2 sig
  figs apart due to rounding — useful as a sanity check, not for
  conversion).

## Core formulas

```
inches = angular_value * (linear_constant) * range_in_hundred_yards_or_yards
```

Concretely (see `lib/target-math.ts`):

- `toYards(distance)` — converts yards or meters to yards (`YARDS_PER_METER`).
- `angularToInches(angular, rangeYards)`:
  - MIL: `rangeYards * angular.value * IN_PER_YD_PER_MIL`
  - MOA: `(rangeYards / 100) * angular.value * IN_PER_100YD_PER_MOA`
- `effectivePrintDistance(target, globalPracticeDistance)` resolves, in
  priority order: `target.overrideDistance` → `globalPracticeDistance` →
  `target.representedRange` (i.e. no practice distance set at all means
  print the target at true/full scale, as a full-size reference).
- `computeTargetPrintSize(target, globalPracticeDistance)` combines the
  above to produce `{ widthIn, heightIn }` for any shape, including
  independent width/height MIL or MOA values for rectangles.

## Verified reference numbers (regression-test these)

From the original reference design, independently re-verified against the
sources above:

| Angular size | Range                    | Print size |
| ------------ | ------------------------ | ---------- |
| 1.2 MIL      | 38 yd (native)           | 1.6416 in  |
| 1.2 MIL      | scaled to 25 yd practice | 1.08 in    |
| 1 MIL        | 100 yd (exact)           | 3.6 in     |
| 1 MOA        | 100 yd (exact)           | 1.047 in   |

These are asserted in `lib/target-math.test.ts` — if a future change makes
these numbers drift, the math is wrong, not the test.

## Validation rules

- All angular sizes and distances must be **strictly positive**. `0` or
  negative values throw (`toYards`, `angularToInches`). `undefined` means
  "not set" (e.g. no override distance) — never use `0` to mean "unset."
- v1 only supports MIL and true MOA — no unit silently defaults or
  auto-converts between "flavors" of the same nominal unit.

## Where this feeds into layout/print (do not duplicate this math there)

`lib/target-layout.ts` calls `computeTargetPrintSize()` per target, then
feeds the resulting inch dimensions into `lib/packing.ts` (pure geometry,
no knowledge of MIL/MOA) to lay out a page. `lib/pdf/generate-target-pdf.ts`
and `components/PreviewCanvas.tsx` both consume the _same_
`layoutSession()` output, so the on-screen preview and the printed PDF can
never disagree about a target's size — only `lib/target-math.ts` knows
about MIL/MOA conversion at all.
