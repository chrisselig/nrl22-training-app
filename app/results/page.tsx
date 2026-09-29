"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { PageHeader } from "@/components/PageHeader";

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
const statCardClass =
  "rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900";
const statValueClass =
  "text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50";
const statLabelClass =
  "text-xs font-medium text-neutral-500 dark:text-neutral-400";

const SHOOTER_NAME_KEY = "nrl22-shooter-name";

interface ClubRankEntry {
  resultId: number;
  clubName: string;
  fieldSize: number;
  overall: { rank: number; of: number } | null;
  division: { rank: number; of: number } | null;
  class: { rank: number; of: number } | null;
}

interface NationalRank {
  season: string;
  division: string | null;
  us: {
    overall: { rank: number; of: number };
    division: { rank: number | null; of: number };
  } | null;
  country: {
    code: string;
    label: string;
    overall: { rank: number | null; of: number };
    division: { rank: number | null; of: number };
  } | null;
}

class AuthRequiredError extends Error {}

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildNarrative(sorted: ResultRow[]): string {
  if (sorted.length === 0) return "";
  const latest = sorted[sorted.length - 1];
  const rank =
    latest.overall_finish !== null ? ordinal(latest.overall_finish) : null;

  if (sorted.length === 1) {
    let text = rank
      ? `One match on the board. On ${formatDate(latest.match_date)} at ${latest.club_name ?? "your last match"}, you finished ${rank} overall`
      : `One match on the board, at ${latest.club_name ?? "your last match"} on ${formatDate(latest.match_date)}`;
    if (latest.division_finish !== null && latest.division) {
      text += ` (${ordinal(latest.division_finish)} in ${latest.division})`;
    }
    if (latest.raw_score) text += `, scoring ${latest.raw_score}`;
    if (latest.leaderboard_points) {
      text += ` for ${latest.leaderboard_points} leaderboard points`;
    }
    return `${text}.`;
  }

  const ranked = sorted.filter((r) => r.overall_finish !== null);
  const best = ranked.reduce<ResultRow | null>(
    (a, b) => (!a || b.overall_finish! < a.overall_finish! ? b : a),
    null,
  );
  const first = ranked[0];
  const trendDelta =
    first && latest.overall_finish !== null
      ? first.overall_finish! - latest.overall_finish!
      : null;

  let text = `${sorted.length} matches tracked since ${formatDate(sorted[0].match_date)}.`;
  if (best?.overall_finish !== null && best) {
    text += ` Best overall finish: ${ordinal(best.overall_finish!)} at ${best.club_name ?? "an NRL22 match"}.`;
  }
  if (trendDelta !== null && trendDelta !== 0) {
    const spots = Math.abs(trendDelta);
    const spotWord = spots === 1 ? "spot" : "spots";
    text +=
      trendDelta > 0
        ? ` Climbing — up ${spots} ${spotWord} since your first tracked match.`
        : ` Down ${spots} ${spotWord} since your first tracked match.`;
  }
  return text;
}

function normalizedLine(
  values: (number | null)[],
  n: number,
  width: number,
  height: number,
  padX: number,
  padY: number,
  invert: boolean,
) {
  const defined = values.filter((v): v is number => v !== null);
  if (defined.length === 0)
    return { points: [] as { x: number; y: number }[], min: 0, max: 0 };
  const min = Math.min(...defined);
  const max = Math.max(...defined);
  const span = Math.max(max - min, 1);
  const points = values.flatMap((v, i) => {
    if (v === null) return [];
    const frac = (v - min) / span;
    const y = padY + (invert ? frac : 1 - frac) * (height - padY * 2);
    const x = padX + (n === 1 ? 0 : (i / (n - 1)) * (width - padX * 2));
    return [{ x, y }];
  });
  return { points, min, max };
}

