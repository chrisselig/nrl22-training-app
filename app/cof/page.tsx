"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { PageHeader } from "@/components/PageHeader";

interface CofStage {
  id: number;
  cof_document_id: number;
  stage_number: number | null;
  stage_name: string | null;
  distance_yd: string | null;
  prop_id: number | null;
  prop_name_freeform: string | null;
  position: string | null;
  target_description: string | null;
  is_timed: boolean;
  par_time_seconds: string | null;
  round_count: number | null;
  has_image: boolean;
  raw_stage_text: string | null;
}

interface CofDocument {
  id: number;
  month: string;
  source: string;
  imported_at: string;
  stages: CofStage[];
}

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass =
  "block text-xs font-medium text-neutral-600 dark:text-neutral-400";

class AuthRequiredError extends Error {}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function nextMonth(month: string): string {
  const [year, mo] = month.split("-").map(Number);
  const d = new Date(year, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function CofPage() {
  const [documents, setDocuments] = useState<CofDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [month, setMonth] = useState(currentMonth());
  const [pastedText, setPastedText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toggledStages, setToggledStages] = useState<Set<number>>(new Set());
  const [focusMonth, setFocusMonth] = useState<string | null>(null);

  function toggleStage(stageId: number) {
    setToggledStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  }
  const retryRef = useRef<() => void>(() => {});

  async function reload() {
    setError(null);
    try {
      const res = await fetch("/api/cof");
      if (!res.ok) throw new Error("Could not load COF archive");
      setDocuments(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load COF archive");
    }
  }

  const hasExplicitMonth = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    const m = new URLSearchParams(window.location.search).get("month");
    if (m) {
      hasExplicitMonth.current = true;
      setMonth(m);
      setFocusMonth(m);
    }
  }, []);

  useEffect(() => {
    if (hasExplicitMonth.current || !documents || documents.length === 0) {
      return;
    }
    // Default the import target to the month after the latest archived one,
    // instead of the real calendar month, so it lines up with what's below.
    setMonth(nextMonth(documents[0].month));
  }, [documents]);

  const baseExpandedStages = useMemo(() => {
    const doc = documents?.find((d) => d.month === focusMonth);
    return new Set(doc?.stages.map((s) => s.id) ?? []);
  }, [focusMonth, documents]);

  useEffect(() => {
    if (!focusMonth || !documents) return;
    document
      .getElementById(`cof-${focusMonth}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusMonth, documents]);

  async function runImport(
    path: string,
    body: Record<string, unknown>,
    retry: () => void,
  ) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) throw new AuthRequiredError();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Import failed",
        );
      }
      setNeedsLogin(false);
      setShowPaste(false);
      setPastedText("");
      await reload();
    } catch (e) {
      if (e instanceof AuthRequiredError) {
        setNeedsLogin(true);
        retryRef.current = retry;
      } else {
        setError(e instanceof Error ? e.message : "Import failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAutoImport() {
    await runImport(
      "/api/cof/import",
      { month },
      () => void handleAutoImport(),
    );
  }

  async function handlePasteImport() {
    if (!pastedText.trim()) {
      setError("Paste the COF text first");
      return;
    }
    await runImport(
      "/api/cof/paste",
      { month, rawText: pastedText },
      () => void handlePasteImport(),
    );
  }

  async function updateStage(stageId: number, patch: Record<string, unknown>) {
    const res = await fetch(`/api/cof/stages/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) await reload();
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 lg:p-6">
      <PageHeader eyebrow="Archive" title="Course of Fire">
        Import nrl22.com&apos;s monthly COF. Stage number/name/time are parsed
        automatically; prop, position, and distance are yours to fill in per
        stage — the COF&apos;s prose isn&apos;t reliable enough to guess those
        from (a stage titled &quot;South Tower&quot; can turn out to use a tank
        trap).
      </PageHeader>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {needsLogin && (
        <LoginForm
          onSuccess={() => {
            setNeedsLogin(false);
            retryRef.current();
          }}
        />
      )}

      <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div>
          <label className={labelClass} htmlFor="month">
            Month
          </label>
          <input
            id="month"
            className={inputClass}
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleAutoImport()}
            disabled={busy}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {busy ? "Importing…" : "Import automatically"}
          </button>
          <button
            type="button"
            onClick={() => setShowPaste((v) => !v)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Paste manually
          </button>
        </div>
        {showPaste && (
          <div className="space-y-2">
            <textarea
              className={`${inputClass} h-40`}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the COF PDF's text here"
            />
            <button
              type="button"
              onClick={() => void handlePasteImport()}
              disabled={busy}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save pasted COF"}
            </button>
          </div>
        )}
      </div>

      {documents === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No months imported yet — pick a month above and import.
        </p>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              id={`cof-${doc.month}`}
              className={`rounded-lg border ${
                focusMonth === doc.month
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              <div className="border-b border-neutral-200 bg-neutral-100 p-2 text-sm font-medium dark:border-neutral-800 dark:bg-neutral-800">
                {doc.month}
              </div>
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {doc.stages.map((stage) => {
                  const isExpanded =
                    baseExpandedStages.has(stage.id) !==
                    toggledStages.has(stage.id);
                  return (
                    <div key={stage.id} className="space-y-2 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {stage.stage_number}. {stage.stage_name}
                          {stage.is_timed && stage.par_time_seconds
                            ? ` — ${stage.par_time_seconds}s`
                            : ""}
                          {stage.round_count
                            ? ` · ${stage.round_count} rds`
                            : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleStage(stage.id)}
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {isExpanded ? "Hide" : "Show"} full text
                        </button>
                      </div>
                      {isExpanded &&
                        (stage.has_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/cof/stages/${stage.id}/image`}
                            alt={`Stage ${stage.stage_number} diagram`}
                            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800"
                          />
                        ) : (
                          <pre className="max-h-48 overflow-y-auto rounded-md bg-neutral-100 p-2 text-xs whitespace-pre-wrap dark:bg-neutral-800">
                            {stage.raw_stage_text}
                          </pre>
                        ))}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Prop</label>
                          <input
                            className={inputClass}
                            defaultValue={stage.prop_name_freeform ?? ""}
                            onBlur={(e) =>
                              void updateStage(stage.id, {
                                propNameFreeform: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Position</label>
                          <input
                            className={inputClass}
                            defaultValue={stage.position ?? ""}
                            onBlur={(e) =>
                              void updateStage(stage.id, {
                                position: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Distance (yd)</label>
                          <input
                            className={inputClass}
                            type="number"
                            defaultValue={stage.distance_yd ?? ""}
                            onBlur={(e) =>
                              void updateStage(stage.id, {
                                distanceYd: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Target</label>
                          <input
                            className={inputClass}
                            defaultValue={stage.target_description ?? ""}
                            onBlur={(e) =>
                              void updateStage(stage.id, {
                                targetDescription: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
