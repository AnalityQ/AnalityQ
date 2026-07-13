import { buildFootballMatchImport } from "@/lib/football-api/import-service";
import {
  checkImportRateLimit,
  checkRefreshRateLimit,
  footballRateLimitResponse,
  footballRouteError,
  positiveInteger,
  requestedRefresh,
} from "@/lib/football-api/route-utils";
import { hasValidStudioSession } from "@/lib/server/studio-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasValidStudioSession(request)) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Brak uprawnień do wykonania tej operacji." } },
      { status: 401 },
    );
  }

  if (!checkImportRateLimit(request)) {
    return footballRateLimitResponse();
  }

  try {
    const body = (await request.json()) as {
      fixtureId?: unknown;
      refresh?: unknown;
      forceRefresh?: unknown;
      bypassCache?: unknown;
    };
    const fixtureId = positiveInteger(body.fixtureId);
    if (!fixtureId) {
      return Response.json(
        { error: { code: "INVALID_FIXTURE", message: "Wybierz prawidłowy mecz do importu." } },
        { status: 400 },
      );
    }
    const refresh = requestedRefresh(body.refresh, body.forceRefresh, body.bypassCache);
    if (refresh && !checkRefreshRateLimit(request)) return footballRateLimitResponse();

    const data = await buildFootballMatchImport(fixtureId, refresh);
    return Response.json({ data });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { code: "INVALID_BODY", message: "Nieprawidłowe dane żądania." } },
        { status: 400 },
      );
    }
    return footballRouteError(error);
  }
}
