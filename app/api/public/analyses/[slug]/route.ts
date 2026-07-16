import { getPublishedAnalysisBySlug } from "@/lib/server/public-analysis-repository";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) {
    return Response.json(
      { error: { code: "INVALID_SLUG", message: "Nieprawidłowy adres raportu." } },
      { status: 400 },
    );
  }
  try {
    return Response.json(
      { data: await getPublishedAnalysisBySlug(slug) },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (error) {
    console.error("[api/public/analyses/slug] fetch failed", {
      slug,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return Response.json(
      { error: { code: "PUBLIC_ANALYSIS_FAILED", message: "Nie udało się pobrać raportu." } },
      { status: 500 },
    );
  }
}
