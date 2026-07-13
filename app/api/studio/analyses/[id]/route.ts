import {
  deleteAdminAnalysis,
  updateAdminAnalysis,
} from "@/lib/server/analysis-repository";
import {
  isValidAnalysisId,
  requireStudioSession,
  studioOperationErrorResponse,
} from "@/lib/server/studio-route";
import type { MatchAnalysisRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalysisRouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: AnalysisRouteContext) {
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
    const body = (await request.json()) as { analysis?: unknown };
    if (!body.analysis || typeof body.analysis !== "object" || Array.isArray(body.analysis)) {
      return Response.json(
        { error: { code: "INVALID_BODY", message: "Nieprawidłowe dane analizy." } },
        { status: 400 },
      );
    }
    return Response.json({
      data: await updateAdminAnalysis(id, body.analysis as MatchAnalysisRecord),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { code: "INVALID_BODY", message: "Nieprawidłowe dane analizy." } },
        { status: 400 },
      );
    }
    return studioOperationErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: AnalysisRouteContext) {
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
    await deleteAdminAnalysis(id);
    return Response.json({ data: { deleted: true } });
  } catch (error) {
    return studioOperationErrorResponse(error);
  }
}
