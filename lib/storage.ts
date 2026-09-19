import {
  createEmptySession,
  type Angular,
  type Distance,
  type Session,
  type Target,
} from "./types";

const STORAGE_KEY = "nrl22-target-session-v1";

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isDistance(value: unknown): value is Distance {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return isPositiveFinite(v.value) && (v.unit === "yd" || v.unit === "m");
}

function isAngular(value: unknown): value is Angular {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return isPositiveFinite(v.value) && (v.unit === "mil" || v.unit === "moa");
}

// Validates nested numeric fields, not just top-level shape — a corrupted
// or hand-edited localStorage entry with e.g. a non-numeric angularSize
// must be rejected here rather than flowing NaN into the math/packing
// layers, which only guard against value <= 0 (NaN comparisons are always
// false, so that guard silently passes NaN through).
function isTarget(value: unknown): value is Target {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string") return false;
  if (!isDistance(v.representedRange)) return false;
  if (v.overrideDistance !== undefined && !isDistance(v.overrideDistance)) {
    return false;
  }
  if (v.stage !== undefined && typeof v.stage !== "string") return false;
  if (v.shape === "circle" || v.shape === "square" || v.shape === "diamond") {
    return isAngular(v.angularSize);
  }
  if (v.shape === "rectangle") {
    return isAngular(v.angularWidth) && isAngular(v.angularHeight);
  }
  return false;
}

function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.schemaVersion === 1 &&
    (v.paperSize === "letter" || v.paperSize === "a4") &&
    (v.globalPracticeDistance === undefined ||
      isDistance(v.globalPracticeDistance)) &&
    Array.isArray(v.targets) &&
    v.targets.every(isTarget)
  );
}

/** SSR-safe: returns undefined on the server or when nothing valid is stored. */
export function loadSession(): Session | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage can be unavailable (private browsing, quota exceeded) —
    // non-critical, the session just won't persist across reloads.
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function loadSessionOrDefault(): Session {
  return loadSession() ?? createEmptySession();
}
