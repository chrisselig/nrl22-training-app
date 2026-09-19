import type { Angular, Distance, Target } from "./types";

export const YARDS_PER_METER = 1.093613;

/**
 * Exact: 36 in/yd x 0.001 rad. This is the MILLIRADIAN ("MIL" on a
 * precision rifle scope), NOT the NATO 6400-per-circle angular mil
 * (~3.53 in/100yd). Verified against NSSF and Everyday Marksman
 * ballistics references — do not "correct" this to the NATO value.
 */
export const IN_PER_YD_PER_MIL = 0.036;

/**
 * TRUE/exact MOA (1 arcminute = 1.047 in/100yd), not the rounded
 * "Shooter's MOA" (~1.0 in/100yd) some scopes use. Quality scopes and
 * NRL22 stage designers use true MOA, so v1 does not offer a Shooter's
 * MOA toggle — silently picking the wrong constant would corrupt
 * real-world printed sizes.
 */
export const IN_PER_100YD_PER_MOA = 1.047;

export function toYards(distance: Distance): number {
  if (distance.value <= 0) {
    throw new Error(`Distance must be positive, got ${distance.value}`);
  }
  return distance.unit === "yd" ? distance.value : distance.value * YARDS_PER_METER;
}

export function angularToInches(angular: Angular, rangeYards: number): number {
  if (angular.value <= 0) {
    throw new Error(`Angular size must be positive, got ${angular.value}`);
  }
  if (rangeYards <= 0) {
    throw new Error(`Range must be positive, got ${rangeYards}`);
  }
  return angular.unit === "mil"
    ? rangeYards * angular.value * IN_PER_YD_PER_MIL
    : (rangeYards / 100) * angular.value * IN_PER_100YD_PER_MOA;
}

/**
 * Resolves the distance a target should be scaled for when printed:
 * the target's own override, else the session's global practice
 * distance, else the target's represented range itself (i.e. print at
 * true/full scale — a full-size reference target).
 */
export function effectivePrintDistance(
  target: Target,
  globalPracticeDistance?: Distance,
): Distance {
  return target.overrideDistance ?? globalPracticeDistance ?? target.representedRange;
}

export interface PrintSize {
  widthIn: number;
  heightIn: number;
}

export function computeTargetPrintSize(
  target: Target,
  globalPracticeDistance?: Distance,
): PrintSize {
  const printDistance = effectivePrintDistance(target, globalPracticeDistance);
  const rangeYards = toYards(printDistance);

  if (target.shape === "rectangle") {
    const widthIn = angularToInches(target.angularWidth, rangeYards);
    const heightIn = angularToInches(target.angularHeight, rangeYards);
    return { widthIn, heightIn };
  }

  const size = angularToInches(target.angularSize, rangeYards);
  return { widthIn: size, heightIn: size };
}

function formatDistance(distance: Distance): string {
  const rounded = Math.round(distance.value * 100) / 100;
  return `${rounded} ${distance.unit}`;
}

function formatAngular(angular: Angular): string {
  const rounded = Math.round(angular.value * 100) / 100;
  return angular.unit === "mil" ? `${rounded} MIL` : `${rounded} MOA`;
}

/** e.g. "1.2 MIL x 38 yd" or "2 MIL x 1 MIL x 38 yd" for a rectangle. */
export function formatLabel(target: Target): string {
  const range = formatDistance(target.representedRange);
  if (target.shape === "rectangle") {
    return `${formatAngular(target.angularWidth)} x ${formatAngular(target.angularHeight)} · ${range}`;
  }
  return `${formatAngular(target.angularSize)} · ${range}`;
}
