import { neon } from "@neondatabase/serverless";

function getDatabaseUrl(): string {
  // Vercel's Postgres/Neon integration names its vars with a
  // store-specific prefix (e.g. `nrl_training_DATABASE_URL`) rather than
  // the plain `DATABASE_URL` this app's code and migrate script expect.
  const url = process.env.DATABASE_URL ?? process.env.nrl_training_DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export const sql = neon(getDatabaseUrl());
