import { CALGARY } from "./driving-distance";

const OSRM_DEMO_URL = "https://router.project-osrm.org/route/v1/driving";

interface OsrmResponse {
  code: string;
  routes?: { distance: number; duration: number }[];
}

// ponytail: router.project-osrm.org is OSRM's free public demo server — real
// road routing, no API key, but no SLA either (it's not meant for heavy
// traffic). If it ever gets flaky, swap in a self-hosted OSRM instance or a
// keyed provider (OpenRouteService/GraphHopper free tier); the call site
// already tolerates a null result.
export async function routeFromCalgary(point: {
  lat: number;
  lng: number;
}): Promise<{ km: number; minutes: number } | null> {
  const url = `${OSRM_DEMO_URL}/${CALGARY.lng},${CALGARY.lat};${point.lng},${point.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const body = (await res.json()) as OsrmResponse;
  const route = body.routes?.[0];
  if (body.code !== "Ok" || !route) return null;

  return { km: route.distance / 1000, minutes: route.duration / 60 };
}
