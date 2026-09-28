"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

interface ResultRow {
  id: number;
  source: string;
  match_date: string;
  season: string | null;
  match_type: string | null;
  club_name: string | null;
  shooter_name: string | null;
  class: string | null;
  division: string | null;
  raw_score: string | null;
  overall_finish: number | null;
  division_finish: number | null;
  class_finish: number | null;
  leaderboard_points: string | null;
}

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass =
  "block text-xs font-medium text-neutral-600 dark:text-neutral-400";

const SHOOTER_NAME_KEY = "nrl22-shooter-name";

class AuthRequiredError extends Error {}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [shooterName, setShooterName] = useState("");
  const [fetching, setFetching] = useState(false);
  const [lastFetchMsg, setLastFetchMsg] = useState<string | null>(null);

  async function reload() {
    setError(null);
    try {
      const res = await fetch("/api/results");
      if (!res.ok) throw new Error("Could not load results");
      setResults(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load results");
    }
  }

  useEffect(() => {
    // Mount-time fetch from the DB-backed API, plus loading the
    // locally-remembered shooter name used for the scrape search field.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    setShooterName(localStorage.getItem(SHOOTER_NAME_KEY) ?? "");
  }, []);

  function handleShooterNameChange(value: string) {
    setShooterName(value);
    localStorage.setItem(SHOOTER_NAME_KEY, value);
  }

  async function handleFetchLatest() {
    if (!shooterName.trim()) {
      setError("Enter your shooter name first");
      return;
    }
    setFetching(true);
    setError(null);
    setLastFetchMsg(null);
    try {
      const res = await fetch("/api/results/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search: shooterName.trim() }),
      });
      if (res.status === 401) throw new AuthRequiredError();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Fetch failed",
        );
      }
      const data = (await res.json()) as { fetched: number; upserted: number };
      setLastFetchMsg(
        `Found ${data.fetched} match result(s), saved ${data.upserted}.`,
      );
      setNeedsLogin(false);
      await reload();
    } catch (e) {
      if (e instanceof AuthRequiredError) {
        setNeedsLogin(true);
      } else {
        setError(e instanceof Error ? e.message : "Fetch failed");
      }
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 lg:p-6">
      <header>
        <h1 className="text-xl font-semibold">Match Results</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Pulled from nrl22.com&apos;s public match-results database.
        </p>
      </header>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {needsLogin && <LoginForm onSuccess={() => void handleFetchLatest()} />}

      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div>
          <label className={labelClass} htmlFor="shooterName">
            Your shooter name (as it appears on nrl22.com)
          </label>
          <input
            id="shooterName"
            className={inputClass}
            value={shooterName}
            onChange={(e) => handleShooterNameChange(e.target.value)}
            placeholder="e.g. Chris Selig"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleFetchLatest()}
          disabled={fetching}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {fetching ? "Fetching…" : "Fetch latest"}
        </button>
        {lastFetchMsg && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {lastFetchMsg}
          </p>
        )}
      </div>

      {results === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No results yet — enter your name above and fetch.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Type</th>
                <th className="p-2">Club</th>
                <th className="p-2">Class</th>
                <th className="p-2">Division</th>
                <th className="p-2">Score</th>
                <th className="p-2">Overall</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="p-2">
                    <Link
                      href={`/cof?month=${r.match_date.slice(0, 7)}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {r.match_date}
                    </Link>
                  </td>
                  <td className="p-2">{r.match_type ?? "—"}</td>
                  <td className="p-2">{r.club_name ?? "—"}</td>
                  <td className="p-2">{r.class ?? "—"}</td>
                  <td className="p-2">{r.division ?? "—"}</td>
                  <td className="p-2">{r.raw_score ?? "—"}</td>
                  <td className="p-2">{r.overall_finish ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
