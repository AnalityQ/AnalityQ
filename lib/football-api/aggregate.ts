import type { NumericValue } from "../types";
import type {
  AggregateCoverageKey,
  AggregatedLastMatches,
  NormalizedTeamMatchStats,
  TeamSampleAverages,
  TeamSampleSummary,
} from "./types";

type AvailableSummary = { total: NumericValue; count: number; average: NumericValue };

function summarize(values: NumericValue[]): AvailableSummary {
  const available = values.filter((value): value is number => value !== null);
  if (!available.length) return { total: null, count: 0, average: null };
  const total = available.reduce((sum, value) => sum + value, 0);
  return { total, count: available.length, average: total / available.length };
}

export function aggregateLastMatches(matches: NormalizedTeamMatchStats[]): AggregatedLastMatches {
  // Najnowszy mecz jest zawsze po lewej stronie zapisu formy.
  const chronological = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const summaries: Record<AggregateCoverageKey | "shotsOnTargetForLast5" | "shotsOnTargetAgainstLast5", AvailableSummary> = {
    goalsForLast5: summarize(chronological.map((match) => match.goalsFor)),
    goalsAgainstLast5: summarize(chronological.map((match) => match.goalsAgainst)),
    cornersForLast5: summarize(chronological.map((match) => match.cornersFor)),
    cornersAgainstLast5: summarize(chronological.map((match) => match.cornersAgainst)),
    cardsForLast5: summarize(chronological.map((match) => match.cardsFor)),
    cardsAgainstLast5: summarize(chronological.map((match) => match.cardsAgainst)),
    shotsForLast5: summarize(chronological.map((match) => match.shotsFor)),
    shotsAgainstLast5: summarize(chronological.map((match) => match.shotsAgainst)),
    shotsOnTargetForLast5: summarize(chronological.map((match) => match.shotsOnTargetFor)),
    shotsOnTargetAgainstLast5: summarize(chronological.map((match) => match.shotsOnTargetAgainst)),
    xgForLast5: summarize(chronological.map((match) => match.xgFor)),
    xgAgainstLast5: summarize(chronological.map((match) => match.xgAgainst)),
  };

  const total = (key: keyof typeof summaries) => summaries[key].total;
  return {
    matchesCount: chronological.length,
    goalsForLast5: total("goalsForLast5"),
    goalsAgainstLast5: total("goalsAgainstLast5"),
    cornersForLast5: total("cornersForLast5"),
    cornersAgainstLast5: total("cornersAgainstLast5"),
    cardsForLast5: total("cardsForLast5"),
    cardsAgainstLast5: total("cardsAgainstLast5"),
    shotsForLast5: total("shotsForLast5"),
    shotsAgainstLast5: total("shotsAgainstLast5"),
    shotsOnTargetForLast5: total("shotsOnTargetForLast5"),
    shotsOnTargetAgainstLast5: total("shotsOnTargetAgainstLast5"),
    xgForLast5: total("xgForLast5"),
    xgAgainstLast5: total("xgAgainstLast5"),
    formLast5: chronological.map((match) => match.result).join(","),
    coverage: {
      goals: Math.min(summaries.goalsForLast5.count, summaries.goalsAgainstLast5.count),
      shots: Math.min(summaries.shotsForLast5.count, summaries.shotsAgainstLast5.count),
      shotsOnTarget: Math.min(summaries.shotsOnTargetForLast5.count, summaries.shotsOnTargetAgainstLast5.count),
      corners: Math.min(summaries.cornersForLast5.count, summaries.cornersAgainstLast5.count),
      cards: Math.min(summaries.cardsForLast5.count, summaries.cardsAgainstLast5.count),
      xg: Math.min(summaries.xgForLast5.count, summaries.xgAgainstLast5.count),
    },
    averages: Object.fromEntries(
      Object.entries(summaries).map(([key, value]) => [key, value.average]),
    ) as Record<AggregateCoverageKey | "shotsOnTargetForLast5" | "shotsOnTargetAgainstLast5", NumericValue>,
  };
}

export function aggregateWarnings(aggregate: AggregatedLastMatches, teamLabel: string) {
  const warnings: string[] = [];
  if (aggregate.matchesCount < 5) {
    warnings.push(`Dla ${teamLabel} dostępnych jest tylko ${aggregate.matchesCount} ostatnich spotkań.`);
  }
  const coverageLabels: Array<[keyof AggregatedLastMatches["coverage"], string]> = [
    ["corners", "rzutów rożnych"],
    ["shots", "strzałów"],
    ["shotsOnTarget", "strzałów celnych"],
    ["cards", "kartek"],
    ["xg", "xG"],
  ];
  for (const [key, label] of coverageLabels) {
    const count = aggregate.coverage[key];
    if (count > 0 && count < aggregate.matchesCount) {
      warnings.push(`Dane ${label} dla ${teamLabel} pochodzą tylko z ${count} spotkań.`);
    }
  }
  if (aggregate.coverage.xg === 0) {
    warnings.push(`Nie wszystkie spotkania zawierają dane xG dla ${teamLabel}.`);
  }
  return warnings;
}

