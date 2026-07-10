export type PublicationStatus = "draft" | "published" | "archived";
export type AccessStatus = "free" | "premium";
export type DataLevel = "basic" | "advanced";
export type RiskLevel = "low" | "medium" | "high";
export type SourceMode = "manual";

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
  goalsForLast5: number;
  goalsAgainstLast5: number;
  cornersForLast5: number;
  cornersAgainstLast5: number;
  cardsForLast5: number;
  cardsAgainstLast5: number;
  shotsForLast5: number;
  shotsAgainstLast5: number;
  xgForLast5: number;
  xgAgainstLast5: number;
  formLast5: string;
};

export type MarketNumbers = Record<MarketKey, number>;
export type UserProbabilities = Partial<Record<MarketKey, number>>;

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
  confidence: number;
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
  goalsForAvg: number;
  goalsAgainstAvg: number;
  cornersForAvg: number;
  cornersAgainstAvg: number;
  cardsForAvg: number;
  cardsAgainstAvg: number;
  shotsForAvg: number;
  shotsAgainstAvg: number;
  xgForAvg: number;
  xgAgainstAvg: number;
};

export type MarketEdge = {
  key: MarketKey;
  label: string;
  odds: number;
  implied: number | null;
  model: number;
  user: number | null;
  used: number;
  edge: number | null;
  status: string;
};

export type FullReportMetrics = {
  averages: {
    home: TeamAverages;
    away: TeamAverages;
  };
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  totalExpectedGoals: number;
  expectedCorners: number;
  expectedCards: number;
  modelProbabilities: MarketNumbers;
  impliedProbabilities: Record<MarketKey, number | null>;
  edge: Record<MarketKey, number | null>;
  markets: MarketEdge[];
  bestValueMarket: string;
  valueIndex: number;
  autoConfidence: number;
  confidence: number;
};
