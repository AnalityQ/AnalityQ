import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

function sourceFiles(directory: string): string[] {
  return readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(relative);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes(".test.") ? [relative] : [];
  });
}

const applicationSourceFiles = [...sourceFiles("app"), ...sourceFiles("lib")];

describe("granice bezpieczeństwa", () => {
  it("publiczny odczyt oraz RLS dopuszczają wyłącznie published", () => {
    const publicRepository = read("lib/server/public-analysis-repository.ts");
    const migration = read("supabase/migrations/20260712103027_secure_analysis_rls.sql");
    const schema = read("supabase/schema.sql");

    expect(publicRepository).toContain('.eq("publication_status", "published")');
    for (const sql of [migration, schema]) {
      expect(sql).toContain("grant select on table public.analyses to anon");
      expect(sql).toContain("using (publication_status = 'published')");
      expect(sql).not.toMatch(/grant\s+[^;]*(insert|update|delete)[^;]*\s+to\s+anon/i);
      expect(sql).not.toMatch(/create policy "Prototypow(?:y|a|e)[^"]*"[^;]+/i);
    }
  });

  it("service role występuje wyłącznie w modułach oznaczonych jako server-only", () => {
    for (const file of applicationSourceFiles) {
      const source = read(file);
      if (!source.includes("SUPABASE_SERVICE_ROLE_KEY")) continue;
      expect(source, file).toContain('import "server-only"');
      expect(source, file).not.toMatch(/^\s*["']use client["']/m);
    }
  });

  it("hasło Studio nie jest wpisane na sztywno do kodu klienta", () => {
    const source = applicationSourceFiles.map(read).join("\n");
    const previousPassword = ["analityq", "1313"].join("");

    expect(source).not.toContain(previousPassword);
    expect(source).not.toMatch(/STUDIO_PASSWORD\s*=\s*["']/);
  });
});
