import { buildTeamLastMatches } from "@/lib/football-api/import-service";
import { footballRouteError, positiveInteger, wantsRefresh } from "@/lib/football-api/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const teamId = positiveInteger(url.searchParams.get("teamId"));
  const season = positiveInteger(url.searchParams.get("season"));
  const beforeDate = url.searchParams.get("beforeDate") || "";
  const requestedLimit = positiveInteger(url.searchParams.get("limit") || 5);
  if (!teamId || !season || !requestedLimit || Number.isNaN(new Date(beforeDate).getTime())) {
    return Response.json(
      { error: { code: "INVALID_PARAMETERS", message: "Nieprawidłowe parametry drużyny lub daty." } },
      { status: 400 },
    );
  }
  try {
    const data = await buildTeamLastMatches(
      teamId,
      beforeDate,
      season,
      Math.min(5, requestedLimit),
      wantsRefresh(url.searchParams.get("refresh")),
    );
    return Response.json({ data });
  } catch (error) {
    return footballRouteError(error);
  }
}
