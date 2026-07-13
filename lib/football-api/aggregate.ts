import type { NumericValue } from "../types";
import type { AggregateCoverageKey, AggregatedLastMatches, NormalizedTeamMatchStats } from "./types";

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
