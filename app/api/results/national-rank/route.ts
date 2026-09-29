import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  countLeaderboard,
  fetchCurrentNrl22Season,
  findLeaderboardEntry,
} from "@/lib/nrl22-client";

// Live/on-demand only, like club-rank — nrl22.com's season leaderboard is
// peer reference data, not something we persist alongside the user's own
// tracked `results` rows.
export async function GET() {
  const [latest] = await sql`
    select shooter_name from results order by match_date desc limit 1
  `;
  if (!latest) {
    return NextResponse.json(
      { error: "No tracked results yet" },
      { status: 404 },
    );
  }
  const shooterName = latest.shooter_name as string;

  let season: string;
  try {
    season = await fetchCurrentNrl22Season();
  } catch {
    return NextResponse.json(
      { error: "Could not reach nrl22.com" },
      { status: 502 },
    );
  }

  const usOverall = await findLeaderboardEntry(season, "NRL22", shooterName);
  if (!usOverall) {
    return NextResponse.json({
      season,
      division: null,
      us: null,
      country: null,
    });
  }
  const [usDivision, usOverallOf, usDivisionOf, intlOverall] =
    await Promise.all([
      findLeaderboardEntry(season, "NRL22", shooterName, {
        division: usOverall.division ?? undefined,
      }),
      countLeaderboard(season, "NRL22"),
      countLeaderboard(season, "NRL22", {
        division: usOverall.division ?? undefined,
      }),
      findLeaderboardEntry(season, "International", shooterName),
    ]);

  const countryCode = intlOverall?.countryCode ?? null;
  let country = null;
  if (countryCode) {
    const [
      countryOverall,
      countryDivision,
      countryOverallOf,
      countryDivisionOf,
    ] = await Promise.all([
      findLeaderboardEntry(season, "International", shooterName, {
        country: countryCode,
      }),
      findLeaderboardEntry(season, "International", shooterName, {
        country: countryCode,
        division: usOverall.division ?? undefined,
      }),
      countLeaderboard(season, "International", { country: countryCode }),
      countLeaderboard(season, "International", {
        country: countryCode,
        division: usOverall.division ?? undefined,
      }),
    ]);
    country = {
      code: countryCode,
      label: intlOverall?.country ?? countryCode,
      overall: { rank: countryOverall?.rank ?? null, of: countryOverallOf },
      division: { rank: countryDivision?.rank ?? null, of: countryDivisionOf },
    };
  }

  return NextResponse.json({
    season,
    division: usOverall.division,
    us: {
      overall: { rank: usOverall.rank, of: usOverallOf },
      division: { rank: usDivision?.rank ?? null, of: usDivisionOf },
    },
    country,
  });
}
