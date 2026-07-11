import type {
  DataCompleteness,
  EffectiveRiskLevel,
  FullReportMetrics,
  MarketEdge,
  MarketKey,
  MarketNumbers,
  MatchAnalysisRecord,
  NumericValue,
  TeamAverages,
  TeamManualStats,
  AnalysisStatCoverage,
} from "./types";

export const marketDefinitions: Array<{ key: MarketKey; label: string }> = [
  { key: "homeWin", label: "1" },
  { key: "draw", label: "X" },
  { key: "awayWin", label: "2" },
  { key: "over25", label: "Powyżej 2,5 gola" },
  { key: "under25", label: "Poniżej 2,5 gola" },
  { key: "bttsYes", label: "Obie drużyny strzelą — tak" },
  { key: "bttsNo", label: "Obie drużyny strzelą — nie" },
  { key: "cornersOver85", label: "Rzuty rożne powyżej 8,5" },
  { key: "cornersUnder85", label: "Rzuty rożne poniżej 8,5" },
  { key: "cardsOver35", label: "Kartki powyżej 3,5" },
  { key: "cardsUnder35", label: "Kartki poniżej 3,5" },
];

export const statNumberKeys: Array<keyof Omit<TeamManualStats, "formLast5">> = [
  "goalsForLast5",
  "goalsAgainstLast5",
  "cornersForLast5",
  "cornersAgainstLast5",
  "cardsForLast5",
  "cardsAgainstLast5",
  "shotsForLast5",
  "shotsAgainstLast5",
  "xgForLast5",
  "xgAgainstLast5",
];

