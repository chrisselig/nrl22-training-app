import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { fetchNrl22Results, parseNrl22Row } from "@/lib/nrl22-client";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    search?: unknown;
    dateFrom?: unknown;
    dateTo?: unknown;
  };

  if (typeof body.search !== "string" || body.search.trim() === "") {
    return NextResponse.json({ error: "search is required" }, { status: 400 });
  }

  const dateFrom =
    typeof body.dateFrom === "string" ? body.dateFrom : "2024-01-01";
  const dateTo =
    typeof body.dateTo === "string"
      ? body.dateTo
      : new Date().toISOString().slice(0, 10);

  let rows;
  try {
    rows = await fetchNrl22Results({
      search: body.search.trim(),
      dateFrom,
      dateTo,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "nrl22.com request failed" },
      { status: 502 },
    );
  }

  // nrl22.com's search endpoint does a broad substring match across every
  // field (club name included, not just shooter name) — a search like "Buffalo
  // Target Shooters Association" returns every shooter at that club. Never
  // trust it to have actually filtered by name; re-check client-side.
  const needle = body.search.trim().toLowerCase();
  let matched = 0;
  let upserted = 0;
  for (const raw of rows) {
    const r = parseNrl22Row(raw);
    if (!r.matchDate) continue;
    if (r.shooterName?.trim().toLowerCase() !== needle) continue;
    matched++;
    const inserted = await sql`
      insert into results (
        source, match_date, season, match_type, club_name, shooter_name,
        class, division, shooter_id, raw_score, overall_finish,
        division_finish, class_finish, leaderboard_points
      )
      values (
        'nrl22', ${r.matchDate}, ${r.season}, ${r.matchType}, ${r.clubName}, ${r.shooterName},
        ${r.className}, ${r.division}, ${r.shooterId}, ${r.rawScore}, ${r.overallFinish},
        ${r.divisionFinish}, ${r.classFinish}, ${r.leaderboardPoints}
      )
      on conflict (source, match_date, match_type, shooter_id, division)
      do update set
        club_name = excluded.club_name,
        shooter_name = excluded.shooter_name,
        class = excluded.class,
        raw_score = excluded.raw_score,
        overall_finish = excluded.overall_finish,
        division_finish = excluded.division_finish,
        class_finish = excluded.class_finish,
        leaderboard_points = excluded.leaderboard_points,
        scraped_at = now()
      returning id
    `;
    if (inserted.length) upserted++;
  }

  return NextResponse.json({ fetched: matched, upserted });
}
