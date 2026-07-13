import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getCachedMock = vi.hoisted(() => vi.fn());
const setCachedMock = vi.hoisted(() => vi.fn());
vi.mock("./cache", () => ({
  getCached: getCachedMock,
  setCached: setCachedMock,
}));

describe("apiFootballRequest diagnostyka", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    getCachedMock.mockReset();
    setCachedMock.mockReset();
  });

  it("loguje oczyszczone envelope.errors bez ujawniania klucza", async () => {
    vi.stubEnv("FOOTBALL_API_KEY", "test-only-key");
    vi.stubEnv("NODE_ENV", "production");
    getCachedMock.mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: { query: "invalid\nparameter\ttest-only-key" },
          }),
          { status: 200 },
        ),
      ),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { apiFootballRequest } = await import("./client");
    await expect(
      apiFootballRequest("/fixtures", { team: 7 }, { cacheTtlMs: 1_000 }),
    ).rejects.toMatchObject({ code: "PROVIDER_ERROR", status: 502 });

    expect(consoleError).toHaveBeenCalledWith(
      "[API-Football] Provider response errors",
      {
      endpoint: "/fixtures",
      status: 200,
        params: { team: 7 },
        errors: ["invalid parameter [REDACTED]"],
      },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("test-only-key");
  });

  it("loguje błąd HTTP po jednokrotnym odczycie body i maskuje klucz", async () => {
    vi.stubEnv("FOOTBALL_API_KEY", "test-only-key");
    vi.stubEnv("NODE_ENV", "production");
    getCachedMock.mockResolvedValue(null);
    const text = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ message: "test-only-key" }));
    const json = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502, text, json }));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { apiFootballRequest } = await import("./client");
    await expect(
      apiFootballRequest(
        "/fixtures",
        { team: 7, apiKey: "test-only-key" },
        { cacheTtlMs: 1_000 },
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_ERROR", status: 502 });

    expect(consoleError).toHaveBeenCalledWith(
      "[API-Football] Provider HTTP error",
      {
        endpoint: "/fixtures",
        status: 502,
        params: { team: 7, apiKey: "[REDACTED]" },
        response: JSON.stringify({ message: "[REDACTED]" }),
      },
    );
    expect(text).toHaveBeenCalledOnce();
    expect(json).not.toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("test-only-key");
  });
});
