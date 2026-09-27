import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isPositionId } from "@/lib/positions";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    propId?: unknown;
    position?: unknown;
    equipment?: unknown;
    bagPlacement?: unknown;
    notes?: unknown;
  };

  const propId = Number(body.propId);
  if (!Number.isInteger(propId)) {
    return NextResponse.json({ error: "propId is required" }, { status: 400 });
  }
  if (!isPositionId(body.position)) {
    return NextResponse.json({ error: "invalid position" }, { status: 400 });
  }
  const equipment = typeof body.equipment === "string" ? body.equipment : null;
  const bagPlacement =
    typeof body.bagPlacement === "string" ? body.bagPlacement : null;
  const notes = typeof body.notes === "string" ? body.notes : null;

  const [strategy] = await sql`
    insert into strategies (prop_id, position, equipment, bag_placement, notes)
    values (${propId}, ${body.position}, ${equipment}, ${bagPlacement}, ${notes})
    on conflict (prop_id, position)
    do update set
      equipment = excluded.equipment,
      bag_placement = excluded.bag_placement,
      notes = excluded.notes,
      updated_at = now()
    returning id, prop_id, position, equipment, bag_placement, notes, created_at, updated_at
  `;

  return NextResponse.json(strategy, { status: 200 });
}
