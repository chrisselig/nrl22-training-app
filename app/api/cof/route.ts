import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const documents = await sql`
    select id, month, source, imported_at
    from cof_documents
    order by month desc
  `;
  const stages = await sql`
    select id, cof_document_id, stage_number, stage_name, distance_yd,
           prop_id, prop_name_freeform, position, target_description,
           is_timed, par_time_seconds, round_count, (image is not null) as has_image,
           raw_stage_text
    from cof_stages
    order by cof_document_id, stage_number
  `;

  const stagesByDocId = new Map<number, unknown[]>();
  for (const stage of stages) {
    const docId = stage.cof_document_id as number;
    const list = stagesByDocId.get(docId) ?? [];
    list.push(stage);
    stagesByDocId.set(docId, list);
  }

  const result = documents.map((doc) => ({
    ...doc,
    stages: stagesByDocId.get(doc.id as number) ?? [],
  }));

  return NextResponse.json(result);
}
