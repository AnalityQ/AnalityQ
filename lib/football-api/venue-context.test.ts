import { describe, expect, it } from "vitest";
import { resolveVenueContext } from "./venue-context";

function fixture(leagueName: string, round: string | null) {
  return {
    leagueName,
    leagueCountry: "World",
    round,
    venueName: "Stadion testowy",
    venueCity: "Miasto",
  };
}

describe("resolveVenueContext", () => {
  it("traktuje turniej finałowy mistrzostw świata jako teren neutralny", () => {
    expect(resolveVenueContext(fixture("World Cup", "Group Stage - 1")).mode).toBe("neutral");
  });

  it("nie traktuje eliminacji mistrzostw świata jako terenu neutralnego", () => {
    expect(resolveVenueContext(fixture("World Cup - Qualification Europe", "Group Stage - 1")).mode).toBe("home_away");
  });

  it("zachowuje dom i wyjazd w Lidze Mistrzów", () => {
    expect(resolveVenueContext(fixture("UEFA Champions League", "League Stage - 4")).mode).toBe("home_away");
  });

  it("traktuje jednomeczowy finał jako neutralny", () => {
    expect(resolveVenueContext(fixture("UEFA Champions League", "Final")).mode).toBe("neutral");
  });
});