function linePath(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

function TrendChart({ sorted }: { sorted: ResultRow[] }) {
  if (sorted.length < 2) {
    return (
      <div className={`${statCardClass} flex items-center gap-3`}>
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 shrink-0 text-neutral-300 dark:text-neutral-700"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 17l5-5 4 4 8-9"
          />
        </svg>
        <p className={statLabelClass}>
          Trend line unlocks once you have a second tracked match.
        </p>
      </div>
    );
  }

  const width = 320;
  const height = 110;
  const padX = 8;
  const padY = 14;
  const n = sorted.length;

  const scoreValues = sorted.map((r) =>
    r.raw_score !== null ? Number(r.raw_score) : null,
  );
  const finishValues = sorted.map((r) => r.overall_finish);

  // Higher score is better (plot near top); lower finish number is better
  // (also plot near top) — each series normalized against its own range so
  // wildly different scales (score vs. finish position) share one chart.
  const score = normalizedLine(
    scoreValues,
    n,
    width,
    height,
    padX,
    padY,
    false,
  );
  const finish = normalizedLine(
    finishValues,
    n,
    width,
    height,
    padX,
    padY,
    true,
  );

  const lastScore = [...scoreValues].reverse().find((v) => v !== null);
  const lastFinish = [...finishValues].reverse().find((v) => v !== null);

  return (
    <div className={statCardClass}>
      <div className="mb-2 flex items-center justify-between">
        <p className={statLabelClass}>Score &amp; overall finish, by match</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
            <span className="h-0.5 w-3 rounded-full bg-blue-600" /> Score
          </span>
          <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
            <span className="h-0.5 w-3 rounded-full bg-amber-500" /> Finish
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {finish.points.length > 0 && (
          <path
            d={linePath(finish.points)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {score.points.length > 0 && (
          <path
            d={linePath(score.points)}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {finish.points.map((p, i) => (
          <circle key={`f${i}`} cx={p.x} cy={p.y} r={2.5} fill="#f59e0b" />
        ))}
        {score.points.map((p, i) => (
          <circle key={`s${i}`} cx={p.x} cy={p.y} r={2.5} fill="#2563eb" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          {lastScore !== undefined ? `Latest score: ${lastScore}` : ""}
        </span>
        <span>
          {lastFinish !== undefined
            ? `Latest finish: ${ordinal(lastFinish)}`
            : ""}
        </span>
      </div>
    </div>
  );
}

function DivisionTarget({
  date,
  division,
  rank,
  of,
}: {
  date: string;
  division: string | null;
  rank: number;
  of: number;
}) {
  const size = 104;
  const center = size / 2;
  const maxR = center - 8;
  const rings = 4;
  // rank 1 = dead center (percentile 1), rank === of = outer ring (percentile 0).
  const percentile = of > 1 ? 1 - (rank - 1) / (of - 1) : 1;
  const dotR = (1 - percentile) * maxR;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: rings }).map((_, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={maxR * ((i + 1) / rings)}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            className="text-neutral-300 dark:text-neutral-700"
          />
        ))}
        <circle
          cx={center}
          cy={center}
          r={2}
          fill="currentColor"
          className="text-neutral-400 dark:text-neutral-600"
        />
        <circle
          cx={center}
          cy={center - dotR}
          r={5}
          fill="#2563eb"
          stroke="white"
          strokeWidth={1.5}
        />
      </svg>
      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
        {ordinal(rank)} of {of}
      </p>
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
        {division ?? "Division"} · {formatDate(date)}
      </p>
    </div>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [shooterName, setShooterName] = useState("");
  const [fetching, setFetching] = useState(false);
  const [lastFetchMsg, setLastFetchMsg] = useState<string | null>(null);
  const [clubRanks, setClubRanks] = useState<Record<number, ClubRankEntry>>({});
  const [clubRankLoading, setClubRankLoading] = useState(false);
  const [nationalRank, setNationalRank] = useState<NationalRank | null>(null);
  const [nationalRankLoading, setNationalRankLoading] = useState(false);
  const retryRef = useRef<() => void>(() => {});

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

  async function loadClubRanks() {
    setClubRankLoading(true);
    try {
      const res = await fetch("/api/results/club-rank");
      if (!res.ok) return;
      const data = (await res.json()) as ClubRankEntry[];
      setClubRanks(Object.fromEntries(data.map((e) => [e.resultId, e])));
    } finally {
      setClubRankLoading(false);
    }
  }

  async function loadNationalRank() {
    setNationalRankLoading(true);
    try {
      const res = await fetch("/api/results/national-rank");
      if (!res.ok) return;
      setNationalRank((await res.json()) as NationalRank);
    } finally {
      setNationalRankLoading(false);
    }
  }

  useEffect(() => {
    // Mount-time fetch from the DB-backed API, plus loading the
    // locally-remembered shooter name used for the scrape search field.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    void loadClubRanks();
    void loadNationalRank();
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
      void loadClubRanks();
      void loadNationalRank();
    } catch (e) {
      if (e instanceof AuthRequiredError) {
        retryRef.current = () => void handleFetchLatest();
        setNeedsLogin(true);
      } else {
        setError(e instanceof Error ? e.message : "Fetch failed");
      }
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this match result?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/results/${id}`, { method: "DELETE" });
      if (res.status === 401) throw new AuthRequiredError();
      if (!res.ok) throw new Error("Delete failed");
      setNeedsLogin(false);
      await reload();
      void loadClubRanks();
    } catch (e) {
      if (e instanceof AuthRequiredError) {
        retryRef.current = () => void handleDelete(id);
        setNeedsLogin(true);
      } else {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    }
  }

  const sorted = useMemo(
    () =>
      results
        ? [...results].sort((a, b) => a.match_date.localeCompare(b.match_date))
        : [],
    [results],
  );

  const narrative = useMemo(() => buildNarrative(sorted), [sorted]);

  const stats = useMemo(() => {
    if (sorted.length === 0) return null;
    const ranked = sorted.filter((r) => r.overall_finish !== null);
    const bestOverall = ranked.length
      ? Math.min(...ranked.map((r) => r.overall_finish!))
      : null;
    const divisionRanked = sorted.filter((r) => r.division_finish !== null);
    const bestDivision = divisionRanked.length
      ? Math.min(...divisionRanked.map((r) => r.division_finish!))
      : null;
    const totalPoints = sorted.reduce(
      (sum, r) =>
        sum + (r.leaderboard_points ? Number(r.leaderboard_points) : 0),
      0,
    );
    return {
      matchCount: sorted.length,
      bestOverall,
      bestDivision,
      totalPoints,
    };
  }, [sorted]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 lg:p-6">
      <PageHeader eyebrow="Season report" title="Match Results">
        Pulled from nrl22.com&apos;s public match-results database.
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

      {narrative && (
        <p className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-3 text-sm leading-relaxed text-neutral-800 dark:bg-blue-950/30 dark:text-neutral-100">
          {narrative}
        </p>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className={statCardClass}>
            <p className={statValueClass}>{stats.matchCount}</p>
            <p className={statLabelClass}>Matches tracked</p>
          </div>
          <div className={statCardClass}>
            <p className={statValueClass}>
              {stats.bestOverall !== null ? ordinal(stats.bestOverall) : "—"}
            </p>
            <p className={statLabelClass}>Best overall finish</p>
          </div>
          <div className={statCardClass}>
            <p className={statValueClass}>
              {stats.bestDivision !== null ? ordinal(stats.bestDivision) : "—"}
            </p>
            <p className={statLabelClass}>Best division finish</p>
          </div>
          <div className={statCardClass}>
            <p className={statValueClass}>{stats.totalPoints.toFixed(1)}</p>
            <p className={statLabelClass}>Total leaderboard points</p>
          </div>
        </div>
      )}

      {sorted.length > 0 && <TrendChart sorted={sorted} />}

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
        <div className="space-y-2">
          {[...sorted].reverse().map((r) => (
            <div
              key={r.id}
              className="space-y-2 rounded-lg border border-l-4 border-neutral-200 border-l-blue-600 bg-white p-3 dark:border-neutral-800 dark:border-l-blue-500 dark:bg-neutral-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Link
                  href={`/cof?month=${r.match_date.slice(0, 7)}`}
                  className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  {formatDate(r.match_date)}
                </Link>
                <span className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {r.club_name ?? "—"}
                  {r.match_type ? ` · ${r.match_type}` : ""}
                  <button
                    type="button"
                    onClick={() => void handleDelete(r.id)}
                    className="text-neutral-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                  >
                    Remove
                  </button>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {r.overall_finish !== null
                    ? `${ordinal(r.overall_finish)} overall`
                    : "Overall —"}
                </span>
                {r.division && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {r.division_finish !== null
                      ? `${ordinal(r.division_finish)} ${r.division}`
                      : r.division}
                  </span>
                )}
                {r.class && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {r.class_finish !== null
                      ? `${ordinal(r.class_finish)} ${r.class}`
                      : r.class}
                  </span>
                )}
                {r.raw_score && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    Score {r.raw_score}
                  </span>
                )}
                {r.leaderboard_points && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {r.leaderboard_points} pts
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(nationalRank || nationalRankLoading) && (
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            National &amp; international standing
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Your live season rank on nrl22.com&apos;s leaderboards
            {nationalRank?.season ? ` (${nationalRank.season} season)` : ""}.
          </p>
          {!nationalRank ? (
            <p className="text-sm text-neutral-500">Computing…</p>
          ) : !nationalRank.us ? (
            <p className="text-sm text-neutral-500">
              Not found on the leaderboard yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className={statCardClass}>
                <p className={statValueClass}>
                  {ordinal(nationalRank.us.overall.rank)}
                </p>
                <p className={statLabelClass}>
                  US overall (of {nationalRank.us.overall.of})
                </p>
              </div>
              <div className={statCardClass}>
                <p className={statValueClass}>
                  {nationalRank.us.division.rank !== null
                    ? ordinal(nationalRank.us.division.rank)
                    : "—"}
                </p>
                <p className={statLabelClass}>
                  US {nationalRank.division ?? "division"} (of{" "}
                  {nationalRank.us.division.of})
                </p>
              </div>
              {nationalRank.country && (
                <>
                  <div className={statCardClass}>
                    <p className={statValueClass}>
                      {nationalRank.country.overall.rank !== null
                        ? ordinal(nationalRank.country.overall.rank)
                        : "—"}
                    </p>
                    <p className={statLabelClass}>
                      {nationalRank.country.label} overall (of{" "}
                      {nationalRank.country.overall.of})
                    </p>
                  </div>
                  <div className={statCardClass}>
                    <p className={statValueClass}>
                      {nationalRank.country.division.rank !== null
                        ? ordinal(nationalRank.country.division.rank)
                        : "—"}
                    </p>
                    <p className={statLabelClass}>
                      {nationalRank.country.label}{" "}
                      {nationalRank.division ?? "division"} (of{" "}
                      {nationalRank.country.division.of})
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            Home club standing
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            How you rank against everyone else who shot the same match at your
            home club, pulled live from nrl22.com (not stored).
          </p>
          {clubRankLoading && Object.keys(clubRanks).length === 0 ? (
            <p className="text-sm text-neutral-500">Computing…</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                {[...sorted].reverse().map((r) => {
                  const cr = clubRanks[r.id];
                  if (!cr?.division) return null;
                  return (
                    <DivisionTarget
                      key={r.id}
                      date={r.match_date}
                      division={r.division}
                      rank={cr.division.rank}
                      of={cr.division.of}
                    />
                  );
                })}
              </div>
              <div className="space-y-1">
                {[...sorted].reverse().map((r) => {
                  const cr = clubRanks[r.id];
                  if (!cr?.overall) return null;
                  return (
                    <p key={r.id} className="text-sm">
                      <span className="font-medium">
                        {formatDate(r.match_date)}
                      </span>
                      {": "}
                      {ordinal(cr.overall.rank)} of {cr.overall.of} at{" "}
                      {cr.clubName}
                      {cr.class &&
                        ` · ${ordinal(cr.class.rank)} of ${cr.class.of} in ${r.class}`}
                    </p>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
