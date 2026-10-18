import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { geocode } from "@/lib/geocode";
import { routeFromCalgary } from "@/lib/osrm";

export async function GET() {
  const events = await sql`
    select id, name, series, event_date, city, province, address, lat, lng,
           drive_km, drive_minutes, registration_url, notes, created_at, updated_at
    from events
    order by event_date asc
  `;
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: unknown;
    series?: unknown;
    eventDate?: unknown;
    city?: unknown;
    province?: unknown;
    address?: unknown;
    registrationUrl?: unknown;
    notes?: unknown;
  };

  if (typeof body.name !== "string" || body.name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (typeof body.series !== "string" || body.series.trim() === "") {
    return NextResponse.json({ error: "series is required" }, { status: 400 });
  }
  if (typeof body.eventDate !== "string" || body.eventDate.trim() === "") {
    return NextResponse.json(
      { error: "eventDate is required" },
      { status: 400 },
    );
  }
  if (typeof body.city !== "string" || body.city.trim() === "") {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }
  if (typeof body.province !== "string" || body.province.trim() === "") {
    return NextResponse.json(
      { error: "province is required" },
      { status: 400 },
    );
  }

  const address = typeof body.address === "string" ? body.address.trim() : "";
  const registrationUrl =
    typeof body.registrationUrl === "string" && body.registrationUrl.trim()
      ? body.registrationUrl.trim()
      : null;
  const notes =
    typeof body.notes === "string" && body.notes ? body.notes : null;

  const geocodeQuery = address
    ? `${address}, ${body.city}, ${body.province}, Canada`
    : `${body.city}, ${body.province}, Canada`;
  const point = await geocode(geocodeQuery);
  const route = point ? await routeFromCalgary(point) : null;

  const [event] = await sql`
    insert into events (
      name, series, event_date, city, province, address, lat, lng,
      drive_km, drive_minutes, registration_url, notes
    )
    values (
      ${body.name}, ${body.series}, ${body.eventDate}, ${body.city}, ${body.province},
      ${address || null}, ${point?.lat ?? null}, ${point?.lng ?? null},
      ${route?.km ?? null}, ${route?.minutes ?? null},
      ${registrationUrl}, ${notes}
    )
    returning id, name, series, event_date, city, province, address, lat, lng,
              drive_km, drive_minutes, registration_url, notes, created_at, updated_at
  `;

  return NextResponse.json(event, { status: 201 });
}
