"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { loadSession, saveSession } from "@/lib/storage";
import { createEmptySession } from "@/lib/types";
import type { Distance, PaperSize, Session, Target } from "@/lib/types";

interface SessionContextValue {
  session: Session;
  hydrated: boolean;
  addTarget: (target: Target) => void;
  updateTarget: (id: string, target: Target) => void;
  removeTarget: (id: string) => void;
  duplicateTarget: (id: string) => void;
  moveTarget: (id: string, direction: "up" | "down") => void;
  setPaperSize: (paperSize: PaperSize) => void;
  setGlobalPracticeDistance: (distance: Distance | undefined) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `target-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(createEmptySession);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount only — reading it during render
  // would produce a server/client markup mismatch since the server has no
  // localStorage to read from.
  useEffect(() => {
    const stored = loadSession();
    // One-off mount-time hydration from a browser-only store (localStorage)
    // that isn't available during SSR; useSyncExternalStore doesn't fit
    // here since this state is subsequently user-editable, not a live
    // external subscription. This is the documented default-on-server /
    // patch-after-mount pattern the rule is known to over-flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setSession(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSession(session);
  }, [session, hydrated]);

  const value: SessionContextValue = {
    session,
    hydrated,
    addTarget: (target) =>
      setSession((s) => ({ ...s, targets: [...s.targets, target] })),
    updateTarget: (id, target) =>
      setSession((s) => ({
        ...s,
        targets: s.targets.map((t) => (t.id === id ? target : t)),
      })),
    removeTarget: (id) =>
      setSession((s) => ({
        ...s,
        targets: s.targets.filter((t) => t.id !== id),
      })),
    duplicateTarget: (id) =>
      setSession((s) => {
        const idx = s.targets.findIndex((t) => t.id === id);
        if (idx === -1) return s;
        const copy: Target = { ...s.targets[idx], id: generateId() };
        const targets = [...s.targets];
        targets.splice(idx + 1, 0, copy);
        return { ...s, targets };
      }),
    moveTarget: (id, direction) =>
      setSession((s) => {
        const idx = s.targets.findIndex((t) => t.id === id);
        if (idx === -1) return s;
        const swapWith = direction === "up" ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= s.targets.length) return s;
        const targets = [...s.targets];
        [targets[idx], targets[swapWith]] = [targets[swapWith], targets[idx]];
        return { ...s, targets };
      }),
    setPaperSize: (paperSize) => setSession((s) => ({ ...s, paperSize })),
    setGlobalPracticeDistance: (distance) =>
      setSession((s) => ({ ...s, globalPracticeDistance: distance })),
    resetSession: () => setSession(createEmptySession()),
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}

export { generateId };
