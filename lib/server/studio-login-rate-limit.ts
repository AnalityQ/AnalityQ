import "server-only";

type LoginRateLimitState = Map<string, { count: number; resetAt: number }>;

const loginRateLimitGlobal = globalThis as typeof globalThis & {
  __analityqStudioLoginRateLimit?: LoginRateLimitState;
};
const loginRateLimit = loginRateLimitGlobal.__analityqStudioLoginRateLimit ?? new Map();
loginRateLimitGlobal.__analityqStudioLoginRateLimit = loginRateLimit;

function loginRateLimitKey(request: Request) {
  const forwarded = (
    request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip")
  )?.split(",")[0]?.trim();
  return forwarded || "local";
}

export function isStudioLoginRateLimited(request: Request, now = Date.now()) {
  const key = loginRateLimitKey(request);
  const current = loginRateLimit.get(key);

  if (!current) return false;
  if (current.resetAt <= now) {
    loginRateLimit.delete(key);
    return false;
  }
  return current.count >= 8;
}

export function recordStudioLoginFailure(request: Request, now = Date.now()) {
  const key = loginRateLimitKey(request);
  const current = loginRateLimit.get(key);

  if (!current || current.resetAt <= now) {
    loginRateLimit.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return;
  }

  current.count = Math.min(8, current.count + 1);
}

export function resetStudioLoginRateLimit(request: Request) {
  loginRateLimit.delete(loginRateLimitKey(request));
}
