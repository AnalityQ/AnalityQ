import type { FootballAnalysisSnapshot, MatchFixtureData, TeamRecentData } from "./types";
import type { MatchAnalysisRecord } from "../types";

export type MatchVenueContext = {
  mode: "home_away" | "neutral";
  label: string;
  reason: string;
  venue: string | null;
};

type FixtureContext = Pick<
  MatchFixtureData,
  "leagueName" | "leagueCountry" | "round" | "venueName" | "venueCity"
>;

function normalize(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function venueLabel(fixture: Pick<FixtureContext, "venueName" | "venueCity">) {
  const parts = [fixture.venueName, fixture.venueCity].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function resolveVenueContext(fixture: FixtureContext): MatchVenueContext {
  const competition = normalize(fixture.leagueName);
  const round = normalize(fixture.round);
  const combined = `${competition} ${round}`;
  const venue = venueLabel(fixture);
  const isQualification = /(qualif|kwalif|eliminac|preliminar)/.test(combined);
  const isSingleMatchFinal = /(^|\s)(grand )?final(s)?($|\s)/.test(round)
    && !/(semi|quarter|1\/8|round of|play-off)/.test(round);
  const isFinalTournament = [
    "world cup",
    "mistrzostwa swiata",
    "uefa euro",
    "european championship",
    "mistrzostwa europy",
    "copa america",
    "africa cup of nations",
    "puchar narodow afryki",
    "asian cup",
    "puchar azji",
    "gold cup",
    "olympic",
    "olimpi",
    "confederations cup",
    "finalissima",
  ].some((name) => competition.includes(name));
  const isNationsLeagueFinals = competition.includes("nations league")
    && /(final|semi-final|third place)/.test(round);

  if (!isQualification && (isFinalTournament || isNationsLeagueFinals || isSingleMatchFinal)) {
    return {
      mode: "neutral",
      label: "Teren neutralny",
      reason: isSingleMatchFinal
        ? "Jednomeczowy finał jest liczony bez standardowej premii gospodarza."
        : "Turniej finałowy reprezentacji jest liczony bez standardowej premii gospodarza.",
      venue,
    };
  }

  return {
    mode: "home_away",
    label: "Gospodarz / wyjazd",
    reason: "Rozgrywki zachowują znaczenie roli gospodarza i drużyny wyjazdowej.",
    venue,
  };
}

export function resolveAnalysisVenueContext(analysis: MatchAnalysisRecord): MatchVenueContext {
  const fixture = analysis.dataSource?.snapshot?.fixture;
  if (fixture) return resolveVenueContext(fixture);
  return resolveVenueContext({
    leagueName: analysis.basic.league,
    leagueCountry: analysis.basic.country,
    round: null,
    venueName: analysis.basic.venue || null,
    venueCity: null,
  });
}

export function contextualSamples(snapshot: FootballAnalysisSnapshot): {
  home: TeamRecentData;
  away: TeamRecentData;
  homePlace: string;
  awayPlace: string;
} {
  const context = resolveVenueContext(snapshot.fixture);
  if (context.mode === "neutral") {
    return {
      home: snapshot.recentForm.home,
      away: snapshot.recentForm.away,
      homePlace: "ostatnie mecze ogółem",
      awayPlace: "ostatnie mecze ogółem",
    };
  }
  return {
    home: snapshot.venueSplits.homeTeamAtHome,
    away: snapshot.venueSplits.awayTeamAway,
    homePlace: "u siebie",
    awayPlace: "na wyjeździe",
  };
}
