"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { PageHeader } from "@/components/PageHeader";
import {
  POSITION_IDS,
  POSITION_LABELS,
  isPositionId,
  type PositionId,
} from "@/lib/positions";
import {
  loadStageLogs,
  saveStageLogs,
  type StageLogEntry,
} from "@/lib/log-storage";

interface StrategyOption {
  id: number;
  position: string;
  equipment: string | null;
  bag_placement: string | null;
  notes: string | null;
}

interface PropOption {
  id: number;
  name: string;
  strategies: StrategyOption[];
}

interface CofStageOption {
  id: number;
  stage_number: number | null;
  stage_name: string | null;
  prop_name_freeform: string | null;
  position: string | null;
  round_count: number | null;
  is_timed: boolean;
  par_time_seconds: string | null;
  has_image: boolean;
}

interface CofDocumentOption {
  id: number;
  month: string;
  stages: CofStageOption[];
}

interface ServerLogRow {
  id: number;
  match_date: string;
  stage_name: string | null;
  impacts: number | null;
  shots_possible: number | null;
}

interface StageRollup {
  stageName: string;
  attempts: number;
  avgImpacts: number | null;
  avgShotsPossible: number | null;
  hitRatePct: number | null;
  lastDate: string;
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
      cofStageId: entry.cofStageId ?? undefined,
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
  const [cofDocuments, setCofDocuments] = useState<CofDocumentOption[]>([]);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [serverLogs, setServerLogs] = useState<ServerLogRow[] | null>(null);

  const [matchDate, setMatchDate] = useState(todayIsoDate());
  const [matchName, setMatchName] = useState("");
  const [cofMonth, setCofMonth] = useState("");
  const [cofStageId, setCofStageId] = useState<number | null>(null);
  const [stageName, setStageName] = useState("");
  const [propName, setPropName] = useState("");
  const [position, setPosition] = useState<PositionId | null>(null);
  const [impacts, setImpacts] = useState(0);
  const [shotsPossible, setShotsPossible] = useState("");
  const [timed, setTimed] = useState(false);
  const [timeSeconds, setTimeSeconds] = useState("");
  const [comments, setComments] = useState("");

  const stagesForMonth =
    cofDocuments.find((d) => d.month === cofMonth)?.stages ?? [];
  const selectedStage = stagesForMonth.find((s) => s.id === cofStageId);

  // A stage often names several props ("2 cinder blocks, 6ft ladder, 1
  // cinder block" = multiple positions in one stage), so match every
  // catalog prop mentioned in propName rather than requiring one exact
  // prop per stage — surfaces all of their saved strategies at once
  // instead of a blind, context-free position picker.
  const matchedProps = useMemo(
    () =>
      propName.trim()
        ? props.filter((p) =>
            propName.toLowerCase().includes(p.name.toLowerCase()),
          )
        : [],
    [propName, props],
  );

  function applyCofStage(stage: CofStageOption | undefined) {
    setCofStageId(stage?.id ?? null);
    if (!stage) return;
    setStageName(
      stage.stage_number
        ? `${stage.stage_number}. ${stage.stage_name}`
        : (stage.stage_name ?? ""),
    );
    setPropName(stage.prop_name_freeform ?? "");
    setPosition(isPositionId(stage.position) ? stage.position : null);
    setShotsPossible(stage.round_count ? String(stage.round_count) : "");
    setTimed(stage.is_timed);
    setTimeSeconds(stage.par_time_seconds ?? "");
  }

