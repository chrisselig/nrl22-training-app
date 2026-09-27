import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const stageId = Number(id);
  if (!Number.isInteger(stageId)) {
    return NextResponse.json({ error: "Invalid stage id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    propId?: unknown;
    propNameFreeform?: unknown;
    position?: unknown;
    distanceYd?: unknown;
    targetDescription?: unknown;
  };

  const propId =
    typeof body.propId === "number" && Number.isInteger(body.propId)
      ? body.propId
      : null;
  const propNameFreeform =
    typeof body.propNameFreeform === "string" ? body.propNameFreeform : null;
  const position = typeof body.position === "string" ? body.position : null;
  const distanceYd =
    typeof body.distanceYd === "number" && Number.isFinite(body.distanceYd)
      ? body.distanceYd
      : null;
  const targetDescription =
    typeof body.targetDescription === "string" ? body.targetDescription : null;

  const [stage] = await sql`
    update cof_stages
    set prop_id = ${propId},
        prop_name_freeform = ${propNameFreeform},
        position = ${position},
        distance_yd = ${distanceYd},
        target_description = ${targetDescription}
    where id = ${stageId}
    returning id, cof_document_id, stage_number, stage_name, distance_yd,
              prop_id, prop_name_freeform, position, target_description,
              is_timed, par_time_seconds, raw_stage_text
  `;

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }
  return NextResponse.json(stage);
}
