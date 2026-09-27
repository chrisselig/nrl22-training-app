import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const props = await sql`
    select id, name, category, notes, created_at, updated_at
    from props
    order by category, name
  `;
  const strategies = await sql`
    select id, prop_id, position, equipment, bag_placement, notes, created_at, updated_at
    from strategies
    order by prop_id, position
  `;

  const strategiesByPropId = new Map<number, unknown[]>();
  for (const strategy of strategies) {
    const propId = strategy.prop_id as number;
    const list = strategiesByPropId.get(propId) ?? [];
    list.push(strategy);
    strategiesByPropId.set(propId, list);
  }

  const result = props.map((prop) => ({
    ...prop,
    strategies: strategiesByPropId.get(prop.id as number) ?? [],
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: unknown;
    category?: unknown;
    notes?: unknown;
  };

  if (typeof body.name !== "string" || body.name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (typeof body.category !== "string" || body.category.trim() === "") {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }
  const notes = typeof body.notes === "string" ? body.notes : null;

  const [prop] = await sql`
    insert into props (name, category, notes)
    values (${body.name}, ${body.category}, ${notes})
    returning id, name, category, notes, created_at, updated_at
  `;

  return NextResponse.json(prop, { status: 201 });
}
