import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "nrl22_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

function sign(expiresAt: number): string {
  return createHmac("sha256", getSecret())
    .update(String(expiresAt))
    .digest("hex");
}

/** Builds a signed cookie value: "<expiresAtMs>.<hmac>". Stateless — no session table. */
export function createSessionCookieValue(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifySessionCookieValue(value: string | undefined): boolean {
  if (!value) return false;
  const [expiresAtRaw, signature] = value.split(".");
  if (!expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = sign(expiresAt);
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    throw new Error("APP_PASSWORD is not set");
  }
  const expectedBuf = Buffer.from(expected);
  const candidateBuf = Buffer.from(candidate);
  if (expectedBuf.length !== candidateBuf.length) return false;
  return timingSafeEqual(expectedBuf, candidateBuf);
}
