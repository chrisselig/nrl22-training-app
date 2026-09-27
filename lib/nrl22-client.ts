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
