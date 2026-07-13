import { setAdminPublicationStatus } from "@/lib/server/analysis-repository";
import {
  isValidAnalysisId,
  requireStudioSession,
  studioOperationErrorResponse,
} from "@/lib/server/studio-route";
import type { PublicationStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedStatuses = new Set<PublicationStatus>(["draft", "published", "archived"]);
type StatusRouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: StatusRouteContext) {
  const unauthorized = requireStudioSession(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  if (!isValidAnalysisId(id)) {
    return Response.json(
      { error: { code: "INVALID_ID", message: "Nieprawidłowy identyfikator analizy." } },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as { status?: unknown };
    if (typeof body.status !== "string" || !allowedStatuses.has(body.status as PublicationStatus)) {
      return Response.json(
        { error: { code: "INVALID_STATUS", message: "Nieprawidłowy status publikacji." } },
        { status: 400 },
      );
    }
    return Response.json({
      data: await setAdminPublicationStatus(id, body.status as PublicationStatus),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { code: "INVALID_BODY", message: "Nieprawidłowe dane żądania." } },
        { status: 400 },
      );
    }
    return studioOperationErrorResponse(error);
  }
}
