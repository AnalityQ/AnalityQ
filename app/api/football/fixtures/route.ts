import { getFootballDataProvider } from "@/lib/football-api/provider";
import { simplifyFixture } from "@/lib/football-api/normalize";
import {
  checkFootballRateLimit,
  footballRateLimitResponse,
  footballRouteError,
  isIsoDate,
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
  const date = url.searchParams.get("date");
  if (!isIsoDate(date)) {
    return Response.json(
      { error: { code: "INVALID_DATE", message: "Podaj prawidłową datę w formacie RRRR-MM-DD." } },
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
    const fixtures = await getFootballDataProvider().getFixturesByDate(date, {
      refresh,
    });
    return Response.json({ data: fixtures.map(simplifyFixture) });
  } catch (error) {
    return footballRouteError(error);
  }
}