  useEffect(() => {
    // Mount-time hydration from localStorage — browser-only store, not
    // available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(loadStageLogs());
    setHydrated(true);

    fetch("/api/props")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PropOption[]) =>
        setProps(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            strategies: p.strategies,
          })),
        ),
      )
      .catch(() => setProps([]));

    fetch("/api/cof")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CofDocumentOption[]) => setCofDocuments(data))
      .catch(() => setCofDocuments([]));

    void refreshServerLogs();
  }, []);

  async function refreshServerLogs() {
    try {
      const res = await fetch("/api/logs");
      if (res.status === 401) {
        setNeedsLogin(true);
        setServerLogs([]);
        return;
      }
      setServerLogs(res.ok ? await res.json() : []);
    } catch {
      setServerLogs([]);
    }
  }

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
    void refreshServerLogs();
  }

  function resetForm() {
    setCofStageId(null);
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
      cofStageId,
      synced: false,
    };

    setEntries((prev) => [entry, ...prev]);
    resetForm();
    void flushPending();
  }

  const pendingCount = entries.filter((e) => !e.synced).length;

  // Grouped by stage design, not prop — a stage's hit count often spans
  // multiple props (e.g. a barricade *and* a barrel in one stage), so a
  // single "impacts" total can't be attributed to one prop. Worst-first so
  // the stages needing practice surface at the top.
  const stageRollup = useMemo<StageRollup[]>(() => {
    const groups = new Map<string, ServerLogRow[]>();
    for (const row of serverLogs ?? []) {
      const key = row.stage_name?.trim() || "Unnamed stage";
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key, list);
    }
    const rollups = Array.from(groups.entries()).map(([stageName, rows]) => {
      const withImpacts = rows.filter((r) => r.impacts !== null);
      const withShots = rows.filter((r) => r.shots_possible !== null);
      const avgImpacts = withImpacts.length
        ? withImpacts.reduce((sum, r) => sum + (r.impacts ?? 0), 0) /
          withImpacts.length
        : null;
      const avgShotsPossible = withShots.length
        ? withShots.reduce((sum, r) => sum + (r.shots_possible ?? 0), 0) /
          withShots.length
        : null;
      const hitRatePct =
        avgImpacts !== null && avgShotsPossible
          ? (avgImpacts / avgShotsPossible) * 100
          : null;
      const lastDate = rows.reduce(
        (max, r) => (r.match_date > max ? r.match_date : max),
        rows[0].match_date,
      );
      return {
        stageName,
        attempts: rows.length,
        avgImpacts,
        avgShotsPossible,
        hitRatePct,
        lastDate,
      };
    });
    return rollups.sort((a, b) => {
      const aScore = a.hitRatePct ?? a.avgImpacts ?? Infinity;
      const bScore = b.hitRatePct ?? b.avgImpacts ?? Infinity;
      return aScore - bScore;
    });
  }, [serverLogs]);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 lg:p-6">
      <PageHeader eyebrow="Live capture" title="Match Log">
        Quick per-stage capture. Saves locally first — safe on bad range signal.
      </PageHeader>

      {needsLogin && (
        <LoginForm
          onSuccess={() => {
            void flushPending();
            void refreshServerLogs();
          }}
        />
      )}

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

        {cofDocuments.length > 0 && (
          <div className="grid grid-cols-2 gap-2 rounded-md border border-dashed border-neutral-300 p-2 dark:border-neutral-700">
            <div>
              <label className={labelClass} htmlFor="cofMonth">
                From Course of Fire
              </label>
              <select
                id="cofMonth"
                className={inputClass}
                value={cofMonth}
                onChange={(e) => {
                  setCofMonth(e.target.value);
                  applyCofStage(undefined);
                }}
              >
                <option value="">— pick a month —</option>
                {cofDocuments.map((doc) => (
                  <option key={doc.id} value={doc.month}>
                    {doc.month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="cofStage">
                Stage
              </label>
              <select
                id="cofStage"
                className={inputClass}
                value={cofStageId ?? ""}
                onChange={(e) =>
                  applyCofStage(
                    stagesForMonth.find((s) => s.id === Number(e.target.value)),
                  )
                }
                disabled={!cofMonth}
              >
                <option value="">— pick a stage —</option>
                {stagesForMonth.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.stage_number}. {stage.stage_name}
                  </option>
                ))}
              </select>
            </div>
            {selectedStage?.has_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/cof/stages/${selectedStage.id}/image`}
                alt={`Stage ${selectedStage.stage_number} diagram`}
                className="col-span-2 w-full rounded-md border border-neutral-200 dark:border-neutral-800"
              />
            )}
          </div>
        )}

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

        {matchedProps.length > 0 && (
          <div className="space-y-1.5 rounded-md border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900/50">
            <span className={labelClass}>
              Saved strategies for this stage&apos;s props
            </span>
            {matchedProps.map((p) =>
              p.strategies.length > 0 ? (
                p.strategies.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setPosition(isPositionId(s.position) ? s.position : null)
                    }
                    className={`block w-full rounded-md border px-2 py-1 text-left text-xs ${
                      position === s.position
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                        : "border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    <span className="font-medium">
                      {p.name} —{" "}
                      {isPositionId(s.position)
                        ? POSITION_LABELS[s.position]
                        : s.position}
                    </span>
                    {(s.equipment || s.bag_placement || s.notes) && (
                      <span className="block text-neutral-600 dark:text-neutral-400">
                        {[s.equipment, s.bag_placement, s.notes]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <p
                  key={p.id}
                  className="text-xs text-neutral-500 dark:text-neutral-500"
                >
                  {p.name}: no saved strategy yet —{" "}
                  <Link
                    href="/props"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    add one
                  </Link>
                </p>
              ),
            )}
          </div>
        )}

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

      {stageRollup.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            By stage
          </h2>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800">
                <tr>
                  <th className="p-2">Stage</th>
                  <th className="p-2">Attempts</th>
                  <th className="p-2">Avg impacts</th>
                  <th className="p-2">Hit rate</th>
                  <th className="p-2">Last</th>
                </tr>
              </thead>
              <tbody>
                {stageRollup.map((row) => (
                  <tr
                    key={row.stageName}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="p-2">{row.stageName}</td>
                    <td className="p-2">{row.attempts}</td>
                    <td className="p-2">
                      {row.avgImpacts !== null
                        ? row.avgImpacts.toFixed(1)
                        : "—"}
                    </td>
                    <td className="p-2 font-semibold">
                      {row.hitRatePct !== null
                        ? `${row.hitRatePct.toFixed(0)}%`
                        : "—"}
                    </td>
                    <td className="p-2">{row.lastDate.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
