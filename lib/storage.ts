"use client";

import type {
  AccessStatus,
  DataLevel,
  MatchAnalysisRecord,
  PublicationStatus,
  RiskLevel,
  TeamManualStats,
} from "./types";

export const matchesStorageKey = "analityq.matches.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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
    goalsForLast5: 0,
    goalsAgainstLast5: 0,
    cornersForLast5: 0,
    cornersAgainstLast5: 0,
    cardsForLast5: 0,
    cardsAgainstLast5: 0,
    shotsForLast5: 0,
    shotsAgainstLast5: 0,
    xgForLast5: 0,
    xgAgainstLast5: 0,
    formLast5: "",
  };
}

export function createEmptyAnalysis(slotNumber: number): MatchAnalysisRecord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    slotNumber,
    slug: `slot-${slotNumber}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    sourceMode: "manual",
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
    odds: {
      homeWin: 0,
      draw: 0,
      awayWin: 0,
      over25: 0,
      under25: 0,
      bttsYes: 0,
      bttsNo: 0,
      cornersOver85: 0,
      cornersUnder85: 0,
      cardsOver35: 0,
      cardsUnder35: 0,
    },
    userProbabilities: {},
    settings: {
      riskLevel: "medium" as RiskLevel,
      confidence: 0,
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

export function normalizeAnalysis(analysis: MatchAnalysisRecord, existing: MatchAnalysisRecord[]) {
  const now = new Date().toISOString();
  const normalized: MatchAnalysisRecord = {
    ...createEmptyAnalysis(analysis.slotNumber || 1),
    ...analysis,
    basic: { ...createEmptyAnalysis(analysis.slotNumber || 1).basic, ...analysis.basic },
    manualStats: {
      home: { ...emptyStats(), ...analysis.manualStats?.home },
      away: { ...emptyStats(), ...analysis.manualStats?.away },
    },
    odds: { ...createEmptyAnalysis(analysis.slotNumber || 1).odds, ...analysis.odds },
    userProbabilities: { ...analysis.userProbabilities },
    settings: { ...createEmptyAnalysis(analysis.slotNumber || 1).settings, ...analysis.settings },
    notes: { ...createEmptyAnalysis(analysis.slotNumber || 1).notes, ...analysis.notes },
    premiumSections: {
      ...createEmptyAnalysis(analysis.slotNumber || 1).premiumSections,
      ...analysis.premiumSections,
    },
    sourceMode: "manual",
    updatedAt: now,
  };

  normalized.slotNumber = Math.min(20, Math.max(1, Number(normalized.slotNumber) || 1));
  normalized.slug = buildAnalysisSlug(normalized, existing);
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
