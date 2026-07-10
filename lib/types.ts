export type PublicationStatus = "draft" | "published" | "archived";
export type AccessStatus = "free" | "premium";
export type DataLevel = "basic" | "advanced";
export type RiskLevel = "auto" | "low" | "medium" | "high";
export type EffectiveRiskLevel = Exclude<RiskLevel, "auto">;
export type SourceMode = "manual";
export type NumericValue = number | null;

export type MarketKey =
  | "homeWin"
  | "draw"
  | "awayWin"
  | "over25"
  | "under25"
  | "bttsYes"
  | "bttsNo"
  | "cornersOver85"
  | "cornersUnder85"
  | "cardsOver35"
  | "cardsUnder35";

export type TeamManualStats = {
  goalsForLast5: NumericValue;
  goalsAgainstLast5: NumericValue;
  cornersForLast5: NumericValue;
  cornersAgainstLast5: NumericValue;
  cardsForLast5: NumericValue;
  cardsAgainstLast5: NumericValue;
  shotsForLast5: NumericValue;
  shotsAgainstLast5: NumericValue;
  xgForLast5: NumericValue;
  xgAgainstLast5: NumericValue;
  formLast5: string;
};

export type MarketNumbers = Record<MarketKey, NumericValue>;
export type UserProbabilities = Partial<Record<MarketKey, NumericValue>>;

export type AnalysisBasic = {
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  status: AccessStatus;
  dataLevel: DataLevel;
  fotmobUrl: string;
  venue: string;
};

export type AnalysisSettings = {
  riskLevel: RiskLevel;
  confidence: NumericValue;
  riskNote: string;
};

export type AnalysisNotes = {
  summary: string;
  homeStrengths: string;
  awayStrengths: string;
  keyRisks: string;
  scenarios: string;
  workNotes: string;
  finalAssessment: string;
  h2hNotes: string;
  lineupsNotes: string;
  injuriesNotes: string;
  generalStatsNotes: string;
};

export type PremiumSections = {
  cornersAnalysis: string;
  cardsAnalysis: string;
  shotsAnalysis: string;
  halvesAnalysis: string;
  advancedRisk: string;
  h2hAdvanced: string;
  lineupsAdvanced: string;
};

export type MatchAnalysisRecord = {
  id: string;
  slotNumber: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
  sourceMode: SourceMode;
  publicationStatus: PublicationStatus;
  basic: AnalysisBasic;
  manualStats: {
    home: TeamManualStats;
    away: TeamManualStats;
  };
  odds: MarketNumbers;
  userProbabilities: UserProbabilities;
  settings: AnalysisSettings;
  notes: AnalysisNotes;
  premiumSections: PremiumSections;
};

export type TeamAverages = {
  goalsForAvg: NumericValue;
  goalsAgainstAvg: NumericValue;
  cornersForAvg: NumericValue;
  cornersAgainstAvg: NumericValue;
  cardsForAvg: NumericValue;
  cardsAgainstAvg: NumericValue;
  shotsForAvg: NumericValue;
  shotsAgainstAvg: NumericValue;
  xgForAvg: NumericValue;
  xgAgainstAvg: NumericValue;
};

export type MarketEdge = {
  key: MarketKey;
  label: string;
  odds: NumericValue;
  implied: NumericValue;
  model: NumericValue;
  user: NumericValue;
  used: NumericValue;
  edge: NumericValue;
  status: string;
};

export type DataCompleteness = {
  filled: number;
  total: number;
  missing: number;
  ratio: number;
  missingCritical: boolean;
};

export type FullReportMetrics = {
  averages: {
    home: TeamAverages;
    away: TeamAverages;
  };
  expectedHomeGoals: NumericValue;
  expectedAwayGoals: NumericValue;
  totalExpectedGoals: NumericValue;
  expectedCorners: NumericValue;
  expectedCards: NumericValue;
  modelProbabilities: MarketNumbers;
  impliedProbabilities: Record<MarketKey, NumericValue>;
  edge: Record<MarketKey, NumericValue>;
  markets: MarketEdge[];
  bestValueMarket: string;
  valueIndex: number;
  autoConfidence: number;
  confidence: number;
  autoRiskLevel: EffectiveRiskLevel;
  effectiveRiskLevel: EffectiveRiskLevel;
  dataCompleteness: DataCompleteness;
  maxPositiveEdge: number;
};
