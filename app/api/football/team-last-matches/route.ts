import { buildTeamLastMatches } from "@/lib/football-api/import-service";
import {
  checkFootballRateLimit,
  footballRateLimitResponse,
  footballRouteError,
  isIsoDate,
  positiveInteger,
  requestedRefresh,
  requireAuthorizedRefresh,
} from "@/lib/football-api/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkFootballRateLimit(request)) {
    return footballRateLimitResponse();
  }
  const url = new URL(request.url);
  const teamId = positiveInteger(url.searchParams.get("teamId"));
  const season = positiveInteger(url.searchParams.get("season"));
  const beforeDate = url.searchParams.get("before") || url.searchParams.get("beforeDate") || "";
  const requestedLimit = positiveInteger(url.searchParams.get("limit") || 5);
  if (!teamId || !season || !requestedLimit || requestedLimit > 5 || !isIsoDate(beforeDate)) {
    return Response.json(
      { error: { code: "INVALID_PARAMETERS", message: "Nieprawidłowe parametry drużyny lub daty." } },
      { status: 400 },
    );
  }
  const refresh = requestedRefresh(
    url.searchParams.get("refresh"),
    url.searchParams.get("forceRefresh"),
    url.searchParams.get("bypassCache"),
  );
  const refreshError = requireAuthorizedRefresh(request, refresh);
  if (refreshError) return refreshError;

  try {
    const data = await buildTeamLastMatches(
      teamId,
      beforeDate,
      season,
      Math.min(5, requestedLimit),
      refresh,
    );
    return Response.json({ data });
  } catch (error) {
    return footballRouteError(error);
  }
}
