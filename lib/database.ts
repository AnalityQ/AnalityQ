"use client";

import { supabase, supabaseMissingConfigMessage } from "./supabase";
import { buildAnalysisSlug, createEmptyAnalysis, getNextFreeSlot, normalizeAnalysis, slugify } from "./storage";
import type {
  AnalysisBasic,
  AnalysisDataSource,
  AnalysisNotes,
  AnalysisSettings,
  MarketNumbers,
  MatchAnalysisRecord,
  PremiumSections,
  PublicationStatus,
  SourceMode,
  UserProbabilities,
} from "./types";

export const databaseChangeEvent = "analityq-database";
export const databaseFetchErrorMessage =
  "Nie udało się pobrać danych z bazy. Sprawdź połączenie lub konfigurację Supabase.";

type AnalysisRow = {
  id: string;
  slot_number: number | null;
  slug: string;
  created_at: string | null;
  updated_at: string | null;
  source_mode: SourceMode | string | null;
  data_source: AnalysisDataSource | null;
  publication_status: PublicationStatus | string | null;
  basic: Partial<AnalysisBasic> | null;
  manual_stats: Partial<MatchAnalysisRecord["manualStats"]> | null;
  odds: Partial<MarketNumbers> | null;
  user_probabilities: UserProbabilities | null;
  settings: Partial<AnalysisSettings> | null;
  notes: Partial<AnalysisNotes> | null;
  premium_sections: Partial<PremiumSections> | null;
};

type AnalysisInsertPayload = {
  slot_number: number;
  slug: string;
  source_mode: SourceMode;
  data_source: AnalysisDataSource | null;
  publication_status: PublicationStatus;
  basic: AnalysisBasic;
  manual_stats: MatchAnalysisRecord["manualStats"];
  odds: MarketNumbers;
  user_probabilities: UserProbabilities;
  settings: AnalysisSettings;
  notes: AnalysisNotes;
  premium_sections: PremiumSections;
};

export class SupabaseConfigError extends Error {
  constructor() {
    super(supabaseMissingConfigMessage);
    this.name = "SupabaseConfigError";
  }
}

export class SupabaseDatabaseError extends Error {
  details?: string;

  constructor(message: string, details?: string) {
    super(message);
    this.name = "SupabaseDatabaseError";
    this.details = details;
  }
}

function ensureSupabase() {
  if (!supabase) throw new SupabaseConfigError();
  return supabase;
}

function notifyDatabaseChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(databaseChangeEvent));
  }
}

function currentIso() {
  return new Date().toISOString();
}

function rowToAnalysis(row: AnalysisRow): MatchAnalysisRecord {
  const now = currentIso();
  const record = {
    id: row.id,
    slotNumber: row.slot_number || 1,
    slug: row.slug,
    createdAt: row.created_at || now,
    updatedAt: row.updated_at || row.created_at || now,
    sourceMode: (row.source_mode || "manual") as SourceMode,
    dataSource: row.data_source || null,
    publicationStatus: (row.publication_status || "draft") as PublicationStatus,
    basic: row.basic || {},
    manualStats: row.manual_stats || {},
    odds: row.odds || {},
    userProbabilities: row.user_probabilities || {},
    settings: row.settings || {},
    notes: row.notes || {},
    premiumSections: row.premium_sections || {},
  } as MatchAnalysisRecord;

  const normalized = normalizeAnalysis(record, [record]);
  normalized.slug = row.slug;
  normalized.createdAt = row.created_at || now;
  normalized.updatedAt = row.updated_at || row.created_at || now;
  return normalized;
}

function toPayload(analysis: MatchAnalysisRecord): AnalysisInsertPayload {
  return {
    slot_number: analysis.slotNumber,
    slug: analysis.slug,
    source_mode: analysis.sourceMode,
    data_source: analysis.dataSource,
    publication_status: analysis.publicationStatus,
    basic: analysis.basic,
    manual_stats: analysis.manualStats,
    odds: analysis.odds,
    user_probabilities: analysis.userProbabilities,
    settings: analysis.settings,
    notes: analysis.notes,
    premium_sections: analysis.premiumSections,
  };
}

function getErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const maybeError = error as { message?: string; details?: string; hint?: string; code?: string };
  return [maybeError.message, maybeError.details, maybeError.hint, maybeError.code].filter(Boolean).join(" | ");
}

function throwDatabaseError(action: string, error: unknown): never {
  throw new SupabaseDatabaseError(action, getErrorDetails(error));
}

