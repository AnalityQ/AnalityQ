import { describe, expect, it } from "vitest";
import { rowToAnalysis, toAnalysisPayload, type AnalysisRow } from "./analysis-persistence";
import { createEmptyAnalysis } from "./storage";

function row(overrides: Partial<AnalysisRow> = {}): AnalysisRow {
  const analysis = createEmptyAnalysis(1);
  const payload = toAnalysisPayload(analysis);
  return {
    id: analysis.id,
    slot_number: 1,
    slug: analysis.slug,
    created_at: analysis.createdAt,
    updated_at: analysis.updatedAt,
    source_mode: analysis.sourceMode,
    data_source: null,
    publication_status: "published",
    basic: payload.basic,
    manual_stats: payload.manual_stats,
    odds: payload.odds,
    user_probabilities: payload.user_probabilities,
    settings: payload.settings,
    notes: payload.notes,
    premium_sections: payload.premium_sections,
    ...overrides,
  };
}

describe("zgodność zapisu meczu dnia", () => {
  it("zapisuje wyróżnienie w JSON settings bez wymagania kolumny featured_type", () => {
    const analysis = { ...createEmptyAnalysis(1), featuredType: "match_of_the_day" as const };
    const payload = toAnalysisPayload(analysis);

    expect(payload).not.toHaveProperty("featured_type");
    expect(payload.settings.featuredType).toBe("match_of_the_day");
    expect(rowToAnalysis(row({ settings: payload.settings })).featuredType).toBe("match_of_the_day");
  });

  it("nadal odczytuje starszy zapis z kolumny, jeśli jest dostępna", () => {
    expect(rowToAnalysis(row({ featured_type: "match_of_the_day" })).featuredType).toBe("match_of_the_day");
  });
});
