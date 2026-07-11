import { buildFootballMatchImport } from "@/lib/football-api/import-service";
import {
  checkImportRateLimit,
  footballRouteError,
  positiveInteger,
  wantsRefresh,
} from "@/lib/football-api/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!checkImportRateLimit(request)) {
    return Response.json(
      { error: { code: "LOCAL_RATE_LIMIT", message: "Wykonano zbyt wiele importów. Spróbuj ponownie za minutę." } },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as { fixtureId?: unknown; refresh?: unknown };
    const fixtureId = positiveInteger(body.fixtureId);
    if (!fixtureId) {
      return Response.json(
        { error: { code: "INVALID_FIXTURE", message: "Wybierz prawidłowy mecz do importu." } },
        { status: 400 },
      );
    }
    const data = await buildFootballMatchImport(fixtureId, wantsRefresh(body.refresh));
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
