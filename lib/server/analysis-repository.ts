import "server-only";

import {
  currentIso,
  resolveUniqueAnalysisSlug,
  rowToAnalysis,
  toAnalysisPayload,
  type AnalysisRow,
} from "@/lib/analysis-persistence";
import {
  buildAnalysisSlug,
  createEmptyAnalysis,
  getNextFreeSlot,
  normalizeAnalysis,
} from "@/lib/storage";
import type { MatchAnalysisRecord, PublicationStatus } from "@/lib/types";
import { getAdminSupabase } from "./supabase-admin";

export class AnalysisRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisRepositoryError";
  }
}

function repositoryError(message: string): never {
  throw new AnalysisRepositoryError(message);
}

async function fetchExistingAnalyses() {
  const { data, error } = await getAdminSupabase()
    .from("analyses")
    .select("*")
    .order("slot_number", { ascending: true });

  if (error) repositoryError("Nie udało się pobrać analiz.");
  return ((data || []) as AnalysisRow[]).map(rowToAnalysis);
}

export async function getAdminAnalyses() {
  return fetchExistingAnalyses();
}

export async function createAdminAnalysis(input: MatchAnalysisRecord) {
  const existing = await fetchExistingAnalyses();
  const normalized = normalizeAnalysis(input, existing);
  normalized.slug = resolveUniqueAnalysisSlug(
    buildAnalysisSlug(normalized, existing),
    existing,
    normalized.id,
  );

  const { data, error } = await getAdminSupabase()
    .from("analyses")
    .insert(toAnalysisPayload(normalized))
    .select("*")
    .single();

  if (error || !data) repositoryError("Nie udało się zapisać analizy.");
  return rowToAnalysis(data as AnalysisRow);
}

export async function updateAdminAnalysis(id: string, input: MatchAnalysisRecord) {
  const existing = await fetchExistingAnalyses();
  const current = existing.find((item) => item.id === id);
  if (!current) repositoryError("Nie znaleziono analizy.");

  const normalized = normalizeAnalysis(
    {
      ...current,
      ...input,
      id,
      createdAt: current.createdAt,
      updatedAt: currentIso(),
    },
    existing,
  );
  normalized.slug = resolveUniqueAnalysisSlug(
    normalized.slug || buildAnalysisSlug(normalized, existing),
    existing,
    id,
  );

  const { data, error } = await getAdminSupabase()
    .from("analyses")
    .update({ ...toAnalysisPayload(normalized), updated_at: currentIso() })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) repositoryError("Nie udało się zaktualizować analizy.");
  return rowToAnalysis(data as AnalysisRow);
}

export async function deleteAdminAnalysis(id: string) {
  const { error } = await getAdminSupabase().from("analyses").delete().eq("id", id);
  if (error) repositoryError("Nie udało się usunąć analizy.");
}

export async function setAdminPublicationStatus(id: string, status: PublicationStatus) {
  const { data, error } = await getAdminSupabase()
    .from("analyses")
    .update({ publication_status: status, updated_at: currentIso() })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) repositoryError("Nie udało się zmienić statusu publikacji.");
  return rowToAnalysis(data as AnalysisRow);
}

export async function duplicateAdminAnalysis(id: string) {
  const existing = await fetchExistingAnalyses();
  const source = existing.find((item) => item.id === id);
  if (!source) repositoryError("Nie znaleziono analizy do zduplikowania.");

  const slotNumber = getNextFreeSlot(existing);
  if (!slotNumber) repositoryError("Brak wolnego slotu na nowy szkic.");

  const empty = createEmptyAnalysis(slotNumber);
  const duplicate: MatchAnalysisRecord = {
    ...source,
    id: empty.id,
    slotNumber,
    slug: empty.slug,
    createdAt: "",
    updatedAt: "",
    publicationStatus: "draft",
    basic: { ...source.basic },
    manualStats: {
      home: { ...source.manualStats.home },
      away: { ...source.manualStats.away },
    },
    odds: { ...source.odds },
    userProbabilities: { ...source.userProbabilities },
    settings: { ...source.settings },
    notes: { ...source.notes },
    premiumSections: { ...source.premiumSections },
    dataSource: source.dataSource
      ? {
          ...source.dataSource,
          includedHomeFixtures: [...source.dataSource.includedHomeFixtures],
          includedAwayFixtures: [...source.dataSource.includedAwayFixtures],
          warnings: [...source.dataSource.warnings],
          coverage: source.dataSource.coverage
            ? {
                home: { ...source.dataSource.coverage.home },
                away: { ...source.dataSource.coverage.away },
              }
            : undefined,
        }
      : null,
  };

  return createAdminAnalysis(duplicate);
}

export async function importAdminAnalyses(input: unknown) {
  let parsed = input;

  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      repositoryError("Niepoprawny JSON. Sprawdź zawartość kopii zapasowej.");
    }
  }

  if (!Array.isArray(parsed)) {
    repositoryError("Niepoprawny format danych. JSON musi zawierać tablicę analiz.");
  }
  if (parsed.length === 0) repositoryError("Brak danych do importu.");
  if (parsed.length > 20) repositoryError("Jednorazowo można zaimportować maksymalnie 20 analiz.");

  const records = parsed as unknown[];
  for (const item of records) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      repositoryError("Niepoprawny rekord w kopii JSON.");
    }
  }

  const imported: MatchAnalysisRecord[] = [];
  for (const item of records) {
    imported.push(await createAdminAnalysis(item as MatchAnalysisRecord));
  }
  return imported;
}
