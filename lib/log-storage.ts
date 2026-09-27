import { isPositionId, type PositionId } from "./positions";

export interface StageLogEntry {
  localId: string;
  dbId: number | null;
  matchDate: string;
  matchName: string | null;
  stageName: string | null;
  propId: number | null;
  propNameFreeform: string | null;
  position: PositionId | null;
  impacts: number | null;
  shotsPossible: number | null;
  timeSeconds: number | null;
  comments: string | null;
  cofStageId: number | null;
  synced: boolean;
}

const STORAGE_KEY = "nrl22-stage-logs-v1";

function isNullOr<T>(check: (v: unknown) => v is T) {
  return (value: unknown): value is T | null => value === null || check(value);
}

const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

function isStageLogEntry(value: unknown): value is StageLogEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.localId === "string" &&
    (v.dbId === null || isNumber(v.dbId)) &&
    typeof v.matchDate === "string" &&
    isNullOr(isString)(v.matchName) &&
    isNullOr(isString)(v.stageName) &&
    (v.propId === null || isNumber(v.propId)) &&
    isNullOr(isString)(v.propNameFreeform) &&
    (v.position === null || isPositionId(v.position)) &&
    (v.impacts === null || isNumber(v.impacts)) &&
    (v.shotsPossible === null || isNumber(v.shotsPossible)) &&
    (v.timeSeconds === null || isNumber(v.timeSeconds)) &&
    isNullOr(isString)(v.comments) &&
    (v.cofStageId === undefined ||
      v.cofStageId === null ||
      isNumber(v.cofStageId)) &&
    typeof v.synced === "boolean"
  );
}

/** SSR-safe: returns [] on the server or when nothing valid is stored. */
export function loadStageLogs(): StageLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStageLogEntry) : [];
  } catch {
    return [];
  }
}

export function saveStageLogs(entries: StageLogEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage can be unavailable (private browsing, quota exceeded) —
    // non-critical, the queue just won't persist across reloads.
  }
}
