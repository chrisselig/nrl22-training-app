import { NextResponse } from "next/server";
import { saveCofDocument } from "@/lib/cof-storage";

const MONTH_RE = /^\d{4}-\d{2}$/;

export async function POST(request: Request) {
  const body = (await request.json()) as { month?: unknown; rawText?: unknown };
  if (typeof body.month !== "string" || !MONTH_RE.test(body.month)) {
    return NextResponse.json(
      { error: "month must be in YYYY-MM format" },
      { status: 400 },
    );
  }
  if (typeof body.rawText !== "string" || body.rawText.trim() === "") {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 });
  }

  const result = await saveCofDocument(body.month, "nrl22", body.rawText);
  return NextResponse.json(result);
}
