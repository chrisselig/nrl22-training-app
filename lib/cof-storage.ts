import { sql } from "@/lib/db";
import { parseCofStages } from "@/lib/nrl22-cof-client";

/** Upserts one month's raw COF text and replaces its heuristically-parsed stages. */
export async function saveCofDocument(
  month: string,
  source: string,
  rawText: string,
) {
  const [doc] = await sql`
    insert into cof_documents (month, source, raw_text)
    values (${month}, ${source}, ${rawText})
    on conflict (month, source) do update set
      raw_text = excluded.raw_text,
      imported_at = now()
    returning id
  `;

  const stages = parseCofStages(rawText);
  await sql`delete from cof_stages where cof_document_id = ${doc.id}`;
  for (const stage of stages) {
    await sql`
      insert into cof_stages (
        cof_document_id, stage_number, stage_name, is_timed,
        par_time_seconds, raw_stage_text
      )
      values (
        ${doc.id}, ${stage.stageNumber}, ${stage.stageName}, ${stage.isTimed},
        ${stage.parTimeSeconds}, ${stage.rawStageText}
      )
    `;
  }

  return { documentId: doc.id as number, stageCount: stages.length };
}
