import type {
  FullReportMetrics,
  MarketEdge,
  MarketKey,
  MarketNumbers,
  MatchAnalysisRecord,
  TeamAverages,
  TeamManualStats,
} from "./types";

export const marketDefinitions: Array<{ key: MarketKey; label: string }> = [
  { key: "homeWin", label: "1" },
  { key: "draw", label: "X" },
  { key: "awayWin", label: "2" },
  { key: "over25", label: "over 2.5" },
  { key: "under25", label: "under 2.5" },
  { key: "bttsYes", label: "BTTS tak" },
  { key: "bttsNo", label: "BTTS nie" },
  { key: "cornersOver85", label: "rożne over 8.5" },
  { key: "cornersUnder85", label: "rożne under 8.5" },
  { key: "cardsOver35", label: "kartki over 3.5" },
  { key: "cardsUnder35", label: "kartki under 3.5" },
];

const emptyMarketNumbers = (): MarketNumbers => ({
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
});

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function safeNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizePercentages(values: number[]) {
  const total = values.reduce((sum, value) => sum + safeNumber(value), 0);
  if (total <= 0) {
    return values.map(() => 0);
  }

  return values.map((value) => (safeNumber(value) / total) * 100);
}

function avg(value: number) {
  return safeNumber(value) / 5;
}

function calculateTeamAverages(stats: TeamManualStats): TeamAverages {
  return {
    goalsForAvg: avg(stats.goalsForLast5),
    goalsAgainstAvg: avg(stats.goalsAgainstLast5),
    cornersForAvg: avg(stats.cornersForLast5),
    cornersAgainstAvg: avg(stats.cornersAgainstLast5),
    cardsForAvg: avg(stats.cardsForLast5),
    cardsAgainstAvg: avg(stats.cardsAgainstLast5),
    shotsForAvg: avg(stats.shotsForLast5),
    shotsAgainstAvg: avg(stats.shotsAgainstLast5),
    xgForAvg: avg(stats.xgForLast5),
    xgAgainstAvg: avg(stats.xgAgainstLast5),
  };
}

export function calculateAverages(analysis: MatchAnalysisRecord) {
  return {
    home: calculateTeamAverages(analysis.manualStats.home),
    away: calculateTeamAverages(analysis.manualStats.away),
  };
}

export function calculateModelProbabilities(analysis: MatchAnalysisRecord): MarketNumbers {
  const averages = calculateAverages(analysis);
  const { home, away } = averages;
  let expectedHomeGoals = (home.goalsForAvg + away.goalsAgainstAvg) / 2;
  let expectedAwayGoals = (away.goalsForAvg + home.goalsAgainstAvg) / 2;

  if (analysis.manualStats.home.xgForLast5 > 0) {
    expectedHomeGoals = expectedHomeGoals * 0.7 + home.xgForAvg * 0.3;
  }

  if (analysis.manualStats.away.xgForLast5 > 0) {
    expectedAwayGoals = expectedAwayGoals * 0.7 + away.xgForAvg * 0.3;
  }

  const totalExpectedGoals = expectedHomeGoals + expectedAwayGoals;
  const over25 = clamp(25 + totalExpectedGoals * 13, 25, 78);
  const under25 = 100 - over25;
  const homeScoreChance = clamp(expectedHomeGoals * 35, 15, 85);
  const awayScoreChance = clamp(expectedAwayGoals * 35, 15, 85);
  const bttsYes = clamp((homeScoreChance + awayScoreChance) / 2, 20, 80);
  const bttsNo = 100 - bttsYes;

  let homeStrength =
    home.goalsForAvg * 1.2 +
    home.shotsForAvg * 0.08 +
    home.cornersForAvg * 0.06 -
    home.goalsAgainstAvg * 0.9;
  const awayStrength =
    away.goalsForAvg * 1.2 +
    away.shotsForAvg * 0.08 +
    away.cornersForAvg * 0.06 -
    away.goalsAgainstAvg * 0.9;

  homeStrength += 0.25;
  const diff = homeStrength - awayStrength;
  const normalized1x2 = normalizePercentages([
    clamp(38 + diff * 10, 18, 70),
    clamp(100 - clamp(38 + diff * 10, 18, 70) - clamp(34 - diff * 10, 15, 65), 18, 34),
    clamp(34 - diff * 10, 15, 65),
  ]);

  const expectedCorners =
    (home.cornersForAvg + away.cornersForAvg + home.cornersAgainstAvg + away.cornersAgainstAvg) / 2;
  const cornersOver85 = clamp(25 + expectedCorners * 5, 20, 78);
  const cornersUnder85 = 100 - cornersOver85;
  const expectedCards = (home.cardsForAvg + away.cardsForAvg) / 2;
  const cardsOver35 = clamp(20 + expectedCards * 14, 18, 80);
  const cardsUnder35 = 100 - cardsOver35;

  return {
    homeWin: normalized1x2[0],
    draw: normalized1x2[1],
    awayWin: normalized1x2[2],
    over25,
    under25,
    bttsYes,
    bttsNo,
    cornersOver85,
    cornersUnder85,
    cardsOver35,
    cardsUnder35,
  };
}

