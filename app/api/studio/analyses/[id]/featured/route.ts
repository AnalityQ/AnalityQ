import { setAdminFeaturedType } from "@/lib/server/analysis-repository";
import {
  isValidAnalysisId,
  requireStudioSession,
  studioOperationErrorResponse,
} from "@/lib/server/studio-route";
import type { FeaturedType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeaturedRouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: FeaturedRouteContext) {
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
    const body = (await request.json()) as { featuredType?: unknown };
    if (body.featuredType !== null && body.featuredType !== "match_of_the_day") {
      return Response.json(
        { error: { code: "INVALID_FEATURED_TYPE", message: "Nieprawidłowe wyróżnienie analizy." } },
        { status: 400 },
      );
    }
    return Response.json({
      data: await setAdminFeaturedType(id, body.featuredType as FeaturedType),
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
