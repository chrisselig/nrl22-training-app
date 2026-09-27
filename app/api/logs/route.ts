import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isPositionId } from "@/lib/positions";

export async function GET(request: Request) {
  const matchDate = new URL(request.url).searchParams.get("match_date");

  const rows = matchDate
    ? await sql`
        select id, match_date, match_name, stage_name, prop_id,
               prop_name_freeform, position, impacts, shots_possible,
               time_seconds, comments, created_at
        from stage_logs
        where match_date = ${matchDate}
        order by created_at desc
      `
    : await sql`
        select id, match_date, match_name, stage_name, prop_id,
               prop_name_freeform, position, impacts, shots_possible,
               time_seconds, comments, created_at
        from stage_logs
        order by created_at desc
        limit 200
      `;

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    matchDate?: unknown;
    matchName?: unknown;
    stageName?: unknown;
    propId?: unknown;
    propNameFreeform?: unknown;
    position?: unknown;
    impacts?: unknown;
    shotsPossible?: unknown;
    timeSeconds?: unknown;
    comments?: unknown;
  };

  if (typeof body.matchDate !== "string" || body.matchDate.trim() === "") {
    return NextResponse.json(
      { error: "matchDate is required" },
      { status: 400 },
    );
  }
  if (
    body.position !== undefined &&
    body.position !== null &&
    !isPositionId(body.position)
  ) {
    return NextResponse.json({ error: "invalid position" }, { status: 400 });
  }

  const matchName = typeof body.matchName === "string" ? body.matchName : null;
  const stageName = typeof body.stageName === "string" ? body.stageName : null;
  const propId =
    Number.isInteger(Number(body.propId)) &&
    body.propId !== undefined &&
    body.propId !== null
      ? Number(body.propId)
      : null;
  const propNameFreeform =
    typeof body.propNameFreeform === "string" ? body.propNameFreeform : null;
  const position = isPositionId(body.position) ? body.position : null;
  const impacts = typeof body.impacts === "number" ? body.impacts : null;
  const shotsPossible =
    typeof body.shotsPossible === "number" ? body.shotsPossible : null;
  const timeSeconds =
    typeof body.timeSeconds === "number" ? body.timeSeconds : null;
  const comments = typeof body.comments === "string" ? body.comments : null;

  const [log] = await sql`
    insert into stage_logs (
      match_date, match_name, stage_name, prop_id, prop_name_freeform,
      position, impacts, shots_possible, time_seconds, comments
    )
    values (
      ${body.matchDate}, ${matchName}, ${stageName}, ${propId}, ${propNameFreeform},
      ${position}, ${impacts}, ${shotsPossible}, ${timeSeconds}, ${comments}
    )
    returning id, match_date, match_name, stage_name, prop_id,
              prop_name_freeform, position, impacts, shots_possible,
              time_seconds, comments, created_at
  `;

  return NextResponse.json(log, { status: 201 });
}