export function calculateImpliedProbabilities(odds: MarketNumbers) {
  return marketDefinitions.reduce(
    (result, market) => {
      const odd = safeNumber(odds[market.key]);
      result[market.key] = odd > 0 ? 100 / odd : null;
      return result;
    },
    {} as Record<MarketKey, number | null>,
  );
}

export function getUsedProbability(
  key: MarketKey,
  modelProbabilities: MarketNumbers,
  userProbabilities: Partial<Record<MarketKey, number>>,
) {
  const userValue = safeNumber(userProbabilities[key]);
  return userValue > 0 ? userValue : modelProbabilities[key];
}

export function calculateEdges(
  modelProbabilities: MarketNumbers,
  impliedProbabilities: Record<MarketKey, number | null>,
  userProbabilities: Partial<Record<MarketKey, number>>,
) {
  return marketDefinitions.reduce(
    (result, market) => {
      const implied = impliedProbabilities[market.key];
      if (implied === null) {
        result[market.key] = null;
      } else {
        result[market.key] = getUsedProbability(market.key, modelProbabilities, userProbabilities) - implied;
      }
      return result;
    },
    {} as Record<MarketKey, number | null>,
  );
}

export function getEdgeStatus(edge: number | null) {
  if (edge === null) return "brak danych";
  if (edge > 8) return "wysoki value signal";
  if (edge >= 3) return "do obserwacji";
  if (edge >= 0) return "neutralnie";
  return "brak value";
}

export function calculateBestValueMarket(markets: MarketEdge[]) {
  const best = markets
    .filter((market) => market.edge !== null && market.edge > 0)
    .sort((a, b) => (b.edge || 0) - (a.edge || 0))[0];

  return best ? best.label : "Brak wyraźnego value signal";
}

export function calculateAutoConfidence(analysis: MatchAnalysisRecord) {
  let confidence = 55;

  if (analysis.manualStats.home.xgForLast5 > 0 || analysis.manualStats.away.xgForLast5 > 0) {
    confidence += 5;
  }

  if (analysis.manualStats.home.formLast5.trim() && analysis.manualStats.away.formLast5.trim()) {
    confidence += 5;
  }

  if (analysis.notes.lineupsNotes.trim() || analysis.notes.injuriesNotes.trim()) {
    confidence += 5;
  }

  if (analysis.settings.riskLevel === "high") {
    confidence -= 10;
  } else if (analysis.settings.riskLevel === "medium") {
    confidence -= 5;
  }

  return clamp(confidence, 30, 85);
}

export function calculateValueIndex(
  confidence: number,
  markets: MarketEdge[],
  riskLevel: MatchAnalysisRecord["settings"]["riskLevel"],
) {
  const maxPositiveEdge = Math.max(
    0,
    ...markets.map((market) => (market.edge !== null && market.edge > 0 ? market.edge : 0)),
  );
  const riskPenalty = riskLevel === "low" ? 0 : riskLevel === "medium" ? 10 : 22;
  const value =
    maxPositiveEdge > 0 ? confidence + maxPositiveEdge * 2 - riskPenalty : confidence - riskPenalty - 15;

  return clamp(value, 0, 100);
}

export function calculateFullReportMetrics(analysis: MatchAnalysisRecord): FullReportMetrics {
  const averages = calculateAverages(analysis);
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
      user: user > 0 ? user : null,
      used,
      edge: marketEdge,
      status: getEdgeStatus(marketEdge),
    };
  });

  let expectedHomeGoals = (averages.home.goalsForAvg + averages.away.goalsAgainstAvg) / 2;
  let expectedAwayGoals = (averages.away.goalsForAvg + averages.home.goalsAgainstAvg) / 2;

  if (analysis.manualStats.home.xgForLast5 > 0) {
    expectedHomeGoals = expectedHomeGoals * 0.7 + averages.home.xgForAvg * 0.3;
  }

  if (analysis.manualStats.away.xgForLast5 > 0) {
    expectedAwayGoals = expectedAwayGoals * 0.7 + averages.away.xgForAvg * 0.3;
  }

  const expectedCorners =
    (averages.home.cornersForAvg +
      averages.away.cornersForAvg +
      averages.home.cornersAgainstAvg +
      averages.away.cornersAgainstAvg) /
    2;
  const expectedCards = (averages.home.cardsForAvg + averages.away.cardsForAvg) / 2;
  const autoConfidence = calculateAutoConfidence(analysis);
  const manualConfidence = safeNumber(analysis.settings.confidence);
  const confidence = manualConfidence > 0 ? clamp(manualConfidence, 1, 100) : autoConfidence;

  return {
    averages,
    expectedHomeGoals,
    expectedAwayGoals,
    totalExpectedGoals: expectedHomeGoals + expectedAwayGoals,
    expectedCorners,
    expectedCards,
    modelProbabilities: { ...emptyMarketNumbers(), ...modelProbabilities },
    impliedProbabilities,
    edge,
    markets,
    bestValueMarket: calculateBestValueMarket(markets),
    valueIndex: calculateValueIndex(confidence, markets, analysis.settings.riskLevel),
    autoConfidence,
    confidence,
  };
}
