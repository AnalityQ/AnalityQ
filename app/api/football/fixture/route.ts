import { simplifyFixture } from "@/lib/football-api/normalize";
import { getFootballDataProvider } from "@/lib/football-api/provider";
import {
  checkFootballRateLimit,
  footballRateLimitResponse,
  footballRouteError,
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
  const fixtureId = positiveInteger(url.searchParams.get("id"));
  if (!fixtureId) {
    return Response.json(
      { error: { code: "INVALID_FIXTURE", message: "Podaj prawidłowy identyfikator meczu." } },
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
    const fixture = await getFootballDataProvider().getFixtureDetails(fixtureId, {
      refresh,
    });
    if (!fixture) {
      return Response.json(
        { error: { code: "FIXTURE_NOT_FOUND", message: "Nie znaleziono wybranego meczu." } },
        { status: 404 },
      );
    }
    return Response.json({ data: simplifyFixture(fixture) });
  } catch (error) {
    return footballRouteError(error);
  }
}
