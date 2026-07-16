import {
  generateAutomaticSummary,
  generateMatchRisks,
  generateMatchSignals,
} from "./snapshot";
import type { FootballAnalysisSnapshot } from "./types";
import { resolveVenueContext } from "./venue-context";

export function contextualSnapshotContent(snapshot: FootballAnalysisSnapshot) {
  const venueContext = resolveVenueContext(snapshot.fixture);
  if (venueContext.mode === "home_away") {
    return {
      venueContext,
      signals: snapshot.signals,
      risks: snapshot.risks,
      automaticSummary: snapshot.automaticSummary,
    };
  }

  const signals = generateMatchSignals({
    homeName: snapshot.fixture.homeTeam.name,
    awayName: snapshot.fixture.awayTeam.name,
    homeOverall: snapshot.recentForm.home,
    awayOverall: snapshot.recentForm.away,
    homeVenue: snapshot.venueSplits.homeTeamAtHome,
    awayVenue: snapshot.venueSplits.awayTeamAway,
    standings: snapshot.standings,
    h2h: snapshot.h2h,
    injuries: snapshot.injuries,
    neutralVenue: true,
  });
  const risks = generateMatchRisks({
    homeName: snapshot.fixture.homeTeam.name,
    awayName: snapshot.fixture.awayTeam.name,
    homeOverall: snapshot.recentForm.home,
    awayOverall: snapshot.recentForm.away,
    homeVenue: snapshot.venueSplits.homeTeamAtHome,
    awayVenue: snapshot.venueSplits.awayTeamAway,
    injuries: snapshot.injuries,
    lineups: snapshot.lineups,
    neutralVenue: true,
  });
  return {
    venueContext,
    signals,
    risks,
    automaticSummary: generateAutomaticSummary({
      homeName: snapshot.fixture.homeTeam.name,
      awayName: snapshot.fixture.awayTeam.name,
      standings: snapshot.standings,
      homeVenue: snapshot.recentForm.home,
      awayVenue: snapshot.recentForm.away,
      signals,
      risks,
      injuries: snapshot.injuries,
      neutralVenue: true,
    }),
  };
}