export const emptyMarketNumbers = (): MarketNumbers => ({
  homeWin: null,
  draw: null,
  awayWin: null,
  over25: null,
  under25: null,
  bttsYes: null,
  bttsNo: null,
  cornersOver85: null,
  cornersUnder85: null,
  cardsOver35: null,
  cardsUnder35: null,
});

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function safeNumber(value: unknown): NumericValue {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function hasNumber(value: unknown) {
  return safeNumber(value) !== null;
}

function numberOrZero(value: unknown) {
  return safeNumber(value) ?? 0;
}

export function round(value: NumericValue, digits = 1): NumericValue {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizePercentages(values: number[]) {
  const total = values.reduce((sum, value) => sum + numberOrZero(value), 0);
  if (total <= 0) return values.map(() => null);
  return values.map((value) => (numberOrZero(value) / total) * 100);
}

function avg(value: NumericValue, sampleSize = 5): NumericValue {
  const parsed = safeNumber(value);
  return parsed === null || sampleSize <= 0 ? null : parsed / sampleSize;
}

function meanAvailable(values: NumericValue[]): NumericValue {
  const available = values.filter((value): value is number => value !== null);
  if (available.length === 0) return null;
  return available.reduce((sum, value) => sum + value, 0) / available.length;
}

function hasAll(values: NumericValue[]) {
  return values.every((value) => value !== null);
}

function calculateTeamAverages(stats: TeamManualStats, coverage?: AnalysisStatCoverage): TeamAverages {
  const sample = (key: keyof AnalysisStatCoverage) => coverage?.[key] ?? 5;
  return {
    goalsForAvg: avg(stats.goalsForLast5, sample("goalsForLast5")),
    goalsAgainstAvg: avg(stats.goalsAgainstLast5, sample("goalsAgainstLast5")),
    cornersForAvg: avg(stats.cornersForLast5, sample("cornersForLast5")),
    cornersAgainstAvg: avg(stats.cornersAgainstLast5, sample("cornersAgainstLast5")),
    cardsForAvg: avg(stats.cardsForLast5, sample("cardsForLast5")),
    cardsAgainstAvg: avg(stats.cardsAgainstLast5, sample("cardsAgainstLast5")),
    shotsForAvg: avg(stats.shotsForLast5, sample("shotsForLast5")),
    shotsAgainstAvg: avg(stats.shotsAgainstLast5, sample("shotsAgainstLast5")),
    xgForAvg: avg(stats.xgForLast5, sample("xgForLast5")),
    xgAgainstAvg: avg(stats.xgAgainstLast5, sample("xgAgainstLast5")),
  };
}

export function calculateAverages(analysis: MatchAnalysisRecord) {
  return {
    home: calculateTeamAverages(analysis.manualStats.home, analysis.dataSource?.coverage?.home),
    away: calculateTeamAverages(analysis.manualStats.away, analysis.dataSource?.coverage?.away),
  };
}

function calculateExpectedGoals(analysis: MatchAnalysisRecord, averages = calculateAverages(analysis)) {
  let expectedHomeGoals = meanAvailable([
    averages.home.goalsForAvg,
    averages.away.goalsAgainstAvg,
  ]);
  let expectedAwayGoals = meanAvailable([
    averages.away.goalsForAvg,
    averages.home.goalsAgainstAvg,
  ]);

  if (averages.home.xgForAvg !== null) {
    expectedHomeGoals =
      expectedHomeGoals === null ? averages.home.xgForAvg : expectedHomeGoals * 0.7 + averages.home.xgForAvg * 0.3;
  }

  if (averages.away.xgForAvg !== null) {
    expectedAwayGoals =
      expectedAwayGoals === null ? averages.away.xgForAvg : expectedAwayGoals * 0.7 + averages.away.xgForAvg * 0.3;
  }

  return {
    expectedHomeGoals,
    expectedAwayGoals,
    totalExpectedGoals:
      expectedHomeGoals !== null && expectedAwayGoals !== null ? expectedHomeGoals + expectedAwayGoals : null,
  };
}

function calculateExpectedCorners(averages: ReturnType<typeof calculateAverages>): NumericValue {
  const values = [
    averages.home.cornersForAvg,
    averages.away.cornersForAvg,
    averages.home.cornersAgainstAvg,
    averages.away.cornersAgainstAvg,
  ];

  if (!hasAll(values)) return null;
  return values.reduce((sum, value) => sum + numberOrZero(value), 0) / 2;
}

function calculateExpectedCards(averages: ReturnType<typeof calculateAverages>): NumericValue {
  const values = [averages.home.cardsForAvg, averages.away.cardsForAvg];
  if (!hasAll(values)) return null;
  return values.reduce((sum, value) => sum + numberOrZero(value), 0) / 2;
}

export function calculateModelProbabilities(analysis: MatchAnalysisRecord): MarketNumbers {
  const averages = calculateAverages(analysis);
  const { home, away } = averages;
  const { expectedHomeGoals, expectedAwayGoals, totalExpectedGoals } = calculateExpectedGoals(analysis, averages);
  const result = emptyMarketNumbers();

  if (totalExpectedGoals !== null) {
    const over25 = clamp(25 + totalExpectedGoals * 13, 25, 78);
    result.over25 = over25;
    result.under25 = 100 - over25;
  }

  if (expectedHomeGoals !== null && expectedAwayGoals !== null) {
    const homeScoreChance = clamp(expectedHomeGoals * 35, 15, 85);
    const awayScoreChance = clamp(expectedAwayGoals * 35, 15, 85);
    const bttsYes = clamp((homeScoreChance + awayScoreChance) / 2, 20, 80);
    result.bttsYes = bttsYes;
    result.bttsNo = 100 - bttsYes;
  }

  if (
    hasAll([
      home.goalsForAvg,
      home.goalsAgainstAvg,
      away.goalsForAvg,
      away.goalsAgainstAvg,
    ])
  ) {
    let homeStrength =
      numberOrZero(home.goalsForAvg) * 1.2 +
      numberOrZero(home.shotsForAvg) * 0.08 +
      numberOrZero(home.cornersForAvg) * 0.06 -
      numberOrZero(home.goalsAgainstAvg) * 0.9;
    const awayStrength =
      numberOrZero(away.goalsForAvg) * 1.2 +
      numberOrZero(away.shotsForAvg) * 0.08 +
      numberOrZero(away.cornersForAvg) * 0.06 -
      numberOrZero(away.goalsAgainstAvg) * 0.9;

    homeStrength += 0.25;
    const diff = homeStrength - awayStrength;
    const homeWinBase = clamp(38 + diff * 10, 18, 70);
    const awayWinBase = clamp(34 - diff * 10, 15, 65);
    const drawBase = clamp(100 - homeWinBase - awayWinBase, 18, 34);
    const normalized1x2 = normalizePercentages([homeWinBase, drawBase, awayWinBase]);

    result.homeWin = normalized1x2[0];
    result.draw = normalized1x2[1];
    result.awayWin = normalized1x2[2];
  }

  const expectedCorners = calculateExpectedCorners(averages);
  if (expectedCorners !== null) {
    const cornersOver85 = clamp(25 + expectedCorners * 5, 20, 78);
    result.cornersOver85 = cornersOver85;
    result.cornersUnder85 = 100 - cornersOver85;
  }

  const expectedCards = calculateExpectedCards(averages);
  if (expectedCards !== null) {
    const cardsOver35 = clamp(20 + expectedCards * 14, 18, 80);
    result.cardsOver35 = cardsOver35;
    result.cardsUnder35 = 100 - cardsOver35;
  }

  return result;
}

export function calculateImpliedProbabilities(odds: MarketNumbers) {
  return marketDefinitions.reduce(
    (result, market) => {
      const odd = safeNumber(odds[market.key]);
      result[market.key] = odd !== null && odd > 0 ? 100 / odd : null;
      return result;
    },
    {} as Record<MarketKey, NumericValue>,
  );
}

export function getUsedProbability(
  key: MarketKey,
  modelProbabilities: MarketNumbers,
  userProbabilities: Partial<Record<MarketKey, NumericValue>>,
) {
  const userValue = safeNumber(userProbabilities[key]);
  return userValue !== null ? clamp(userValue, 0, 100) : modelProbabilities[key];
}

export function calculateEdges(
  modelProbabilities: MarketNumbers,
  impliedProbabilities: Record<MarketKey, NumericValue>,
  userProbabilities: Partial<Record<MarketKey, NumericValue>>,
) {
  return marketDefinitions.reduce(
    (result, market) => {
      const implied = impliedProbabilities[market.key];
      const used = getUsedProbability(market.key, modelProbabilities, userProbabilities);
      result[market.key] = implied === null || used === null ? null : used - implied;
      return result;
    },
    {} as Record<MarketKey, NumericValue>,
  );
}

export function getEdgeStatus(edge: NumericValue) {
  if (edge === null) return "brak danych";
  if (edge > 8) return "silny sygnał value";
  if (edge >= 3) return "do obserwacji";
  if (edge >= 0) return "neutralnie";
  return "brak sygnału value";
}

export function calculateBestValueMarket(markets: MarketEdge[]) {
  const best = markets
    .filter((market) => market.edge !== null && market.edge > 0)
    .sort((a, b) => (b.edge || 0) - (a.edge || 0))[0];

  return best ? best.label : "Brak wyraźnego sygnału value";
}

export function calculateDataCompleteness(analysis: MatchAnalysisRecord): DataCompleteness {
  const basicValues = [
    analysis.basic.league,
    analysis.basic.country,
    analysis.basic.homeTeam,
    analysis.basic.awayTeam,
    analysis.basic.kickoff,
    analysis.basic.venue,
    analysis.basic.fotmobUrl,
  ];
  const homeValues = [
    ...statNumberKeys.map((key) => analysis.manualStats.home[key]),
    analysis.manualStats.home.formLast5,
  ];
  const awayValues = [
    ...statNumberKeys.map((key) => analysis.manualStats.away[key]),
    analysis.manualStats.away.formLast5,
  ];
  const oddsValues = marketDefinitions.map((market) => analysis.odds[market.key]);
  const lineupValues = [analysis.notes.lineupsNotes, analysis.notes.injuriesNotes];
  const isFilled = (value: unknown) =>
    typeof value === "string" ? value.trim().length > 0 : safeNumber(value) !== null;
  const ratioFor = (values: unknown[]) => values.filter(isFilled).length / values.length;
  const statsRatio = (team: "home" | "away", values: unknown[]) => {
    const coverage = analysis.dataSource?.coverage?.[team];
    if (!coverage) return ratioFor(values);
    const numericScore = statNumberKeys.reduce((sum, key) => {
      if (!isFilled(analysis.manualStats[team][key])) return sum;
      return sum + Math.min(5, Math.max(0, coverage[key] ?? 5)) / 5;
    }, 0);
    const formScore = analysis.manualStats[team].formLast5.trim() ? 1 : 0;
    return (numericScore + formScore) / (statNumberKeys.length + 1);
  };
  const breakdown = {
    match: ratioFor(basicValues),
    home: statsRatio("home", homeValues),
    away: statsRatio("away", awayValues),
    odds: ratioFor(oddsValues),
    lineups: ratioFor(lineupValues),
  };
  const ratio =
    breakdown.match * 0.15 +
    breakdown.home * 0.25 +
    breakdown.away * 0.25 +
    breakdown.odds * 0.25 +
    breakdown.lineups * 0.1;
  const values = [...basicValues, ...homeValues, ...awayValues, ...oddsValues, ...lineupValues];
  const filled = values.filter(isFilled).length;
  const total = values.length;
  const percent = Math.round(ratio * 100);
  const status =
    percent < 40
      ? "Niska kompletność"
      : percent < 70
        ? "Podstawowe dane"
        : percent < 90
          ? "Dobra kompletność"
          : "Kompletne dane";
  const missingCritical =
    (!hasNumber(analysis.manualStats.home.shotsForLast5) && !hasNumber(analysis.manualStats.home.xgForLast5)) ||
    (!hasNumber(analysis.manualStats.away.shotsForLast5) && !hasNumber(analysis.manualStats.away.xgForLast5)) ||
    !hasNumber(analysis.odds.homeWin) ||
    !hasNumber(analysis.odds.draw) ||
    !hasNumber(analysis.odds.awayWin);

  return {
    filled,
    total,
    missing: total - filled,
    ratio,
    percent,
    status,
    breakdown,
    missingCritical,
  };
}

export function calculateAutoRiskLevel(
  analysis: MatchAnalysisRecord,
  modelProbabilities: MarketNumbers,
  dataCompleteness: DataCompleteness,
  maxPositiveEdge: number,
): EffectiveRiskLevel {
  const home = modelProbabilities.homeWin;
  const draw = modelProbabilities.draw;
  const away = modelProbabilities.awayWin;
  const probabilities = [home, draw, away].filter((value): value is number => value !== null);
  const isEven1x2 =
    probabilities.length === 3 && Math.max(...probabilities) - Math.min(...probabilities) <= 10;
  const hasStableForms =
    analysis.manualStats.home.formLast5.trim().length >= 5 && analysis.manualStats.away.formLast5.trim().length >= 5;

  if (dataCompleteness.ratio < 0.55 || dataCompleteness.missingCritical) return "high";
  if (maxPositiveEdge > 8 && dataCompleteness.ratio < 0.72) return "high";
  if (isEven1x2) return dataCompleteness.ratio >= 0.82 && hasStableForms ? "medium" : "high";
  if (dataCompleteness.ratio >= 0.86 && hasStableForms) return "low";
  return "medium";
}

export function calculateAutoConfidence(
  analysis: MatchAnalysisRecord,
  effectiveRiskLevel: EffectiveRiskLevel,
  dataCompleteness: DataCompleteness,
) {
  let confidence = 30 + dataCompleteness.ratio * 50;

  if (hasNumber(analysis.manualStats.home.xgForLast5) || hasNumber(analysis.manualStats.away.xgForLast5)) {
    confidence += 5;
  }

  if (analysis.manualStats.home.formLast5.trim() && analysis.manualStats.away.formLast5.trim()) {
    confidence += 5;
  }

  if (analysis.notes.lineupsNotes.trim() || analysis.notes.injuriesNotes.trim()) {
    confidence += 5;
  }

  if (dataCompleteness.ratio >= 0.9) confidence += 5;
  if (dataCompleteness.missingCritical) confidence -= 8;

  if (effectiveRiskLevel === "high") {
    confidence -= 10;
  } else if (effectiveRiskLevel === "medium") {
    confidence -= 5;
  }

  return clamp(confidence, 20, 90);
}

export function calculateValueIndex(
  confidence: number,
  markets: MarketEdge[],
  riskLevel: EffectiveRiskLevel,
  dataCompleteness: DataCompleteness,
): NumericValue {
  const comparableMarkets = markets.filter(
    (market) => market.used !== null && market.implied !== null && market.edge !== null,
  );
  if (comparableMarkets.length === 0 || dataCompleteness.missingCritical || dataCompleteness.ratio < 0.4) {
    return null;
  }
  const maxPositiveEdge = Math.max(
    0,
    ...comparableMarkets.map((market) => (market.edge !== null && market.edge > 0 ? market.edge : 0)),
  );
  const riskPenalty = riskLevel === "low" ? 0 : riskLevel === "medium" ? 10 : 22;
  const value =
    maxPositiveEdge > 0 ? confidence + maxPositiveEdge * 2 - riskPenalty : confidence - riskPenalty - 15;

  return clamp(value, 0, 100);
}

export function calculateFullReportMetrics(analysis: MatchAnalysisRecord): FullReportMetrics {
  const averages = calculateAverages(analysis);
  const expected = calculateExpectedGoals(analysis, averages);
  const expectedCorners = calculateExpectedCorners(averages);
  const expectedCards = calculateExpectedCards(averages);
  const modelProbabilities = calculateModelProbabilities(analysis);
  const impliedProbabilities = calculateImpliedProbabilities(analysis.odds);
  const edge = calculateEdges(modelProbabilities, impliedProbabilities, analysis.userProbabilities);
  const markets = marketDefinitions.map((market): MarketEdge => {
    const user = safeNumber(analysis.userProbabilities[market.key]);
    const used = getUsedProbability(market.key, modelProbabilities, analysis.userProbabilities);
    const marketEdge = edge[market.key];

    return {
      key: market.key,
      label: market.label,
      odds: safeNumber(analysis.odds[market.key]),
      implied: impliedProbabilities[market.key],
      model: modelProbabilities[market.key],
      user,
      used,
      edge: marketEdge,
      status: getEdgeStatus(marketEdge),
    };
  });
  const maxPositiveEdge = Math.max(
    0,
    ...markets.map((market) => (market.edge !== null && market.edge > 0 ? market.edge : 0)),
  );
  const dataCompleteness = calculateDataCompleteness(analysis);
  const autoRiskLevel = calculateAutoRiskLevel(analysis, modelProbabilities, dataCompleteness, maxPositiveEdge);
  const effectiveRiskLevel = analysis.settings.riskLevel === "auto" ? autoRiskLevel : analysis.settings.riskLevel;
  const autoConfidence = calculateAutoConfidence(analysis, effectiveRiskLevel, dataCompleteness);
  const manualConfidence = safeNumber(analysis.settings.confidence);
  const confidence = manualConfidence !== null ? clamp(manualConfidence, 1, 100) : autoConfidence;

  return {
    averages,
    expectedHomeGoals: expected.expectedHomeGoals,
    expectedAwayGoals: expected.expectedAwayGoals,
    totalExpectedGoals: expected.totalExpectedGoals,
    expectedCorners,
    expectedCards,
    modelProbabilities,
    impliedProbabilities,
    edge,
    markets,
    bestValueMarket: calculateBestValueMarket(markets),
    valueIndex: calculateValueIndex(confidence, markets, effectiveRiskLevel, dataCompleteness),
    autoConfidence,
    confidence,
    autoRiskLevel,
    effectiveRiskLevel,
    dataCompleteness,
    maxPositiveEdge,
  };
}
