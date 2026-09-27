import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.nrl_training_DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const schemaPath = path.join(__dirname, "..", "lib", "db", "schema.sql");
const schema = readFileSync(schemaPath, "utf8");

const pool = new Pool({ connectionString: databaseUrl });
try {
  await pool.query(schema);
  console.log("Migration applied.");
} finally {
  await pool.end();
}
