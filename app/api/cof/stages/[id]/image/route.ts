import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const stageId = Number(id);
  if (!Number.isInteger(stageId)) {
    return NextResponse.json({ error: "Invalid stage id" }, { status: 400 });
  }

  const [stage] = await sql`
    select image, image_mime from cof_stages where id = ${stageId}
  `;
  if (!stage?.image) {
    return NextResponse.json(
      { error: "No image for this stage" },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(stage.image as Buffer), {
    headers: {
      "Content-Type": (stage.image_mime as string) ?? "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
