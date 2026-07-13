import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const studioSessionCookieName = "analityq_studio_session";
export const studioSessionMaxAgeSeconds = 8 * 60 * 60;
const sessionVersion = "v1";
const signatureContext = "analityq-studio-session";
const passwordCompareKey = "analityq-studio-password-compare";

function getStudioPassword() {
  const password = process.env.STUDIO_PASSWORD;
  return password && password.length > 0 ? password : null;
}

function getSessionSecret() {
  const password = getStudioPassword();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!password || !serviceRoleKey) return null;

  return createHmac("sha256", serviceRoleKey)
    .update(`${signatureContext}:key:${password}`)
    .digest("base64url");
}

function digestPassword(password: string) {
  return createHmac("sha256", passwordCompareKey).update(password).digest();
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`${signatureContext}:${payload}`)
    .digest("base64url");
}

export function verifyStudioPassword(candidate: string) {
  const expected = getStudioPassword();
  if (!expected) return "unconfigured" as const;

  return timingSafeEqual(digestPassword(candidate), digestPassword(expected))
    ? ("valid" as const)
    : ("invalid" as const);
}

export function createStudioSessionToken(now = Date.now()) {
  const secret = getSessionSecret();
  if (!secret) return null;

  const expiresAt = Math.floor(now / 1000) + studioSessionMaxAgeSeconds;
  const nonce = randomBytes(24).toString("base64url");
  const payload = `${sessionVersion}.${expiresAt}.${nonce}`;
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyStudioSessionToken(token: string | null | undefined, now = Date.now()) {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== sessionVersion) return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false;

  const payload = parts.slice(0, 3).join(".");
  const expectedSignature = signPayload(payload, secret);
  const receivedSignature = parts[3];
  if (receivedSignature.length !== expectedSignature.length) return false;

  return timingSafeEqual(
    Buffer.from(receivedSignature, "utf8"),
    Buffer.from(expectedSignature, "utf8"),
  );
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function hasValidStudioSession(request: Request) {
  return verifyStudioSessionToken(readCookie(request, studioSessionCookieName));
}

export function studioSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: studioSessionMaxAgeSeconds,
    priority: "high" as const,
  };
}
