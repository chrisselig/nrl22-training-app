import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const rows = await sql`
    select id, source, match_date, season, match_type, club_name, shooter_name,
           class, division, shooter_id, raw_score, overall_finish,
           division_finish, class_finish, leaderboard_points, scraped_at
    from results
    order by match_date desc
    limit 200
  `;
  return NextResponse.json(rows);
}
