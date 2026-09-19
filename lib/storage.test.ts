import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, loadSession, loadSessionOrDefault, saveSession } from "./storage";
import type { Session } from "./types";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}

const sampleSession: Session = {
  schemaVersion: 1,
  paperSize: "letter",
  targets: [
    {
      id: "t1",
      shape: "circle",
      angularSize: { value: 1, unit: "mil" },
      representedRange: { value: 38, unit: "yd" },
    },
  ],
};

describe("storage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: new MemoryStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips a session through save/load", () => {
    saveSession(sampleSession);
    expect(loadSession()).toEqual(sampleSession);
  });

  it("returns undefined when nothing is stored", () => {
    expect(loadSession()).toBeUndefined();
  });

  it("returns undefined for corrupted JSON instead of throwing", () => {
    window.localStorage.setItem("nrl22-target-session-v1", "{not json");
    expect(loadSession()).toBeUndefined();
  });

  it("rejects a payload with the wrong schema version", () => {
    window.localStorage.setItem(
      "nrl22-target-session-v1",
      JSON.stringify({ ...sampleSession, schemaVersion: 2 }),
    );
    expect(loadSession()).toBeUndefined();
  });

  it("clears the stored session", () => {
    saveSession(sampleSession);
    clearSession();
    expect(loadSession()).toBeUndefined();
  });

  it("loadSessionOrDefault falls back to an empty session", () => {
    const session = loadSessionOrDefault();
    expect(session.targets).toEqual([]);
    expect(session.schemaVersion).toBe(1);
  });
});

describe("storage on the server (no window)", () => {
  it("no-ops instead of throwing when window is undefined", () => {
    expect(loadSession()).toBeUndefined();
    expect(() => saveSession(sampleSession)).not.toThrow();
    expect(() => clearSession()).not.toThrow();
  });
});
