import "server-only";

import { rowToAnalysis, type AnalysisRow } from "@/lib/analysis-persistence";
import { toPublicAnalysisSummary } from "@/lib/public-analysis";
import { getAdminSupabase } from "./supabase-admin";

export class PublicAnalysisRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicAnalysisRepositoryError";
  }
}

export async function getPublishedAnalysisSummaries() {
  const { data, error } = await getAdminSupabase()
    .from("analyses")
    .select("*")
    .eq("publication_status", "published")
    .order("updated_at", { ascending: false });
  if (error) throw new PublicAnalysisRepositoryError("Nie udało się pobrać opublikowanych analiz.");
  return ((data || []) as AnalysisRow[]).map(rowToAnalysis).map(toPublicAnalysisSummary);
}

export async function getPublishedAnalysisBySlug(slug: string) {
  const { data, error } = await getAdminSupabase()
    .from("analyses")
    .select("*")
    .eq("publication_status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new PublicAnalysisRepositoryError("Nie udało się pobrać raportu.");
  return data ? rowToAnalysis(data as AnalysisRow) : null;
}
