const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface NominatimResult {
  lat: string;
  lon: string;
}

/** Free, no-API-key geocoding (OpenStreetMap). A descriptive User-Agent is required by Nominatim's usage policy. */
export async function geocode(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ca");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "nrl22-training-app (personal use, non-commercial)",
    },
  });
  if (!res.ok) return null;

  const rows = (await res.json()) as NominatimResult[];
  if (rows.length === 0) return null;
  return { lat: Number(rows[0].lat), lng: Number(rows[0].lon) };
}
