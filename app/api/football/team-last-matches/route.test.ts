import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const buildTeamLastMatchesMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/football-api/import-service", () => ({
  buildTeamLastMatches: buildTeamLastMatchesMock,
}));

describe("GET /api/football/team-last-matches", () => {
  afterEach(() => {
    buildTeamLastMatchesMock.mockReset();
  });

  it("zwraca 400 INVALID_PARAMETERS, gdy brakuje season", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/football/team-last-matches?teamId=364&beforeDate=2026-07-13T19%3A00%3A00%2B02%3A00&limit=5",
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_PARAMETERS" },
    });
    expect(buildTeamLastMatchesMock).not.toHaveBeenCalled();
  });

  it("przekazuje season do serwisu historii drużyny", async () => {
    buildTeamLastMatchesMock.mockResolvedValue({
      matches: [],
      aggregate: {},
      warnings: [],
    });

    const { GET } = await import("./route");
    const beforeDate = "2026-07-13T19:00:00+02:00";
    const response = await GET(
      new Request(
        "http://localhost/api/football/team-last-matches?teamId=364&season=2025&beforeDate=2026-07-13T19%3A00%3A00%2B02%3A00&limit=9&refresh=1",
      ),
    );

    expect(response.status).toBe(200);
    expect(buildTeamLastMatchesMock).toHaveBeenCalledWith(
      364,
      beforeDate,
      2025,
      5,
      true,
    );
  });
});