function resolveUniqueSlug(baseSlug: string, existing: MatchAnalysisRecord[], idToIgnore?: string) {
  const base = slugify(baseSlug) || "analiza";
  let slug = base;
  let index = 2;

  while (existing.some((item) => item.id !== idToIgnore && item.slug === slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

async function fetchExistingAnalyses() {
  const client = ensureSupabase();
  const { data, error } = await client.from("analyses").select("*").order("slot_number", { ascending: true });

  if (error) throwDatabaseError("Nie udało się pobrać analiz z Supabase.", error);
  return ((data || []) as AnalysisRow[]).map(rowToAnalysis);
}

export function getPublicDatabaseErrorMessage(error: unknown) {
  if (error instanceof SupabaseConfigError) return supabaseMissingConfigMessage;
  return databaseFetchErrorMessage;
}

export function getStudioDatabaseErrorMessage(error: unknown) {
  if (error instanceof SupabaseConfigError) return supabaseMissingConfigMessage;
  if (error instanceof SupabaseDatabaseError) return error.details ? `${error.message} ${error.details}` : error.message;
  return "Wystąpił problem podczas pracy z bazą Supabase.";
}

export async function getAllAnalyses() {
  return fetchExistingAnalyses();
}

export async function getPublishedAnalyses() {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("analyses")
    .select("*")
    .eq("publication_status", "published")
    .order("slot_number", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throwDatabaseError("Nie udało się pobrać opublikowanych analiz.", error);
  return ((data || []) as AnalysisRow[]).map(rowToAnalysis);
}

export async function getAnalysisBySlug(slug: string) {
  const client = ensureSupabase();
  const { data, error } = await client.from("analyses").select("*").eq("slug", slug).maybeSingle();

  if (error) throwDatabaseError("Nie udało się pobrać raportu.", error);
  return data ? rowToAnalysis(data as AnalysisRow) : null;
}

export async function createAnalysis(data: MatchAnalysisRecord) {
  const client = ensureSupabase();
  const existing = await fetchExistingAnalyses();
  const normalized = normalizeAnalysis(data, existing);
  normalized.slug = resolveUniqueSlug(buildAnalysisSlug(normalized, existing), existing, normalized.id);

  const { data: row, error } = await client.from("analyses").insert(toPayload(normalized)).select("*").single();

  if (error) throwDatabaseError("Nie udało się zapisać analizy w Supabase.", error);
  notifyDatabaseChange();
  return rowToAnalysis(row as AnalysisRow);
}

export async function updateAnalysis(id: string, data: MatchAnalysisRecord) {
  const client = ensureSupabase();
  const existing = await fetchExistingAnalyses();
  const current = existing.find((item) => item.id === id);
  const normalized = normalizeAnalysis(
    {
      ...(current || data),
      ...data,
      id,
      createdAt: current?.createdAt || data.createdAt,
      updatedAt: currentIso(),
    },
    existing,
  );
  normalized.slug = resolveUniqueSlug(normalized.slug || buildAnalysisSlug(normalized, existing), existing, id);

  const { data: row, error } = await client
    .from("analyses")
    .update({ ...toPayload(normalized), updated_at: currentIso() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throwDatabaseError("Nie udało się zaktualizować analizy.", error);
  notifyDatabaseChange();
  return rowToAnalysis(row as AnalysisRow);
}

export async function deleteAnalysis(id: string) {
  const client = ensureSupabase();
  const { error } = await client.from("analyses").delete().eq("id", id);

  if (error) throwDatabaseError("Nie udało się usunąć analizy.", error);
  notifyDatabaseChange();
}

export async function publishAnalysis(id: string) {
  return updatePublicationStatus(id, "published");
}

export async function unpublishAnalysis(id: string) {
  return updatePublicationStatus(id, "draft");
}

export async function archiveAnalysis(id: string) {
  return updatePublicationStatus(id, "archived");
}

export async function duplicateAnalysis(id: string) {
  const existing = await fetchExistingAnalyses();
  const source = existing.find((item) => item.id === id);
  if (!source) throw new SupabaseDatabaseError("Nie znaleziono analizy do zduplikowania.");

  const slotNumber = getNextFreeSlot(existing);
  if (!slotNumber) throw new SupabaseDatabaseError("Brak wolnego slotu na nowy szkic.");

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

  return createAnalysis(duplicate);
}

async function updatePublicationStatus(id: string, publicationStatus: PublicationStatus) {
  const client = ensureSupabase();
  const { data: row, error } = await client
    .from("analyses")
    .update({ publication_status: publicationStatus, updated_at: currentIso() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throwDatabaseError("Nie udało się zmienić statusu publikacji.", error);
  notifyDatabaseChange();
  return rowToAnalysis(row as AnalysisRow);
}

export async function importAnalysesToDatabase(data: unknown) {
  let parsed = data;

  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new SupabaseDatabaseError("Niepoprawny JSON. Sprawdź zawartość kopii zapasowej.");
    }
  }

  if (!Array.isArray(parsed)) {
    throw new SupabaseDatabaseError("Niepoprawny format danych. JSON musi zawierać tablicę analiz.");
  }

  if (parsed.length === 0) {
    throw new SupabaseDatabaseError("Brak danych do importu.");
  }

  const imported: MatchAnalysisRecord[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      throw new SupabaseDatabaseError("Niepoprawny rekord w kopii JSON.");
    }

    const saved = await createAnalysis(item as MatchAnalysisRecord);
    imported.push(saved);
  }

  notifyDatabaseChange();
  return imported;
}

export async function exportAnalysesFromDatabase() {
  return getAllAnalyses();
}
