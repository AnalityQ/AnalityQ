import { describe, expect, it } from "vitest";
import { selectFeaturedAnalysis } from "./featured-analysis";
import { createEmptyAnalysis } from "./storage";

function analysis(slot: number, kickoff: string, published = true) {
  return {
    ...createEmptyAnalysis(slot),
    id: `analysis-${slot}`,
    basic: { ...createEmptyAnalysis(slot).basic, kickoff },
    publicationStatus: published ? "published" as const : "draft" as const,
  };
}

describe("selectFeaturedAnalysis", () => {
  it("wybiera ręcznie ustawiony mecz dnia", () => {
    const nearest = analysis(1, "2026-07-14T18:00:00Z");
    const featured = { ...analysis(2, "2026-07-20T18:00:00Z"), featuredType: "match_of_the_day" as const };
    expect(selectFeaturedAnalysis([nearest, featured], new Date("2026-07-13T12:00:00Z"))?.id)
      .toBe(featured.id);
  });

  it("bez ręcznego wyboru wskazuje najbliższy przyszły opublikowany mecz", () => {
    const first = analysis(1, "2026-07-15T18:00:00Z");
    const nearest = analysis(2, "2026-07-14T18:00:00Z");
    const draft = analysis(3, "2026-07-13T13:00:00Z", false);
    expect(selectFeaturedAnalysis([first, nearest, draft], new Date("2026-07-13T12:00:00Z"))?.id)
      .toBe(nearest.id);
  });

  it("gdy nie ma przyszłych spotkań, wybiera ostatni opublikowany mecz", () => {
    const older = analysis(1, "2026-07-10T18:00:00Z");
    const latest = analysis(2, "2026-07-12T18:00:00Z");
    expect(selectFeaturedAnalysis([older, latest], new Date("2026-07-13T12:00:00Z"))?.id)
      .toBe(latest.id);
  });
});
