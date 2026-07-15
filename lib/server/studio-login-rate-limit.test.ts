import { describe, expect, it, vi } from "vitest";
import {
  isStudioLoginRateLimited,
  recordStudioLoginFailure,
  resetStudioLoginRateLimit,
} from "./studio-login-rate-limit";

vi.mock("server-only", () => ({}));

function request(key: string) {
  return new Request("http://localhost/api/studio/session", {
    headers: { "x-forwarded-for": key },
  });
}

describe("limit logowania do Studio", () => {
  it("liczy wyłącznie błędne próby i pozwala wyzerować licznik po sukcesie", () => {
    const loginRequest = request("rate-limit-reset-test");
    const now = 1_000_000;
    for (let index = 0; index < 8; index += 1) recordStudioLoginFailure(loginRequest, now);
    expect(isStudioLoginRateLimited(loginRequest, now)).toBe(true);
    resetStudioLoginRateLimit(loginRequest);
    expect(isStudioLoginRateLimited(loginRequest, now)).toBe(false);
  });

  it("usuwa blokadę po upływie okna", () => {
    const loginRequest = request("rate-limit-expiry-test");
    const now = 2_000_000;
    for (let index = 0; index < 8; index += 1) recordStudioLoginFailure(loginRequest, now);
    expect(isStudioLoginRateLimited(loginRequest, now + 15 * 60_000 + 1)).toBe(false);
  });
});
