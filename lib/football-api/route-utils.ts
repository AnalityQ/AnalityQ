import { FootballApiError } from "./types";
import { hasValidStudioSession } from "@/lib/server/studio-session";

export function isIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function positiveInteger(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function wantsRefresh(value: unknown) {
  return value === true || value === "true" || value === "1";
}

export function requestedRefresh(...values: unknown[]) {
  return values.some(wantsRefresh);
}

export function footballRouteError(error: unknown) {
  if (error instanceof FootballApiError) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Nie udało się pobrać danych piłkarskich." } },
    { status: 500 },
  );
}

type RateLimitState = Map<string, { count: number; resetAt: number }>;
const rateLimitGlobal = globalThis as typeof globalThis & { __analityqFootballRateLimit?: RateLimitState };
const rateLimit = rateLimitGlobal.__analityqFootballRateLimit ?? new Map();
rateLimitGlobal.__analityqFootballRateLimit = rateLimit;

export function checkFootballRateLimit(request: Request, limit = 60, scope = "read") {
  const forwarded = (
    request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip")
  )?.split(",")[0]?.trim();
  const key = `${scope}:${forwarded || "local"}`;
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function checkImportRateLimit(request: Request) {
  return checkFootballRateLimit(request, 8, "import");
}

export function checkRefreshRateLimit(request: Request) {
  return checkFootballRateLimit(request, 3, "refresh");
}

export function footballRateLimitResponse() {
  return Response.json(
    {
      error: {
        code: "LOCAL_RATE_LIMIT",
        message: "Przekroczono limit zapytań. Spróbuj ponownie później.",
      },
    },
    { status: 429 },
  );
}

export function requireAuthorizedRefresh(request: Request, refresh: boolean) {
  if (!refresh) return null;
  if (!hasValidStudioSession(request)) {
    return Response.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Brak uprawnień do wykonania tej operacji.",
        },
      },
      { status: 401 },
    );
  }
  return checkRefreshRateLimit(request) ? null : footballRateLimitResponse();
}
