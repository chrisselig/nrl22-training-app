import { createEmptySession, type Session } from "./types";

const STORAGE_KEY = "nrl22-target-session-v1";

function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.schemaVersion === 1 &&
    Array.isArray(v.targets) &&
    typeof v.paperSize === "string"
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
