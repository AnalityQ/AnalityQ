import type { NumericValue } from "../types";
import type {
  AggregateCoverageKey,
  AggregatedLastMatches,
  NormalizedTeamMatchStats,
} from "./types";

type AvailableSummary = { total: NumericValue; count: number; average: NumericValue };

function summarize(values: NumericValue[]): AvailableSummary {
  const available = values.filter((value): value is number => value !== null);
  if (!available.length) return { total: null, count: 0, average: null };
  const total = available.reduce((sum, value) => sum + value, 0);
  return { total, count: available.length, average: total / available.length };
}

function cards(yellow: NumericValue, red: NumericValue): NumericValue {
  const available = [yellow, red].filter((value): value is number => value !== null);
  return available.length ? available.reduce((sum, value) => sum + value, 0) : null;
}

export function aggregateLastMatches(matches: NormalizedTeamMatchStats[]): AggregatedLastMatches {
  const chronological = [...matches]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-5);

  const summaries: Record<AggregateCoverageKey, AvailableSummary> = {
    goalsForLast5: summarize(chronological.map((match) => match.goalsFor)),
    goalsAgainstLast5: summarize(chronological.map((match) => match.goalsAgainst)),
    cornersForLast5: summarize(chronological.map((match) => match.cornersFor)),
    cornersAgainstLast5: summarize(chronological.map((match) => match.cornersAgainst)),
    cardsForLast5: summarize(chronological.map((match) => cards(match.yellowCardsFor, match.redCardsFor))),
    cardsAgainstLast5: summarize(chronological.map((match) => cards(match.yellowCardsAgainst, match.redCardsAgainst))),
    shotsForLast5: summarize(chronological.map((match) => match.shotsFor)),
    shotsAgainstLast5: summarize(chronological.map((match) => match.shotsAgainst)),
    xgForLast5: summarize(chronological.map((match) => match.xgFor)),
    xgAgainstLast5: summarize(chronological.map((match) => match.xgAgainst)),
  };

  const total = (key: AggregateCoverageKey) => summaries[key].total;
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
    xgForLast5: total("xgForLast5"),
    xgAgainstLast5: total("xgAgainstLast5"),
    formLast5: chronological.map((match) => match.result).join(","),
    coverage: Object.fromEntries(
      Object.entries(summaries).map(([key, value]) => [key, value.count]),
    ) as Record<AggregateCoverageKey, number>,
    averages: Object.fromEntries(
      Object.entries(summaries).map(([key, value]) => [key, value.average]),
    ) as Record<AggregateCoverageKey, NumericValue>,
  };
}

export function aggregateWarnings(aggregate: AggregatedLastMatches, teamLabel: string) {
  const warnings: string[] = [];
  if (aggregate.matchesCount < 5) {
    warnings.push(`Dla ${teamLabel} dostępnych jest tylko ${aggregate.matchesCount} ostatnich spotkań.`);
  }
  const coverageLabels: Array<[AggregateCoverageKey, string]> = [
    ["cornersForLast5", "rzutów rożnych"],
    ["shotsForLast5", "strzałów"],
    ["cardsForLast5", "kartek"],
    ["xgForLast5", "xG"],
  ];
  for (const [key, label] of coverageLabels) {
    const count = aggregate.coverage[key];
    if (count > 0 && count < aggregate.matchesCount) {
      warnings.push(`Dane ${label} dla ${teamLabel} pochodzą tylko z ${count} spotkań.`);
    }
  }
  if (aggregate.coverage.xgForLast5 === 0 || aggregate.coverage.xgAgainstLast5 === 0) {
    warnings.push(`Nie udało się pobrać pełnych danych xG dla ${teamLabel}.`);
  }
  return warnings;
}
