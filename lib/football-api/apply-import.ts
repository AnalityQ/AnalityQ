import type { MatchAnalysisRecord, TeamManualStats } from "../types";
import { aggregateLastMatches, aggregateWarnings, summarizeTeamSample } from "./aggregate";
import type { AggregatedLastMatches, FootballMatchImport } from "./types";

export type FootballRefreshScope = "all" | "lineups" | "injuries" | "odds" | "standings" | "signals";

function toManualStats(aggregate: AggregatedLastMatches): TeamManualStats {
  return {
    goalsForLast5: aggregate.goalsForLast5,
    goalsAgainstLast5: aggregate.goalsAgainstLast5,
    cornersForLast5: aggregate.cornersForLast5,
    cornersAgainstLast5: aggregate.cornersAgainstLast5,
    cardsForLast5: aggregate.cardsForLast5,
    cardsAgainstLast5: aggregate.cardsAgainstLast5,
    shotsForLast5: aggregate.shotsForLast5,
    shotsAgainstLast5: aggregate.shotsAgainstLast5,
    xgForLast5: aggregate.xgForLast5,
    xgAgainstLast5: aggregate.xgAgainstLast5,
    formLast5: aggregate.formLast5,
  };
}

function toAnalysisCoverage(aggregate: AggregatedLastMatches) {
  return {
    goalsForLast5: aggregate.coverage.goals,
    goalsAgainstLast5: aggregate.coverage.goals,
    cornersForLast5: aggregate.coverage.corners,
    cornersAgainstLast5: aggregate.coverage.corners,
    cardsForLast5: aggregate.coverage.cards,
    cardsAgainstLast5: aggregate.coverage.cards,
    shotsForLast5: aggregate.coverage.shots,
    shotsAgainstLast5: aggregate.coverage.shots,
    xgForLast5: aggregate.coverage.xg,
    xgAgainstLast5: aggregate.coverage.xg,
  };
}

export function selectImportMatches(
  imported: FootballMatchImport,
  includedHomeFixtures: number[],
  includedAwayFixtures: number[],
): FootballMatchImport {
  const homeMatches = imported.home.matches.filter((match) => includedHomeFixtures.includes(match.fixtureId));
  const awayMatches = imported.away.matches.filter((match) => includedAwayFixtures.includes(match.fixtureId));
  const homeAggregate = aggregateLastMatches(homeMatches);
  const awayAggregate = aggregateLastMatches(awayMatches);
  const selectionWarnings = [
    ...aggregateWarnings(homeAggregate, `gospodarzy (${imported.home.team.name})`),
    ...aggregateWarnings(awayAggregate, `gości (${imported.away.team.name})`),
  ];
  return {
    ...imported,
    home: { ...imported.home, matches: homeMatches, aggregate: homeAggregate },
    away: { ...imported.away, matches: awayMatches, aggregate: awayAggregate },
    snapshot: {
      ...imported.snapshot,
      warnings: [...new Set([...imported.snapshot.warnings, ...selectionWarnings])],
      recentForm: {
        home: {
          ...imported.snapshot.recentForm.home,
          matches: homeMatches,
          summary: summarizeTeamSample(homeMatches),
        },
        away: {
          ...imported.snapshot.recentForm.away,
          matches: awayMatches,
          summary: summarizeTeamSample(awayMatches),
        },
      },
    },
    warnings: [...new Set([...imported.warnings, ...selectionWarnings])],
  };
}

function hasManualData(analysis: MatchAnalysisRecord) {
  const hasBasic = Boolean(
    analysis.basic.league || analysis.basic.homeTeam || analysis.basic.awayTeam || analysis.basic.kickoff,
  );
  const hasStats = Object.values(analysis.manualStats.home).some((value) => value !== null && value !== "")
    || Object.values(analysis.manualStats.away).some((value) => value !== null && value !== "");
  return hasBasic || hasStats;
}

export function applyFootballImportToAnalysis(
  analysis: MatchAnalysisRecord,
  imported: FootballMatchImport,
): MatchAnalysisRecord {
  const previouslyManual = analysis.sourceMode === "manual" && hasManualData(analysis);
  return {
    ...analysis,
    sourceMode: previouslyManual || analysis.sourceMode === "mixed" ? "mixed" : "api",
    publicationStatus: "draft",
    basic: {
      ...analysis.basic,
      league: imported.fixture.leagueName,
      country: imported.snapshot.fixture.countryName || imported.fixture.leagueCountry,
      homeTeam: imported.fixture.homeTeam.name,
      awayTeam: imported.fixture.awayTeam.name,
      kickoff: imported.fixture.kickoff.slice(0, 16),
      venue: imported.fixture.venue || "",
      fotmobUrl: "",
    },
    manualStats: {
      home: toManualStats(imported.home.aggregate),
      away: toManualStats(imported.away.aggregate),
    },
    dataSource: {
      provider: "API-Football",
      fixtureId: imported.fixture.id,
      homeTeamId: imported.fixture.homeTeam.id,
      awayTeamId: imported.fixture.awayTeam.id,
      fetchedAt: imported.fetchedAt,
      includedHomeFixtures: imported.home.matches.map((match) => match.fixtureId),
      includedAwayFixtures: imported.away.matches.map((match) => match.fixtureId),
      warnings: imported.warnings,
      coverage: {
        home: toAnalysisCoverage(imported.home.aggregate),
        away: toAnalysisCoverage(imported.away.aggregate),
      },
      snapshot: imported.snapshot,
    },
  };
}

export function applyFootballRefreshToAnalysis(
  analysis: MatchAnalysisRecord,
  imported: FootballMatchImport,
  scope: FootballRefreshScope,
): MatchAnalysisRecord {
  if (scope === "all" || !analysis.dataSource?.snapshot) {
    return applyFootballImportToAnalysis(analysis, imported);
  }

  const current = analysis.dataSource.snapshot;
  const refreshed = imported.snapshot;
  const next = {
    ...current,
    fetchedAt: refreshed.fetchedAt,
    warnings: refreshed.warnings,
  };

  if (scope === "lineups") {
    next.lineups = refreshed.lineups;
    next.playerInsights = refreshed.playerInsights;
    next.coverage = { ...next.coverage, lineups: refreshed.coverage.lineups, players: refreshed.coverage.players };
  } else if (scope === "injuries") {
    next.injuries = refreshed.injuries;
    next.coverage = { ...next.coverage, injuries: refreshed.coverage.injuries };
  } else if (scope === "odds") {
    next.odds = refreshed.odds;
    next.coverage = { ...next.coverage, odds: refreshed.coverage.odds };
  } else if (scope === "standings") {
    next.standings = refreshed.standings;
    next.coverage = { ...next.coverage, standings: refreshed.coverage.standings };
  } else {
    next.signals = refreshed.signals;
    next.risks = refreshed.risks;
    next.automaticSummary = refreshed.automaticSummary;
  }

  return {
    ...analysis,
    publicationStatus: "draft",
    dataSource: {
      ...analysis.dataSource,
      fetchedAt: imported.fetchedAt,
      warnings: imported.warnings,
      snapshot: next,
    },
  };
}
