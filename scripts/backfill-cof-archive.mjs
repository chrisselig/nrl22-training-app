import { Pool } from "@neondatabase/serverless";
import { fetchCofPdfText, parseCofStages } from "../lib/nrl22-cof-client.ts";

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

// nrl22.com's public downloads archive starts here (per its own listing).
const ARCHIVE_START = "2024-05";

function monthRange(start, end) {
  const months = [];
  let [y, m] = start.split("-").map(Number);
  const [endY, endM] = end.split("-").map(Number);
  while (y < endY || (y === endY && m <= endM)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}

const currentMonth = new Date().toISOString().slice(0, 7);
const months = monthRange(ARCHIVE_START, currentMonth);

const pool = new Pool({ connectionString: databaseUrl });
try {
  const { rows: existing } = await pool.query(
    "select month from cof_documents where source = 'nrl22'",
  );
  const alreadyImported = new Set(existing.map((r) => r.month));

  for (const month of months) {
    if (alreadyImported.has(month)) {
      console.log(`skipped (already imported): ${month}`);
      continue;
    }

    try {
      const rawText = await fetchCofPdfText(username, password, month);
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
      for (const stage of stages) {
        await pool.query(
          `insert into cof_stages (cof_document_id, stage_number, stage_name, is_timed, par_time_seconds, raw_stage_text)
           values ($1, $2, $3, $4, $5, $6)`,
          [
            documentId,
            stage.stageNumber,
            stage.stageName,
            stage.isTimed,
            stage.parTimeSeconds,
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
