import { describe, expect, it } from "vitest";
import {
  countryFlagEmoji,
  countryFlagUrl,
  countryPresentation,
  localizeCompetitionName,
  localizePublicText,
  localizeRoundName,
  localizeTeamName,
  teamGenitive,
  teamVerb,
} from "./countries";

describe("identyfikacja krajów", () => {
  it("mapuje nazwy API na polską nazwę i kod flagi", () => {
    expect(countryPresentation("Sweden")).toEqual({ countryCode: "SE", countryName: "Szwecja" });
    expect(countryPresentation("Poland")).toEqual({ countryCode: "PL", countryName: "Polska" });
    expect(countryPresentation("Argentina")).toEqual({ countryCode: "AR", countryName: "Argentyna" });
  });

  it("tworzy flagę wyłącznie dla pewnego dwuliterowego kodu", () => {
    expect(countryFlagEmoji("SE")).toBe("🇸🇪");
    expect(countryFlagEmoji("GB-ENG")).toBeNull();
    expect(countryFlagEmoji(null)).toBeNull();
  });

  it("zachowuje nieznaną nazwę bez zgadywania kodu", () => {
    expect(countryPresentation("Nieznana federacja")).toEqual({
      countryCode: null,
      countryName: "Nieznana federacja",
    });
  });

  it("lokalizuje reprezentacje Francji i Hiszpanii wraz z odmianą", () => {
    expect(localizeTeamName("France")).toBe("Francja");
    expect(localizeTeamName("Spain")).toBe("Hiszpania");
    expect(teamGenitive("France")).toBe("Francji");
    expect(teamGenitive("Spain")).toBe("Hiszpanii");
    expect(countryFlagUrl("France")).toBe("https://media.api-sports.io/flags/fr.svg");
    expect(countryFlagUrl("Spain")).toBe("https://media.api-sports.io/flags/es.svg");
  });

  it("obsługuje flagi i polskie nazwy reprezentacji spotykanych w API-Football", () => {
    expect(countryFlagUrl("England", "GB-ENG")).toBe("https://media.api-sports.io/flags/gb.svg");
    expect(countryPresentation("Ivory Coast")).toEqual({ countryCode: "CI", countryName: "Wybrzeże Kości Słoniowej" });
    expect(countryPresentation("United States")).toEqual({ countryCode: "US", countryName: "Stany Zjednoczone" });
    expect(countryPresentation("South Korea")).toEqual({ countryCode: "KR", countryName: "Korea Południowa" });
    expect(countryPresentation("DR Congo")).toEqual({ countryCode: "CD", countryName: "Demokratyczna Republika Konga" });
    expect(countryPresentation("Cape Verde")).toEqual({ countryCode: "CV", countryName: "Republika Zielonego Przylądka" });
  });

  it("dobiera rodzaj gramatyczny czasownika do nazwy reprezentacji", () => {
    expect(teamVerb("England", "wygrał", "wygrała")).toBe("wygrała");
    expect(teamVerb("Germany", "wygrał", "wygrała")).toBe("wygrały");
    expect(teamVerb("Uruguay", "wygrał", "wygrała")).toBe("wygrał");
    expect(teamVerb("Ivory Coast", "wygrał", "wygrała")).toBe("wygrało");
  });

  it("lokalizuje turniej, rundę i teksty starszych raportów", () => {
    expect(localizeCompetitionName("World Cup")).toBe("Mistrzostwa świata");
    expect(localizeRoundName("Semi-finals")).toBe("Półfinał");
    const text = localizePublicText("France zdobywał średnio 2,8 gola, a Spain tracił 0,3. Różnica wynosi 2 punktów.");
    expect(text).toBe("Francja zdobywała średnio 2,8 gola, a Hiszpania traciła 0,3. Różnica wynosi 2 punkty.");
    expect(text).not.toContain("France");
    expect(text).not.toContain("Spain");
    expect(text).not.toContain("kluczowe strony France");
  });

  it("poprawia odmianę reprezentacji i liczebniki w historycznych podsumowaniach", () => {
    const text = localizePublicText(
      "Atak England a strzały dopuszczane przez Argentina. England oddawał celne strzały, a Argentina dopuszczał okazje. Celne strzały England. 5 meczów England u siebie. 1 nieobecnych i 1 rekordów.",
    );
    expect(text).toContain("Atak Anglii a strzały dopuszczane przez reprezentację Argentyny");
    expect(text).toContain("Anglia oddawała");
    expect(text).toContain("Argentyna dopuszczała");
    expect(text).toContain("Celne strzały Anglii");
    expect(text).toContain("5 meczów reprezentacji Anglii u siebie");
    expect(text).toContain("1 nieobecny i 1 rekord");
    expect(localizePublicText("England zdobywał u siebie 2 gole i tracił 1. Argentina na wyjazdach zdobywał 1 gol, a tracił 2."))
      .toBe("Anglia zdobywała u siebie 2 gole i traciła 1. Argentyna na wyjazdach zdobywała 1 gol, a traciła 2.");
  });
});
