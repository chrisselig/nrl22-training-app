"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { POSITION_IDS, POSITION_LABELS, type PositionId } from "@/lib/positions";
import {
  loadStageLogs,
  saveStageLogs,
  type StageLogEntry,
} from "@/lib/log-storage";

interface PropOption {
  id: number;
  name: string;
}

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass =
  "block text-xs font-medium text-neutral-600 dark:text-neutral-400";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function syncEntry(entry: StageLogEntry): Promise<StageLogEntry> {
  const res = await fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matchDate: entry.matchDate,
      matchName: entry.matchName ?? undefined,
      stageName: entry.stageName ?? undefined,
      propId: entry.propId ?? undefined,
      propNameFreeform: entry.propNameFreeform ?? undefined,
      position: entry.position ?? undefined,
      impacts: entry.impacts ?? undefined,
      shotsPossible: entry.shotsPossible ?? undefined,
      timeSeconds: entry.timeSeconds ?? undefined,
      comments: entry.comments ?? undefined,
    }),
  });
  if (res.status === 401) {
    throw new Error("auth");
  }
  if (!res.ok) {
    throw new Error("sync failed");
  }
  const saved = (await res.json()) as { id: number };
  return { ...entry, dbId: saved.id, synced: true };
}

export default function LogPage() {
  const [entries, setEntries] = useState<StageLogEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [props, setProps] = useState<PropOption[]>([]);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [matchDate, setMatchDate] = useState(todayIsoDate());
  const [matchName, setMatchName] = useState("");
  const [stageName, setStageName] = useState("");
  const [propName, setPropName] = useState("");
  const [position, setPosition] = useState<PositionId | null>(null);
  const [impacts, setImpacts] = useState(0);
  const [shotsPossible, setShotsPossible] = useState("");
  const [timed, setTimed] = useState(false);
  const [timeSeconds, setTimeSeconds] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    // Mount-time hydration from localStorage — browser-only store, not
    // available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(loadStageLogs());
    setHydrated(true);

    fetch("/api/props")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: number; name: string }[]) =>
        setProps(data.map((p) => ({ id: p.id, name: p.name }))),
      )
      .catch(() => setProps([]));
  }, []);

  useEffect(() => {
    if (hydrated) saveStageLogs(entries);
  }, [entries, hydrated]);

  useEffect(() => {
    function handleOnline() {
      void flushPending();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
    // flushPending closes over `entries` via a ref-free re-declare each
    // render, so it's intentionally omitted here to avoid re-subscribing
    // on every keystroke; the listener always reads the latest state via
    // the functional setEntries update inside flushPending.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function flushPending() {
    setSyncing(true);
    setNeedsLogin(false);
    let hitAuthWall = false;
    for (const entry of entries) {
      if (entry.synced) continue;
      try {
        const synced = await syncEntry(entry);
        setEntries((prev) =>
          prev.map((e) => (e.localId === synced.localId ? synced : e)),
        );
      } catch (e) {
        if (e instanceof Error && e.message === "auth") hitAuthWall = true;
      }
    }
    if (hitAuthWall) setNeedsLogin(true);
    setSyncing(false);
  }

  function resetForm() {
    setStageName("");
    setPropName("");
    setPosition(null);
    setImpacts(0);
    setShotsPossible("");
    setTimed(false);
    setTimeSeconds("");
    setComments("");
  }

  function handleSubmit() {
    const matchedProp = props.find(
      (p) => p.name.toLowerCase() === propName.trim().toLowerCase(),
    );

    const entry: StageLogEntry = {
      localId: crypto.randomUUID(),
      dbId: null,
      matchDate,
      matchName: matchName.trim() || null,
      stageName: stageName.trim() || null,
      propId: matchedProp?.id ?? null,
      propNameFreeform: matchedProp ? null : propName.trim() || null,
      position,
      impacts,
      shotsPossible: shotsPossible ? Number(shotsPossible) : null,
      timeSeconds: timed && timeSeconds ? Number(timeSeconds) : null,
      comments: comments.trim() || null,
      synced: false,
    };

    setEntries((prev) => [entry, ...prev]);
    resetForm();
    void flushPending();
  }

  const pendingCount = entries.filter((e) => !e.synced).length;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 lg:p-6">
      <header>
        <h1 className="text-xl font-semibold">Match Log</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Quick per-stage capture. Saves locally first — safe on bad range
          signal.
        </p>
      </header>

      {needsLogin && <LoginForm onSuccess={() => void flushPending()} />}

      <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass} htmlFor="matchDate">
              Match date
            </label>
            <input
              id="matchDate"
              type="date"
              className={inputClass}
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="matchName">
              Match name (optional)
            </label>
            <input
              id="matchName"
              className={inputClass}
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              placeholder="e.g. Oct #2"
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="stageName">
            Stage
          </label>
          <input
            id="stageName"
            className={inputClass}
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="propName">
            Prop
          </label>
          <input
            id="propName"
            list="prop-options"
            className={inputClass}
            value={propName}
            onChange={(e) => setPropName(e.target.value)}
            placeholder="Type or pick a known prop"
          />
          <datalist id="prop-options">
            {props.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
        </div>

        <div>
          <span className={labelClass}>Position</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {POSITION_IDS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPosition(p === position ? null : p)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  position === p
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                }`}
              >
                {POSITION_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className={labelClass}>Impacts</span>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImpacts((n) => Math.max(0, n - 1))}
                className="h-8 w-8 rounded-md border border-neutral-300 text-lg dark:border-neutral-700"
              >
                −
              </button>
              <input
                type="number"
                className={`${inputClass} text-center`}
                value={impacts}
                onChange={(e) => setImpacts(Number(e.target.value) || 0)}
              />
              <button
                type="button"
                onClick={() => setImpacts((n) => n + 1)}
                className="h-8 w-8 rounded-md border border-neutral-300 text-lg dark:border-neutral-700"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="shotsPossible">
              Shots possible (optional)
            </label>
            <input
              id="shotsPossible"
              type="number"
              className={inputClass}
              value={shotsPossible}
              onChange={(e) => setShotsPossible(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
            />
            Timed stage
          </label>
          {timed && (
            <input
              type="number"
              className={`${inputClass} mt-1`}
              placeholder="Time (seconds)"
              value={timeSeconds}
              onChange={(e) => setTimeSeconds(e.target.value)}
            />
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="comments">
            Comments
          </label>
          <input
            id="comments"
            className={inputClass}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Log stage
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Recent entries
        </h2>
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={() => void flushPending()}
            disabled={syncing}
            className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-40"
          >
            {syncing ? "Syncing…" : `Sync now (${pendingCount} pending)`}
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.localId}
            className="rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {entry.matchDate}
                {entry.matchName ? ` — ${entry.matchName}` : ""}
                {entry.stageName ? ` — ${entry.stageName}` : ""}
              </span>
              <span
                className={
                  entry.synced
                    ? "text-green-600 dark:text-green-400"
                    : "text-amber-600 dark:text-amber-400"
                }
              >
                {entry.synced ? "synced" : "pending"}
              </span>
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">
              {entry.propNameFreeform ??
                props.find((p) => p.id === entry.propId)?.name ??
                "—"}
              {entry.position ? ` · ${POSITION_LABELS[entry.position]}` : ""}
              {entry.impacts !== null ? ` · ${entry.impacts} impacts` : ""}
              {entry.timeSeconds !== null ? ` · ${entry.timeSeconds}s` : ""}
            </div>
            {entry.comments && <div>{entry.comments}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
