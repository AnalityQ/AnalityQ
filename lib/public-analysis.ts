import { calculateFullReportMetrics } from "./calculations";
import { contextualSnapshotContent } from "./football-api/match-context";
import { predictTeamLineup } from "./football-api/predicted-lineup";
import type { MatchSignal } from "./football-api/types";
import type {
  AnalysisBasic,
  EffectiveRiskLevel,
  FeaturedType,
  MatchAnalysisRecord,
} from "./types";
import { generateModelSummary } from "./reportText";

export type PublicAnalysisSummary = {
  id: string;
  slotNumber: number;
  slug: string;
  updatedAt: string;
  publicationStatus: "published";
  featuredType: FeaturedType;
  basic: AnalysisBasic;
  league: {
    name: string;
    country: string;
    countryCode: string | null;
    logo: string | null;
    flag: string | null;
  };
  homeTeam: { name: string; logo: string | null };
  awayTeam: { name: string; logo: string | null };
  venueName: string | null;
  metrics: {
    valueIndex: number | null;
    totalExpectedGoals: number | null;
    expectedCorners: number | null;
    favorite: { side: "home" | "draw" | "away"; probability: number } | null;
    effectiveRiskLevel: EffectiveRiskLevel;
    confidence: number;
    completeness: number;
    bestValueMarket: string;
  };
  summary: string;
  dataFact: string | null;
  signals: MatchSignal[];
  signalCount: number;
  absenceCount: number;
  missingCount: number;
  questionableCount: number;
  lineupStatus: string;
  venueContext: {
    mode: "home_away" | "neutral";
    label: string;
    reason: string;
  };
};

function modelFavorite(metrics: ReturnType<typeof calculateFullReportMetrics>) {
  const candidates = [
    { side: "home" as const, probability: metrics.modelProbabilities.homeWin },
    { side: "draw" as const, probability: metrics.modelProbabilities.draw },
    { side: "away" as const, probability: metrics.modelProbabilities.awayWin },
  ].filter((item): item is { side: "home" | "draw" | "away"; probability: number } => typeof item.probability === "number");
  return candidates.sort((a, b) => b.probability - a.probability)[0] || null;
}

function lineupStatus(analysis: MatchAnalysisRecord) {
  const snapshot = analysis.dataSource?.snapshot;
  const lineups = snapshot?.lineups;
  if (lineups?.official && lineups.teams.some((team) => team.startXI.length >= 11)) {
    return "Oficjalne";
  }
  if (snapshot && lineups?.historicalStarters.length === 2 && lineups.historicalStarters.every((team) =>
    predictTeamLineup(team, snapshot.injuries, snapshot.playerInsights).available,
  )) {
    return "Przewidywane";
  }
  if (lineups?.historicalStarters.some((team) => team.players.length >= 9)) {
    return "Najczęściej wybierani";
  }
  return "Brak wystarczających danych";
}

export function toPublicAnalysisSummary(analysis: MatchAnalysisRecord): PublicAnalysisSummary {
  const snapshot = analysis.dataSource?.snapshot;
  const contextual = snapshot ? contextualSnapshotContent(snapshot) : null;
  const metrics = calculateFullReportMetrics(analysis);
  const signals = contextual?.signals.slice(0, 3) ?? [];
  const homeSample = snapshot?.recentForm.home.summary.sampleSize ?? 0;
  const awaySample = snapshot?.recentForm.away.summary.sampleSize ?? 0;
  return {
    id: analysis.id,
    slotNumber: analysis.slotNumber,
    slug: analysis.slug,
    updatedAt: analysis.updatedAt,
    publicationStatus: "published",
    featuredType: analysis.featuredType,
    basic: analysis.basic,
    league: {
      name: snapshot?.fixture.leagueName || analysis.basic.league,
      country: snapshot?.fixture.countryName || analysis.basic.country,
      countryCode: snapshot?.fixture.countryCode || null,
      logo: snapshot?.fixture.leagueLogo || null,
      flag: snapshot?.fixture.leagueFlag || null,
    },
    homeTeam: {
      name: snapshot?.fixture.homeTeam.name || analysis.basic.homeTeam,
      logo: snapshot?.fixture.homeTeam.logo || null,
    },
    awayTeam: {
      name: snapshot?.fixture.awayTeam.name || analysis.basic.awayTeam,
      logo: snapshot?.fixture.awayTeam.logo || null,
    },
    venueName: snapshot?.fixture.venueName || analysis.basic.venue || null,
    metrics: {
      valueIndex: metrics.valueIndex,
      totalExpectedGoals: metrics.totalExpectedGoals,
      expectedCorners: metrics.expectedCorners,
      favorite: modelFavorite(metrics),
      effectiveRiskLevel: metrics.effectiveRiskLevel,
      confidence: metrics.confidence,
      completeness: metrics.dataCompleteness.percent,
      bestValueMarket: metrics.bestValueMarket,
    },
    summary: analysis.notes.summary.trim() || generateModelSummary(analysis, metrics),
    dataFact: signals[0]?.evidence
      || (snapshot ? `Próba raportu: ${homeSample} meczów pierwszej drużyny i ${awaySample} meczów drugiej drużyny.` : null),
    signals,
    signalCount: contextual?.signals.length ?? 0,
    absenceCount: snapshot
      ? snapshot.injuries.missing.length + snapshot.injuries.questionable.length
      : 0,
    missingCount: snapshot?.injuries.missing.length ?? 0,
    questionableCount: snapshot?.injuries.questionable.length ?? 0,
    lineupStatus: lineupStatus(analysis),
    venueContext: contextual
      ? {
          mode: contextual.venueContext.mode,
          label: contextual.venueContext.label,
          reason: contextual.venueContext.reason,
        }
      : {
          mode: "home_away",
          label: "Gospodarz / wyjazd",
          reason: "Brak danych wskazujących teren neutralny.",
        },
  };
}
