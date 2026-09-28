import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { fetchNrl22Results, parseNrl22Row } from "@/lib/nrl22-client";

type Finish = "overallFinish" | "divisionFinish" | "classFinish";

function rankWithin(
  field: ReturnType<typeof parseNrl22Row>[],
  finishKey: Finish,
  shooterName: string,
) {
  const ranked = field
    .filter((r) => r[finishKey] !== null)
    .sort((a, b) => a[finishKey]! - b[finishKey]!);
  const idx = ranked.findIndex(
    (r) => r.shooterName?.trim().toLowerCase() === shooterName,
  );
  return idx === -1 ? null : { rank: idx + 1, of: ranked.length };
}

// For each of the user's own tracked results, re-rank them within just the
// subset of that same match's field that shot at their home club — pulled
// live from nrl22.com rather than stored, since this is peer reference data,
// not the user's own tracked results (see the scrape route's exact-name-only
// invariant on the `results` table).
export async function GET() {
  const mine = await sql`
    select id, match_date, match_type, club_name, division, class, shooter_name
    from results
    where club_name is not null
    order by match_date desc
  `;

  const output = [];
  for (const m of mine) {
    const shooterName = (m.shooter_name as string).trim().toLowerCase();
    const matchDate = (m.match_date as Date).toISOString().slice(0, 10);
    let rows;
    try {
      rows = await fetchNrl22Results({
        search: m.club_name as string,
        dateFrom: matchDate,
        dateTo: matchDate,
      });
    } catch {
      continue;
    }

    const field = rows
      .map(parseNrl22Row)
      .filter(
        (r) => r.matchType === m.match_type && r.clubName === m.club_name,
      );

    output.push({
      resultId: m.id as number,
      clubName: m.club_name as string,
      fieldSize: field.length,
      overall: rankWithin(field, "overallFinish", shooterName),
      division: m.division
        ? rankWithin(
            field.filter((r) => r.division === m.division),
            "divisionFinish",
            shooterName,
          )
        : null,
      class: m.class
        ? rankWithin(
            field.filter((r) => r.className === m.class),
            "classFinish",
            shooterName,
          )
        : null,
    });
  }

  return NextResponse.json(output);
}
