import { describe, expect, it } from "vitest";
import { legacyLeagueLogo, legacyTeamLogo, normalizeApiAssetUrl } from "./assets";

describe("normalizacja zasobów API-Football", () => {
  it("obsługuje URL-e względne i protokołowe bez hardkodowania hosta klienta", () => {
    expect(normalizeApiAssetUrl("/football/teams/2.png")).toBe("https://media.api-sports.io/football/teams/2.png");
    expect(normalizeApiAssetUrl("//media.api-sports.io/flags/fr.svg")).toBe("https://media.api-sports.io/flags/fr.svg");
    expect(normalizeApiAssetUrl("http://media.api-sports.io/football/teams/2.png")).toBeNull();
  });

  it("odczytuje wcześniejsze lokalizacje pól logo w raportach legacy", () => {
    expect(legacyTeamLogo({ teamLogo: "/football/teams/2.png" })).toBe("https://media.api-sports.io/football/teams/2.png");
    expect(legacyTeamLogo({ crest: "/football/teams/9.png" })).toBe("https://media.api-sports.io/football/teams/9.png");
    expect(legacyLeagueLogo({ image: "/football/leagues/1.png" })).toBe("https://media.api-sports.io/football/leagues/1.png");
  });
});
