const NRL22_RESULTS_URL = "https://nrl22.com/wp-json/nrl22/v1/match-results";
const PAGE_SIZE = 100;

interface Nrl22ResultRow {
  match_date: string;
  season: string | null;
  match_type: string | null;
  club_name: string | null;
  shooter_name: string | null;
  class: string | null;
  division: string | null;
  shooter_id: string | null;
  raw_score: string | null;
  overall_finish: string | null;
  division_finish: string | null;
  class_finish: string | null;
  leaderboard_points: string | null;
}

interface Nrl22ApiResponse {
  recordsFiltered: number;
  data: Nrl22ResultRow[];
}

/** Public DataTables-backed REST API behind nrl22.com's Match Results page — no login required. */
export async function fetchNrl22Results(params: {
  search: string;
  dateFrom: string;
  dateTo: string;
}): Promise<Nrl22ResultRow[]> {
  const rows: Nrl22ResultRow[] = [];
  let start = 0;
  for (;;) {
    const url = new URL(NRL22_RESULTS_URL);
    url.searchParams.set("draw", "1");
    url.searchParams.set("start", String(start));
    url.searchParams.set("length", String(PAGE_SIZE));
    url.searchParams.set("search", params.search);
    url.searchParams.set("order_column", "0");
    url.searchParams.set("order_dir", "desc");
    url.searchParams.set("date_from", params.dateFrom);
    url.searchParams.set("date_to", params.dateTo);

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (nrl22-training-app)" },
    });
    if (!res.ok) {
      throw new Error(`nrl22.com results request failed: ${res.status}`);
    }
    const body = (await res.json()) as Nrl22ApiResponse;
    rows.push(...body.data);
    start += PAGE_SIZE;
    if (body.data.length === 0 || start >= body.recordsFiltered) break;
  }
  return rows;
}

function toNumberOrNull(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseNrl22Row(row: Nrl22ResultRow) {
  return {
    matchDate: row.match_date,
    season: row.season,
    matchType: row.match_type,
    clubName: row.club_name,
    shooterName: row.shooter_name,
    className: row.class,
    division: row.division,
    shooterId: row.shooter_id,
    rawScore: toNumberOrNull(row.raw_score),
    overallFinish: toNumberOrNull(row.overall_finish),
    divisionFinish: toNumberOrNull(row.division_finish),
    classFinish: toNumberOrNull(row.class_finish),
    leaderboardPoints: toNumberOrNull(row.leaderboard_points),
  };
}

const NRL22_LEADERBOARD_URL = "https://nrl22.com/wp-json/nrl22/v1/leaderboard";

export type Nrl22LeaderboardType = "NRL22" | "International";

interface Nrl22LeaderboardRow {
  display_rank: number;
  name: string | null;
  division: string | null;
  country_code?: string | null;
  country?: string | null;
}

interface Nrl22LeaderboardResponse {
  recordsFiltered: number;
  data: Nrl22LeaderboardRow[];
}

async function fetchNrl22Leaderboard(params: {
  season: string;
  type: Nrl22LeaderboardType;
  division?: string;
  country?: string;
  search?: string;
}): Promise<Nrl22LeaderboardResponse> {
  const url = new URL(NRL22_LEADERBOARD_URL);
  url.searchParams.set("season", params.season);
  url.searchParams.set("type", params.type);
  url.searchParams.set("start", "0");
  url.searchParams.set("length", "50");
  if (params.division) url.searchParams.set("division", params.division);
  if (params.country) url.searchParams.set("country", params.country);
  if (params.search) url.searchParams.set("search", params.search);

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (nrl22-training-app)" },
  });
  if (!res.ok) {
    throw new Error(`nrl22.com leaderboard request failed: ${res.status}`);
  }
  return (await res.json()) as Nrl22LeaderboardResponse;
}

/**
 * The leaderboard's "season" slug isn't the calendar year (e.g. season
 * "2027" is already active in late 2026), so read it live off the
 * leaderboard nav link rather than hardcoding a value that goes stale.
 */
export async function fetchCurrentNrl22Season(): Promise<string> {
  const res = await fetch("https://nrl22.com/stats/", {
    headers: { "User-Agent": "Mozilla/5.0 (nrl22-training-app)" },
  });
  if (!res.ok) {
    throw new Error(`nrl22.com stats request failed: ${res.status}`);
  }
  const html = await res.text();
  const match = html.match(/(\d{4})-nrl22-leaderboard/);
  if (!match) throw new Error("Could not determine current nrl22.com season");
  return match[1];
}

/**
 * The API recomputes `display_rank` scoped to whatever division/country
 * filters are applied, so the same shooter gets a different rank per call —
 * this fetches the row matching `shooterName` under one specific filter set.
 */
export async function findLeaderboardEntry(
  season: string,
  type: Nrl22LeaderboardType,
  shooterName: string,
  extra: { division?: string; country?: string } = {},
) {
  const res = await fetchNrl22Leaderboard({
    season,
    type,
    search: shooterName,
    ...extra,
  });
  const row = res.data.find(
    (r) => r.name?.trim().toLowerCase() === shooterName.trim().toLowerCase(),
  );
  if (!row) return null;
  return {
    rank: row.display_rank,
    division: row.division,
    countryCode: row.country_code ?? null,
    country: row.country ?? null,
  };
}

/** Field size for a given filter set — `recordsFiltered` with no search text. */
export async function countLeaderboard(
  season: string,
  type: Nrl22LeaderboardType,
  extra: { division?: string; country?: string } = {},
): Promise<number> {
  const res = await fetchNrl22Leaderboard({ season, type, ...extra });
  return res.recordsFiltered;
}
