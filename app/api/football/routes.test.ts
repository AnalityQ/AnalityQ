import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("endpointy football", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("odrzuca nieprawidłową datę bez wywołania dostawcy", async () => {
    const { GET } = await import("./fixtures/route");
    const response = await GET(new Request("http://localhost/api/football/fixtures?date=2026-99-40"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_DATE" } });
  });

  it("wymaga ścisłej daty ISO dla ostatnich meczów drużyny", async () => {
    const { GET } = await import("./team-last-matches/route");
    const response = await GET(new Request(
      "http://localhost/api/football/team-last-matches?teamId=7&before=2026-07-11T12:00:00Z",
      { headers: { "x-forwarded-for": "test-strict-team-date" } },
    ));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_PARAMETERS" } });
  });

  it("zwraca bezpieczny komunikat, gdy brakuje klucza API", async () => {
    vi.stubEnv("FOOTBALL_API_KEY", "");
    const { GET } = await import("./fixtures/route");
    const response = await GET(new Request("http://localhost/api/football/fixtures?date=2026-07-11", { headers: { "x-forwarded-for": "test-missing-key" } }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "MISSING_KEY", message: "Brakuje klucza API danych piłkarskich." } });
  });

  it("normalizuje mockowaną odpowiedź i nie zwraca surowej koperty dostawcy", async () => {
    vi.stubEnv("FOOTBALL_API_KEY", "test-only");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ response: [{
      fixture: { id: 7, date: "2026-07-11T20:00:00Z", status: { short: "NS" }, venue: { name: "Arena", city: "Warszawa" } },
      league: { id: 2, name: "Liga", country: "Polska" },
      teams: { home: { id: 1, name: "Gospodarze" }, away: { id: 2, name: "Goście" } },
      goals: { home: null, away: null },
    }] }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const { GET } = await import("./fixtures/route");
    const response = await GET(new Request("http://localhost/api/football/fixtures?date=2026-07-12", { headers: { "x-forwarded-for": "test-mocked" } }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data[0]).toMatchObject({ id: 7, leagueName: "Liga", venue: "Arena, Warszawa" });
    expect(payload).not.toHaveProperty("response");
    expect(JSON.stringify(payload)).not.toContain("test-only");
  });

  it("blokuje wymuszone odświeżenie bez sesji Studio", async () => {
    const { GET } = await import("./fixtures/route");
    const response = await GET(new Request(
      "http://localhost/api/football/fixtures?date=2026-07-12&forceRefresh=true",
      { headers: { "x-forwarded-for": "test-force-refresh-unauthorized" } },
    ));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        message: "Brak uprawnień do wykonania tej operacji.",
      },
    });
  });

  it("poprawna sesja Studio pozwala na wymuszone odświeżenie", async () => {
    vi.stubEnv("STUDIO_PASSWORD", "test-studio-password");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.stubEnv("FOOTBALL_API_KEY", "test-only");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ response: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));
    const { createStudioSessionToken, studioSessionCookieName } = await import(
      "@/lib/server/studio-session"
    );
    const token = createStudioSessionToken();
    expect(token).toBeTruthy();

    const { GET } = await import("./fixtures/route");
    const response = await GET(new Request(
      "http://localhost/api/football/fixtures?date=2026-07-13&forceRefresh=true",
      {
        headers: {
          cookie: `${studioSessionCookieName}=${token}`,
          "x-vercel-forwarded-for": "test-force-refresh-authorized",
        },
      },
    ));

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("zwraca 429 po przekroczeniu limitu odczytów dla jednego IP", async () => {
    const { GET } = await import("./fixtures/route");
    const request = () => new Request(
      "http://localhost/api/football/fixtures?date=nieprawidlowa",
      { headers: { "x-vercel-forwarded-for": "test-read-rate-limit" } },
    );

    for (let index = 0; index < 60; index += 1) {
      expect((await GET(request())).status).toBe(400);
    }
    const response = await GET(request());
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        message: "Przekroczono limit zapytań. Spróbuj ponownie później.",
      },
    });
  });

  it("odrzuca nieprawidłowe ciało importu", async () => {
    vi.stubEnv("STUDIO_PASSWORD", "test-studio-password");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    const { createStudioSessionToken, studioSessionCookieName } = await import(
      "@/lib/server/studio-session"
    );
    const token = createStudioSessionToken();
    expect(token).toBeTruthy();

    const { POST } = await import("./match-import/route");
    const response = await POST(new Request("http://localhost/api/football/match-import", {
      method: "POST",
      body: "{",
      headers: {
        cookie: `${studioSessionCookieName}=${token}`,
        "x-forwarded-for": "test-invalid-import-body",
      },
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_BODY" } });
  });
});
