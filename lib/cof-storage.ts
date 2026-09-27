import { sql } from "@/lib/db";
import { parseCofStages, renderCofPages } from "@/lib/nrl22-cof-client";

/**
 * Upserts one month's raw COF text and replaces its heuristically-parsed
 * stages. pdfBytes is optional — the manual-paste path only ever has text,
 * so stages saved that way simply have no rendered page image.
 */
export async function saveCofDocument(
  month: string,
  source: string,
  rawText: string,
  pdfBytes?: Buffer,
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
  const pageImages = pdfBytes
    ? await renderCofPages(pdfBytes, [
        ...new Set(stages.map((s) => s.pageNumber)),
      ])
    : new Map<number, Buffer>();

  await sql`delete from cof_stages where cof_document_id = ${doc.id}`;
  for (const stage of stages) {
    const image = pageImages.get(stage.pageNumber) ?? null;
    await sql`
      insert into cof_stages (
        cof_document_id, stage_number, stage_name, is_timed,
        par_time_seconds, round_count, image, image_mime, raw_stage_text
      )
      values (
        ${doc.id}, ${stage.stageNumber}, ${stage.stageName}, ${stage.isTimed},
        ${stage.parTimeSeconds}, ${stage.roundCount}, ${image},
        ${image ? "image/png" : null}, ${stage.rawStageText}
      )
    `;
  }

  return { documentId: doc.id as number, stageCount: stages.length };
}
