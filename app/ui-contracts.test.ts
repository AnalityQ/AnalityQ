import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relative: string) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

describe("kontrakty publicznego UI", () => {
  it("klient używa względnych tras API, a nie localhost", () => {
    const clientFiles = [
      "app/components/admin/AnalysisFormModal.tsx",
      "app/components/admin/MatchImportModal.tsx",
      "lib/database.ts",
    ].map(read).join("\n");
    expect(clientFiles).toContain('fetch("/api/football/match-import"');
    expect(clientFiles).not.toMatch(/https?:\/\/localhost(?::\d+)?\/api\//);
  });

  it("Mecz dnia ma duże KPI, stan reduced motion i ochronę mobile 320 px", () => {
    const css = read("app/globals.css");
    expect(css).toContain(".home-featured-metrics strong");
    expect(css).toMatch(/font-size:\s*clamp\(2rem/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (max-width: 350px)");
    expect(css).toContain("overflow: hidden");
    expect(css).toContain("pointer-events: none");
  });
});
