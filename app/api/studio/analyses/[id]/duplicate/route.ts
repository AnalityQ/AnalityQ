import { duplicateAdminAnalysis } from "@/lib/server/analysis-repository";
import {
  isValidAnalysisId,
  requireStudioSession,
  studioOperationErrorResponse,
} from "@/lib/server/studio-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DuplicateRouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: DuplicateRouteContext) {
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
    return Response.json({ data: await duplicateAdminAnalysis(id) }, { status: 201 });
  } catch (error) {
    return studioOperationErrorResponse(error);
  }
}
