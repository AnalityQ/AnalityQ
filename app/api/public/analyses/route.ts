import { getPublishedAnalysisSummaries } from "@/lib/server/public-analysis-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(
      { data: await getPublishedAnalysisSummaries() },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (error) {
    console.error("[api/public/analyses] fetch failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return Response.json(
      { error: { code: "PUBLIC_ANALYSES_FAILED", message: "Nie udało się pobrać analiz." } },
      { status: 500 },
    );
  }
}
