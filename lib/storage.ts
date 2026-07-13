import { emptyMarketNumbers, safeNumber, statNumberKeys } from "./calculations";
import type {
  AccessStatus,
  DataLevel,
  MatchAnalysisRecord,
  NumericValue,
  PublicationStatus,
  RiskLevel,
  SourceMode,
  TeamManualStats,
} from "./types";

export const matchesStorageKey = "analityq.matches.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `analysis-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeNumber(value: unknown): NumericValue {
  return safeNumber(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function emptyStats(): TeamManualStats {
  return {
    goalsForLast5: null,
    goalsAgainstLast5: null,
    cornersForLast5: null,
    cornersAgainstLast5: null,
    cardsForLast5: null,
    cardsAgainstLast5: null,
    shotsForLast5: null,
    shotsAgainstLast5: null,
    xgForLast5: null,
    xgAgainstLast5: null,
    formLast5: "",
  };
}

export function createEmptyAnalysis(slotNumber: number): MatchAnalysisRecord {
  const now = new Date().toISOString();

  return {
    id: createId(),
    slotNumber,
    slug: `slot-${slotNumber}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    sourceMode: "manual",
    dataSource: null,
    publicationStatus: "draft",
    basic: {
      league: "",
      country: "",
      homeTeam: "",
      awayTeam: "",
      kickoff: "",
      status: "free" as AccessStatus,
      dataLevel: "basic" as DataLevel,
      fotmobUrl: "",
      venue: "",
    },
    manualStats: {
      home: emptyStats(),
      away: emptyStats(),
    },
    odds: emptyMarketNumbers(),
    userProbabilities: {},
    settings: {
      riskLevel: "auto" as RiskLevel,
      confidence: null,
      riskNote: "",
    },
    notes: {
      summary: "",
      homeStrengths: "",
      awayStrengths: "",
      keyRisks: "",
      scenarios: "",
      workNotes: "",
      finalAssessment: "",
      h2hNotes: "",
      lineupsNotes: "",
      injuriesNotes: "",
      generalStatsNotes: "",
    },
    premiumSections: {
      cornersAnalysis: "",
      cardsAnalysis: "",
      shotsAnalysis: "",
      halvesAnalysis: "",
      advancedRisk: "",
      h2hAdvanced: "",
      lineupsAdvanced: "",
    },
  };
}

export function buildAnalysisSlug(analysis: MatchAnalysisRecord, existing: MatchAnalysisRecord[]) {
  const base =
    slugify(`${analysis.basic.homeTeam}-${analysis.basic.awayTeam}`) ||
    slugify(`${analysis.basic.league}-slot-${analysis.slotNumber}`) ||
    `slot-${analysis.slotNumber}`;
  let slug = base;
  let index = 2;

  while (existing.some((item) => item.id !== analysis.id && item.slug === slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

function normalizeStats(stats: Partial<TeamManualStats> | undefined) {
  const normalized = { ...emptyStats(), ...stats };

  statNumberKeys.forEach((key) => {
    normalized[key] = normalizeNumber(normalized[key]);
  });
  normalized.formLast5 = String(normalized.formLast5 || "");

  return normalized;
}

export function normalizeAnalysis(analysis: MatchAnalysisRecord, existing: MatchAnalysisRecord[]) {
  const slotNumber = Math.min(20, Math.max(1, Number(analysis.slotNumber) || 1));
  const defaults = createEmptyAnalysis(slotNumber);
  const now = new Date().toISOString();
  const odds = { ...defaults.odds, ...analysis.odds };
  const userProbabilities = { ...analysis.userProbabilities };

  Object.keys(odds).forEach((key) => {
    const marketKey = key as keyof typeof odds;
    odds[marketKey] = normalizeNumber(odds[marketKey]);
  });

  Object.keys(userProbabilities).forEach((key) => {
    const marketKey = key as keyof typeof userProbabilities;
    userProbabilities[marketKey] = normalizeNumber(userProbabilities[marketKey]);
  });

  const normalized: MatchAnalysisRecord = {
    ...defaults,
    ...analysis,
    id: analysis.id || defaults.id,
    createdAt: analysis.createdAt || defaults.createdAt,
    updatedAt: now,
    slotNumber,
    basic: { ...defaults.basic, ...analysis.basic },
    manualStats: {
      home: normalizeStats(analysis.manualStats?.home),
      away: normalizeStats(analysis.manualStats?.away),
    },
    odds,
    userProbabilities,
    settings: {
      ...defaults.settings,
      ...analysis.settings,
      riskLevel: (analysis.settings?.riskLevel || "auto") as RiskLevel,
      confidence: normalizeNumber(analysis.settings?.confidence),
    },
    notes: { ...defaults.notes, ...analysis.notes },
    premiumSections: {
      ...defaults.premiumSections,
      ...analysis.premiumSections,
    },
    sourceMode: (["manual", "api", "mixed"].includes(analysis.sourceMode) ? analysis.sourceMode : "manual") as SourceMode,
    dataSource: analysis.dataSource
      ? {
          provider: "API-Football",
          fixtureId: normalizeNumber(analysis.dataSource.fixtureId),
          homeTeamId: normalizeNumber(analysis.dataSource.homeTeamId),
          awayTeamId: normalizeNumber(analysis.dataSource.awayTeamId),
          fetchedAt: analysis.dataSource.fetchedAt || null,
          includedHomeFixtures: Array.isArray(analysis.dataSource.includedHomeFixtures)
            ? analysis.dataSource.includedHomeFixtures.filter((value): value is number => Number.isInteger(value))
            : [],
          includedAwayFixtures: Array.isArray(analysis.dataSource.includedAwayFixtures)
            ? analysis.dataSource.includedAwayFixtures.filter((value): value is number => Number.isInteger(value))
            : [],
          warnings: Array.isArray(analysis.dataSource.warnings)
            ? analysis.dataSource.warnings.filter((value): value is string => typeof value === "string")
            : [],
          coverage: analysis.dataSource.coverage
            ? {
                home: { ...analysis.dataSource.coverage.home },
                away: { ...analysis.dataSource.coverage.away },
              }
            : undefined,
        }
      : null,
  };

  normalized.basic.status = (normalized.basic.status || "free") as AccessStatus;
  normalized.basic.dataLevel = (normalized.basic.dataLevel || "basic") as DataLevel;
  normalized.publicationStatus = (normalized.publicationStatus || "draft") as PublicationStatus;

  const incomingSlug = typeof analysis.slug === "string" ? analysis.slug.trim() : "";
  const hasSlugConflict = existing.some((item) => item.id !== normalized.id && item.slug === incomingSlug);
  const isPlaceholderSlug = /^slot-\d+/i.test(incomingSlug);
  normalized.slug = incomingSlug && !hasSlugConflict && !isPlaceholderSlug ? incomingSlug : buildAnalysisSlug(normalized, existing);
  return normalized;
}

export function getMatches(): MatchAnalysisRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(matchesStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item, index, list) => normalizeAnalysis(item as MatchAnalysisRecord, list as MatchAnalysisRecord[]))
      .sort((a, b) => a.slotNumber - b.slotNumber);
  } catch {
    return [];
  }
}

export function saveMatches(matches: MatchAnalysisRecord[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(matchesStorageKey, JSON.stringify(matches));
  window.dispatchEvent(new Event("analityq-storage"));
}

export function addMatch(match: MatchAnalysisRecord) {
  const matches = getMatches();
  const normalized = normalizeAnalysis(match, matches);
  const next = [...matches.filter((item) => item.id !== normalized.id), normalized].sort(
    (a, b) => a.slotNumber - b.slotNumber,
  );
  saveMatches(next);
  return normalized;
}

export function updateMatch(id: string, updater: (match: MatchAnalysisRecord) => MatchAnalysisRecord) {
  const matches = getMatches();
  const next = matches.map((match) => {
    if (match.id !== id) return match;
    return normalizeAnalysis(updater(match), matches);
  });
  saveMatches(next);
  return next.find((match) => match.id === id) || null;
}

export function deleteMatch(id: string) {
  saveMatches(getMatches().filter((match) => match.id !== id));
}

export function exportMatchesToJson() {
  return JSON.stringify(getMatches(), null, 2);
}

export function importMatchesFromJson(json: string) {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error("Niepoprawny format danych. JSON musi zawierać tablicę analiz.");
  }

  if (parsed.length === 0) {
    throw new Error("Brak danych do importu.");
  }

  const normalized = parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Niepoprawny rekord na pozycji ${index + 1}.`);
    }
    return normalizeAnalysis(item as MatchAnalysisRecord, parsed as MatchAnalysisRecord[]);
  });

  saveMatches(normalized.slice(0, 20));
  return normalized.length;
}

export function resetAllMatches() {
  saveMatches([]);
}

export function getNextFreeSlot(matches: MatchAnalysisRecord[]) {
  for (let slot = 1; slot <= 20; slot += 1) {
    if (!matches.some((match) => match.slotNumber === slot)) return slot;
  }

  return null;
}

export function setPublicationStatus(match: MatchAnalysisRecord, publicationStatus: PublicationStatus) {
  return normalizeAnalysis({ ...match, publicationStatus }, [match]);
}
