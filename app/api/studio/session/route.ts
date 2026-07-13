import { NextResponse } from "next/server";
import { checkStudioLoginRateLimit } from "@/lib/server/studio-login-rate-limit";
import {
  createStudioSessionToken,
  hasValidStudioSession,
  studioSessionCookieName,
  studioSessionCookieOptions,
  verifyStudioPassword,
} from "@/lib/server/studio-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json({ data: { authenticated: hasValidStudioSession(request) } });
}

export async function POST(request: Request) {
  if (!checkStudioLoginRateLimit(request)) {
    return Response.json(
      { error: { code: "LOGIN_RATE_LIMIT", message: "Przekroczono limit prób logowania. Spróbuj ponownie później." } },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4096) {
    return Response.json(
      { error: { code: "INVALID_BODY", message: "Nieprawidłowe dane logowania." } },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password !== "string" || body.password.length > 256) {
      return Response.json(
        { error: { code: "INVALID_BODY", message: "Nieprawidłowe dane logowania." } },
        { status: 400 },
      );
    }

    const result = verifyStudioPassword(body.password);
    if (result === "unconfigured") {
      return Response.json(
        { error: { code: "MISSING_STUDIO_PASSWORD", message: "Brakuje konfiguracji hasła Studio." } },
        { status: 503 },
      );
    }
    if (result === "invalid") {
      return Response.json(
        { error: { code: "INVALID_PASSWORD", message: "Nieprawidłowe hasło." } },
        { status: 401 },
      );
    }

    const token = createStudioSessionToken();
    if (!token) {
      return Response.json(
        { error: { code: "MISSING_STUDIO_CONFIG", message: "Brakuje serwerowej konfiguracji Studio." } },
        { status: 503 },
      );
    }

    const response = NextResponse.json({ data: { authenticated: true } });
    response.cookies.set(studioSessionCookieName, token, studioSessionCookieOptions());
    return response;
  } catch {
    return Response.json(
      { error: { code: "INVALID_BODY", message: "Nieprawidłowe dane logowania." } },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ data: { authenticated: false } });
  response.cookies.set(studioSessionCookieName, "", {
    ...studioSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
