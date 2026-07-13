import { describe, expect, it } from "vitest";
import { countryFlagEmoji, countryPresentation } from "./countries";

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
});
