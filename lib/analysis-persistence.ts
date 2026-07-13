import { normalizeAnalysis, slugify } from "./storage";
import type {
  AnalysisBasic,
  AnalysisDataSource,
  AnalysisNotes,
  AnalysisSettings,
  MarketNumbers,
  MatchAnalysisRecord,
  PremiumSections,
  FeaturedType,
  PublicationStatus,
  SourceMode,
  UserProbabilities,
} from "./types";

export type AnalysisRow = {
  id: string;
  slot_number: number | null;
  slug: string;
  created_at: string | null;
  updated_at: string | null;
  source_mode: SourceMode | string | null;
  data_source: AnalysisDataSource | null;
  publication_status: PublicationStatus | string | null;
  featured_type: FeaturedType | string | null;
  basic: Partial<AnalysisBasic> | null;
  manual_stats: Partial<MatchAnalysisRecord["manualStats"]> | null;
  odds: Partial<MarketNumbers> | null;
  user_probabilities: UserProbabilities | null;
  settings: Partial<AnalysisSettings> | null;
  notes: Partial<AnalysisNotes> | null;
  premium_sections: Partial<PremiumSections> | null;
};

export type AnalysisInsertPayload = {
  slot_number: number;
  slug: string;
  source_mode: SourceMode;
  data_source: AnalysisDataSource | null;
  publication_status: PublicationStatus;
  featured_type: FeaturedType;
  basic: AnalysisBasic;
  manual_stats: MatchAnalysisRecord["manualStats"];
  odds: MarketNumbers;
  user_probabilities: UserProbabilities;
  settings: AnalysisSettings;
  notes: AnalysisNotes;
  premium_sections: PremiumSections;
};

export function currentIso() {
  return new Date().toISOString();
}

export function rowToAnalysis(row: AnalysisRow): MatchAnalysisRecord {
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
    featuredType: row.featured_type === "match_of_the_day" ? "match_of_the_day" : null,
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

export function toAnalysisPayload(analysis: MatchAnalysisRecord): AnalysisInsertPayload {
  return {
    slot_number: analysis.slotNumber,
    slug: analysis.slug,
    source_mode: analysis.sourceMode,
    data_source: analysis.dataSource,
    publication_status: analysis.publicationStatus,
    featured_type: analysis.featuredType,
    basic: analysis.basic,
    manual_stats: analysis.manualStats,
    odds: analysis.odds,
    user_probabilities: analysis.userProbabilities,
    settings: analysis.settings,
    notes: analysis.notes,
    premium_sections: analysis.premiumSections,
  };
}

export function resolveUniqueAnalysisSlug(
  baseSlug: string,
  existing: MatchAnalysisRecord[],
  idToIgnore?: string,
) {
  const base = slugify(baseSlug) || "analiza";
  let slug = base;
  let index = 2;

  while (existing.some((item) => item.id !== idToIgnore && item.slug === slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}
