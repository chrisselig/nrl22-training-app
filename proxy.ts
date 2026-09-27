import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionCookieValue } from "@/lib/auth";

const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// /api/logs holds personal match data, so it's gated on every method,
// including GET. /api/props and /api/strategies are a shared reference
// catalog — only writes to those are gated.
const FULLY_GATED_PREFIXES = ["/api/logs"];

export function proxy(request: NextRequest) {
  const path = new URL(request.url).pathname;
  const fullyGated = FULLY_GATED_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  );

  if (!fullyGated && READ_ONLY_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!verifySessionCookieValue(cookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/props/:path*",
    "/api/strategies/:path*",
    "/api/logs/:path*",
    "/api/results/:path*",
  ],
};