function averageFor(
  matches: NormalizedTeamMatchStats[],
  key: keyof NormalizedTeamMatchStats,
) {
  return summarize(
    matches.map((match) => {
      const value = match[key];
      return typeof value === "number" ? value : null;
    }),
  );
}

export function summarizeTeamSample(matches: NormalizedTeamMatchStats[]): TeamSampleSummary {
  const ordered = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const metricMap: Record<keyof TeamSampleAverages, keyof NormalizedTeamMatchStats> = {
    goalsFor: "goalsFor",
    goalsAgainst: "goalsAgainst",
    xgFor: "xgFor",
    xgAgainst: "xgAgainst",
    shotsFor: "shotsFor",
    shotsAgainst: "shotsAgainst",
    shotsOnTargetFor: "shotsOnTargetFor",
    shotsOnTargetAgainst: "shotsOnTargetAgainst",
    shotsOffTargetFor: "shotsOffTargetFor",
    blockedShotsFor: "blockedShotsFor",
    shotsInsideBoxFor: "shotsInsideBoxFor",
    shotsOutsideBoxFor: "shotsOutsideBoxFor",
    cornersFor: "cornersFor",
    cornersAgainst: "cornersAgainst",
    yellowCardsFor: "yellowCardsFor",
    redCardsFor: "redCardsFor",
    cardsFor: "cardsFor",
    cardsAgainst: "cardsAgainst",
    foulsFor: "foulsFor",
    possessionFor: "possessionFor",
    goalkeeperSavesFor: "goalkeeperSavesFor",
    totalPassesFor: "totalPassesFor",
    accuratePassesFor: "accuratePassesFor",
    passAccuracyFor: "passAccuracyFor",
    halftimeGoalsFor: "halftimeGoalsFor",
    halftimeGoalsAgainst: "halftimeGoalsAgainst",
    secondHalfGoalsFor: "secondHalfGoalsFor",
    secondHalfGoalsAgainst: "secondHalfGoalsAgainst",
  };
  const summaries = Object.fromEntries(
    Object.entries(metricMap).map(([key, source]) => [
      key,
      averageFor(ordered, source as keyof NormalizedTeamMatchStats),
    ]),
  ) as Record<keyof TeamSampleAverages, AvailableSummary>;
  const averages = Object.fromEntries(
    Object.entries(summaries).map(([key, summary]) => [key, summary.average]),
  ) as TeamSampleAverages;
  const coverage = Object.fromEntries(
    Object.entries(summaries).map(([key, summary]) => [key, summary.count]),
  ) as TeamSampleSummary["coverage"];

  const totals = ordered.map((match) =>
    match.cornersFor === null || match.cornersAgainst === null
      ? null
      : match.cornersFor + match.cornersAgainst,
  );
  const thresholdCount = (threshold: number) =>
    totals.filter((value) => value !== null && value > threshold).length;
  const wins = ordered.filter((match) => match.result === "W").length;
  const draws = ordered.filter((match) => match.result === "D").length;
  const losses = ordered.filter((match) => match.result === "L").length;
  coverage.firstGoal = ordered.filter((match) => match.firstGoal !== null).length;

  return {
    sampleSize: ordered.length,
    wins,
    draws,
    losses,
    points: wins * 3 + draws,
    cleanSheets: ordered.filter((match) => match.goalsAgainst === 0).length,
    btts: ordered.filter(
      (match) =>
        match.goalsFor !== null &&
        match.goalsAgainst !== null &&
        match.goalsFor > 0 &&
        match.goalsAgainst > 0,
    ).length,
    over25: ordered.filter(
      (match) =>
        match.goalsFor !== null &&
        match.goalsAgainst !== null &&
        match.goalsFor + match.goalsAgainst > 2.5,
    ).length,
    scoredFirst: ordered.filter((match) => match.firstGoal === "scored").length,
    concededFirst: ordered.filter((match) => match.firstGoal === "conceded").length,
    cornersOver85: thresholdCount(8.5),
    cornersOver95: thresholdCount(9.5),
    cornersOver105: thresholdCount(10.5),
    averages,
    coverage,
  };
}
