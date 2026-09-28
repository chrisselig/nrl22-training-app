import { Pool } from "@neondatabase/serverless";
import {
  fetchCofPdf,
  listAvailableMonths,
  parseCofStages,
  renderCofPages,
} from "../lib/nrl22-cof-client.ts";

// Set to reprocess months already in cof_documents (e.g. after adding a new
// parsed field) instead of skipping them — still re-hits nrl22.com for each,
// so it's opt-in rather than the default.
const FORCE = process.env.COF_BACKFILL_FORCE === "1";

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.nrl_training_DATABASE_URL;
const username = process.env.NRL22_USERNAME;
const password = process.env.NRL22_PASSWORD;
if (!databaseUrl || !username || !password) {
  console.error(
    "DATABASE_URL / NRL22_USERNAME / NRL22_PASSWORD must all be set",
  );
  process.exit(1);
}

// Ask nrl22.com's own downloads listing which months exist, rather than
// computing a range up to "today" — NRL22 sometimes publishes next month's
// COF before the calendar turns over (e.g. Oct 2026 went up in Sept 2026),
// so a wall-clock-bounded range silently misses it.
const months = await listAvailableMonths(username, password);

const pool = new Pool({ connectionString: databaseUrl });
try {
  const { rows: existing } = await pool.query(
    "select month from cof_documents where source = 'nrl22'",
  );
  const alreadyImported = new Set(existing.map((r) => r.month));

  for (const month of months) {
    if (alreadyImported.has(month) && !FORCE) {
      console.log(`skipped (already imported): ${month}`);
      continue;
    }

    try {
      const { text: rawText, pdfBytes } = await fetchCofPdf(
        username,
        password,
        month,
      );
      const { rows } = await pool.query(
        `insert into cof_documents (month, source, raw_text)
         values ($1, 'nrl22', $2)
         on conflict (month, source) do update set raw_text = excluded.raw_text, imported_at = now()
         returning id`,
        [month, rawText],
      );
      const documentId = rows[0].id;
      await pool.query("delete from cof_stages where cof_document_id = $1", [
        documentId,
      ]);
      const stages = parseCofStages(rawText);
      const pageImages = await renderCofPages(pdfBytes, [
        ...new Set(stages.map((s) => s.pageNumber)),
      ]);
      for (const stage of stages) {
        const image = pageImages.get(stage.pageNumber) ?? null;
        await pool.query(
          `insert into cof_stages (cof_document_id, stage_number, stage_name, is_timed, par_time_seconds, round_count, image, image_mime, raw_stage_text)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            documentId,
            stage.stageNumber,
            stage.stageName,
            stage.isTimed,
            stage.parTimeSeconds,
            stage.roundCount,
            image,
            image ? "image/png" : null,
            stage.rawStageText,
          ],
        );
      }
      console.log(`imported: ${month} (${stages.length} stages)`);
    } catch (e) {
      console.error(`failed: ${month} — ${e instanceof Error ? e.message : e}`);
    }

    // Own account working through the archive like a member clicking
    // through it manually — pace requests, don't hammer the site.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
} finally {
  await pool.end();
}
