import { simplifyTeam } from "@/lib/football-api/normalize";
import { getFootballDataProvider } from "@/lib/football-api/provider";
import {
  checkFootballRateLimit,
  footballRateLimitResponse,
  footballRouteError,
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
  const query = url.searchParams.get("query")?.trim() || "";
  if (query.length < 3 || query.length > 80) {
    return Response.json(
      { error: { code: "INVALID_QUERY", message: "Wpisz co najmniej 3 znaki nazwy drużyny." } },
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
    const teams = await getFootballDataProvider().searchTeams(query, {
      refresh,
    });
    return Response.json({ data: teams.map(simplifyTeam) });
  } catch (error) {
    return footballRouteError(error);
  }
}
