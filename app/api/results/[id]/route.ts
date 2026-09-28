import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const resultId = Number(id);
  if (!Number.isInteger(resultId)) {
    return NextResponse.json({ error: "Invalid result id" }, { status: 400 });
  }

  await sql`delete from results where id = ${resultId}`;
  return NextResponse.json({ ok: true });
}
