import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { initialsForName, isAllowedApiImageUrl, shouldRenderApiImage, TeamLogo } from "./ApiImage";

describe("ApiImage", () => {
  it("dopuszcza wyłącznie HTTPS z domeny mediów API-Football", () => {
    expect(isAllowedApiImageUrl("https://media.api-sports.io/football/teams/364.png")).toBe(true);
    expect(isAllowedApiImageUrl("http://media.api-sports.io/football/teams/364.png")).toBe(false);
    expect(isAllowedApiImageUrl("https://example.com/logo.png")).toBe(false);
    expect(isAllowedApiImageUrl("/football/teams/364.png")).toBe(true);
    expect(isAllowedApiImageUrl("//media.api-sports.io/football/teams/364.png")).toBe(true);
  });

  it("przełącza się na fallback po błędzie ładowania", () => {
    const url = "https://media.api-sports.io/football/teams/364.png";
    expect(shouldRenderApiImage(url, false)).toBe(true);
    expect(shouldRenderApiImage(url, true)).toBe(false);
  });

  it("przy braku logo renderuje inicjały bez pustego lub uszkodzonego img", () => {
    const html = renderToStaticMarkup(<TeamLogo src={null} alt="Djurgardens IF" size={40} />);
    expect(html).toContain(initialsForName("Djurgardens IF"));
    expect(html).toContain("brak grafiki");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("undefined");
  });
});
