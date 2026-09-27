import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const propId = Number(id);
  if (!Number.isInteger(propId)) {
    return NextResponse.json({ error: "Invalid prop id" }, { status: 400 });
  }

  await sql`delete from props where id = ${propId}`;
  return NextResponse.json({ ok: true });
}
