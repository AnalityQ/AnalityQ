import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/server/analysis-repository", () => {
  class AnalysisRepositoryError extends Error {}
  return {
    AnalysisRepositoryError,
    getAdminAnalyses: vi.fn().mockResolvedValue([]),
    createAdminAnalysis: vi.fn().mockImplementation(async (analysis) => analysis),
    updateAdminAnalysis: vi.fn().mockImplementation(async (_id, analysis) => analysis),
    deleteAdminAnalysis: vi.fn().mockResolvedValue(undefined),
    setAdminPublicationStatus: vi.fn().mockImplementation(async (id, status) => ({ id, publicationStatus: status })),
    duplicateAdminAnalysis: vi.fn().mockImplementation(async (id) => ({ id: `copy-${id}` })),
    importAdminAnalyses: vi.fn().mockResolvedValue([]),
  };
});

const unauthorizedMessage = "Brak uprawnień do wykonania tej operacji.";

async function expectUnauthorized(response: Response) {
  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toMatchObject({
    error: { code: "UNAUTHORIZED", message: unauthorizedMessage },
  });
}

async function authenticatedHeaders() {
  vi.stubEnv("STUDIO_PASSWORD", "test-studio-password");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  const { createStudioSessionToken, studioSessionCookieName } = await import(
    "@/lib/server/studio-session"
  );
  const token = createStudioSessionToken();
  if (!token) throw new Error("Nie udało się utworzyć sesji testowej.");
  return {
    "Content-Type": "application/json",
    cookie: `${studioSessionCookieName}=${token}`,
  };
}

describe("chronione endpointy Studio", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blokuje tworzenie bez sesji", async () => {
    const { POST } = await import("./analyses/route");
    await expectUnauthorized(await POST(new Request("http://localhost/api/studio/analyses", {
      method: "POST",
      body: JSON.stringify({ analysis: { id: "new" } }),
    })));
  });

  it("blokuje edycję bez sesji", async () => {
    const { PATCH } = await import("./analyses/[id]/route");
    await expectUnauthorized(await PATCH(
      new Request("http://localhost/api/studio/analyses/a", {
        method: "PATCH",
        body: JSON.stringify({ analysis: { id: "a" } }),
      }),
      { params: Promise.resolve({ id: "a" }) },
    ));
  });

  it("blokuje usuwanie bez sesji", async () => {
    const { DELETE } = await import("./analyses/[id]/route");
    await expectUnauthorized(await DELETE(
      new Request("http://localhost/api/studio/analyses/a", { method: "DELETE" }),
      { params: Promise.resolve({ id: "a" }) },
    ));
  });

  it("blokuje publikację bez sesji", async () => {
    const { POST } = await import("./analyses/[id]/status/route");
    await expectUnauthorized(await POST(
      new Request("http://localhost/api/studio/analyses/a/status", {
        method: "POST",
        body: JSON.stringify({ status: "published" }),
      }),
      { params: Promise.resolve({ id: "a" }) },
    ));
  });

  it("traktuje uszkodzone cookie jak brak sesji", async () => {
    const { POST } = await import("./analyses/route");
    await expectUnauthorized(await POST(new Request("http://localhost/api/studio/analyses", {
      method: "POST",
      headers: { cookie: "analityq_studio_session=%" },
      body: JSON.stringify({ analysis: { id: "new" } }),
    })));
  });

  it("blokuje import i migrację lokalnych danych bez sesji", async () => {
    const { POST } = await import("./analyses/import/route");
    await expectUnauthorized(await POST(new Request("http://localhost/api/studio/analyses/import", {
      method: "POST",
      body: JSON.stringify({ data: [] }),
    })));
  });

  it("poprawna sesja pozwala na operację administracyjną", async () => {
    const repository = await import("@/lib/server/analysis-repository");
    const { POST } = await import("./analyses/route");
    const response = await POST(new Request("http://localhost/api/studio/analyses", {
      method: "POST",
      headers: await authenticatedHeaders(),
      body: JSON.stringify({ analysis: { id: "allowed" } }),
    }));

    expect(response.status).toBe(201);
    expect(repository.createAdminAnalysis).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toMatchObject({ data: { id: "allowed" } });
  });

  it("logowanie ustawia httpOnly cookie, a wylogowanie je usuwa", async () => {
    vi.stubEnv("STUDIO_PASSWORD", "test-studio-password");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    const { POST, DELETE } = await import("./session/route");
    const loginResponse = await POST(new Request("http://localhost/api/studio/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "studio-login-cookie-test",
      },
      body: JSON.stringify({ password: "test-studio-password" }),
    }));

    expect(loginResponse.status).toBe(200);
    const cookie = loginResponse.headers.get("set-cookie") || "";
    expect(cookie).toContain("analityq_studio_session=");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=strict");

    const logoutResponse = await DELETE();
    expect(logoutResponse.headers.get("set-cookie")?.toLowerCase()).toContain("max-age=0");
  });
});
