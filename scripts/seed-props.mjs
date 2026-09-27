import { Pool } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.nrl_training_DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

// Standard NRL22 prop list, per https://nrl22canada.ca/resources/
const STANDARD_PROPS = [
  { name: "55 Gallon Barrel", category: "barrel", notes: null },
  {
    name: "Used Tires",
    category: "tire",
    notes: "3 tires, 26 to 32 inches",
  },
  { name: "5 Gallon Bucket", category: "bucket", notes: null },
  { name: "2 Gallon Bucket", category: "bucket", notes: null },
  { name: "Rope", category: "rope", notes: "10 foot length" },
  {
    name: "Cinder Blocks",
    category: "cinder-block",
    notes: "3 blocks, 6 x 8 x 16 inches",
  },
  { name: "Open Back Folding Chair", category: "chair", notes: null },
  {
    name: "Saw Horse with Shelf on Bottom",
    category: "sawhorse",
    notes: null,
  },
  {
    name: "Tank Trap",
    category: "tank-trap",
    notes: "5 foot posts, 3 inch lumber",
  },
  { name: "6 Foot A Frame Ladder", category: "ladder", notes: null },
  { name: "NRL22 Pyramid", category: "pyramid", notes: null },
  {
    name: "Tripod",
    category: "tripod",
    notes: "Minimum height: 50 inches, minimum weight rating: 35 pounds",
  },
];

const pool = new Pool({ connectionString: databaseUrl });
try {
  for (const prop of STANDARD_PROPS) {
    const result = await pool.query(
      `insert into props (name, category, notes)
       values ($1, $2, $3)
       on conflict (lower(name)) do nothing
       returning id`,
      [prop.name, prop.category, prop.notes],
    );
    console.log(result.rowCount ? `added: ${prop.name}` : `skipped (exists): ${prop.name}`);
  }
} finally {
  await pool.end();
}
