import { getFootballDataProvider } from "@/lib/football-api/provider";
import { simplifyFixture } from "@/lib/football-api/normalize";
import { footballRouteError, isIsoDate, wantsRefresh } from "@/lib/football-api/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!isIsoDate(date)) {
    return Response.json(
      { error: { code: "INVALID_DATE", message: "Podaj prawidłową datę w formacie RRRR-MM-DD." } },
      { status: 400 },
    );
  }

  try {
    const fixtures = await getFootballDataProvider().getFixturesByDate(date, {
      refresh: wantsRefresh(url.searchParams.get("refresh")),
    });
    return Response.json({ data: fixtures.map(simplifyFixture) });
  } catch (error) {
    return footballRouteError(error);
  }
}
