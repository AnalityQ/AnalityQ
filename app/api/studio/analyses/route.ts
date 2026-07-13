import { createAdminAnalysis, getAdminAnalyses } from "@/lib/server/analysis-repository";
import {
  requireStudioSession,
  studioOperationErrorResponse,
} from "@/lib/server/studio-route";
import type { MatchAnalysisRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireStudioSession(request);
  if (unauthorized) return unauthorized;

  try {
    return Response.json({ data: await getAdminAnalyses() });
  } catch (error) {
    return studioOperationErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = requireStudioSession(request);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as { analysis?: unknown };
    if (!body.analysis || typeof body.analysis !== "object" || Array.isArray(body.analysis)) {
      return Response.json(
        { error: { code: "INVALID_BODY", message: "Nieprawidłowe dane analizy." } },
        { status: 400 },
      );
    }
    return Response.json(
      { data: await createAdminAnalysis(body.analysis as MatchAnalysisRecord) },
      { status: 201 },
    );
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
