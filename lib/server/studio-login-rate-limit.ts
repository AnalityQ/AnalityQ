import "server-only";

type LoginRateLimitState = Map<string, { count: number; resetAt: number }>;

const loginRateLimitGlobal = globalThis as typeof globalThis & {
  __analityqStudioLoginRateLimit?: LoginRateLimitState;
};
const loginRateLimit = loginRateLimitGlobal.__analityqStudioLoginRateLimit ?? new Map();
loginRateLimitGlobal.__analityqStudioLoginRateLimit = loginRateLimit;

export function checkStudioLoginRateLimit(request: Request) {
  const forwarded = (
    request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip")
  )?.split(",")[0]?.trim();
  const key = forwarded || "local";
  const now = Date.now();
  const current = loginRateLimit.get(key);

  if (!current || current.resetAt <= now) {
    loginRateLimit.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return true;
  }

  if (current.count >= 8) return false;
  current.count += 1;
  return true;
}
