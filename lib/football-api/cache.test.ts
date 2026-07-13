import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type TestCache = Map<string, { value: unknown; expiresAt: number }>;
const cacheGlobal = globalThis as typeof globalThis & {
  __analityqFootballCache?: TestCache;
};

describe("cache danych piłkarskich", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    cacheGlobal.__analityqFootballCache?.clear();
  });

  afterEach(() => {
    cacheGlobal.__analityqFootballCache?.clear();
    vi.unstubAllEnvs();
  });

  it("utrzymuje twardy limit 500 aktywnych wpisów", async () => {
    const { setCached } = await import("./cache");

    for (let index = 0; index < 501; index += 1) {
      await setCached(`test:${index}`, { index }, 60 * 60 * 1000);
    }

    expect(cacheGlobal.__analityqFootballCache?.size).toBe(500);
    expect(cacheGlobal.__analityqFootballCache?.has("test:0")).toBe(false);
    expect(cacheGlobal.__analityqFootballCache?.has("test:500")).toBe(true);
  });
});
