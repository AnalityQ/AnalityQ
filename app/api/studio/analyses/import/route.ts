import { importAdminAnalyses } from "@/lib/server/analysis-repository";
import {
  requireStudioSession,
  studioOperationErrorResponse,
} from "@/lib/server/studio-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = requireStudioSession(request);
  if (unauthorized) return unauthorized;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2 * 1024 * 1024) {
    return Response.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "Plik importu jest zbyt duży." } },
      { status: 413 },
    );
  }

  try {
    const body = (await request.json()) as { data?: unknown };
    return Response.json({ data: await importAdminAnalyses(body.data) }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { code: "INVALID_BODY", message: "Nieprawidłowe dane importu." } },
        { status: 400 },
      );
    }
    return studioOperationErrorResponse(error);
  }
}
