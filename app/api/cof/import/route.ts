import { NextResponse } from "next/server";
import { fetchCofPdfText } from "@/lib/nrl22-cof-client";
import { saveCofDocument } from "@/lib/cof-storage";

const MONTH_RE = /^\d{4}-\d{2}$/;

export async function POST(request: Request) {
  const body = (await request.json()) as { month?: unknown };
  if (typeof body.month !== "string" || !MONTH_RE.test(body.month)) {
    return NextResponse.json(
      { error: "month must be in YYYY-MM format" },
      { status: 400 },
    );
  }

  const username = process.env.NRL22_USERNAME;
  const password = process.env.NRL22_PASSWORD;
  if (!username || !password) {
    return NextResponse.json(
      { error: "NRL22_USERNAME/NRL22_PASSWORD are not configured" },
      { status: 500 },
    );
  }

  let rawText: string;
  try {
    rawText = await fetchCofPdfText(username, password, body.month);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "COF import failed" },
      { status: 502 },
    );
  }

  const result = await saveCofDocument(body.month, "nrl22", rawText);
  return NextResponse.json(result);
}
