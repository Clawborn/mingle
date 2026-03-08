// In-memory rate limiter (works per serverless instance, good enough for moderate traffic)
// For heavy traffic, swap to Redis/Upstash

const store = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check rate limit for a key.
 * @param key - unique identifier (e.g. participant token or IP)
 * @param maxRequests - max requests per window (default: 1)
 * @param windowMs - window in ms (default: 60000 = 1 min)
 */
export function checkRateLimit(
  key: string,
  maxRequests = 1,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count < maxRequests) {
    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
  }

  return {
    allowed: false,
    remaining: 0,
    retryAfterMs: entry.resetAt - now,
  };
}

/** Convenience: returns NextResponse if rate limited, null if OK */
export function rateLimitResponse(key: string, maxRequests = 1, windowMs = 60_000) {
  const result = checkRateLimit(key, maxRequests, windowMs);
  if (!result.allowed) {
    return {
      error: "发言太频繁，请稍后再试",
      retry_after_seconds: Math.ceil(result.retryAfterMs / 1000),
    };
  }
  return null;
}
