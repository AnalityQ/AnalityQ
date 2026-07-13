import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("sesja Studio", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("nie tworzy sesji bez skonfigurowanego hasła", async () => {
    vi.stubEnv("STUDIO_PASSWORD", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    const { createStudioSessionToken, verifyStudioPassword } = await import("./studio-session");
    expect(verifyStudioPassword("dowolne")).toBe("unconfigured");
    expect(createStudioSessionToken()).toBeNull();
  });

  it("akceptuje podpisaną sesję i odrzuca modyfikację lub wygaśnięcie", async () => {
    vi.stubEnv("STUDIO_PASSWORD", "test-studio-password");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    const { createStudioSessionToken, verifyStudioSessionToken } = await import("./studio-session");
    const now = Date.now();
    const token = createStudioSessionToken(now);
    expect(token).toBeTruthy();
    expect(verifyStudioSessionToken(token, now + 1000)).toBe(true);
    expect(verifyStudioSessionToken(`${token}x`, now + 1000)).toBe(false);
    expect(verifyStudioSessionToken(token, now + 9 * 60 * 60 * 1000)).toBe(false);
  });
});
