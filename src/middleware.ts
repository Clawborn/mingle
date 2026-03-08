import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit store (per serverless instance)
// For production scale, use Upstash Redis (@upstash/ratelimit)
const tokenBuckets = new Map<string, { count: number; resetAt: number }>();

// Cleanup every 5 min
if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as { _rlCleanup?: boolean };
  if (!g._rlCleanup) {
    g._rlCleanup = true;
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of tokenBuckets) {
        if (v.resetAt < now) tokenBuckets.delete(k);
      }
    }, 5 * 60_000);
  }
}

function isRateLimited(key: string, max: number, windowMs: number): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = tokenBuckets.get(key);

  if (!entry || entry.resetAt < now) {
    tokenBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }

  if (entry.count < max) {
    entry.count++;
    return { limited: false, retryAfter: 0 };
  }

  return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
}

// Rate limit config per endpoint pattern
const RATE_LIMITS: { pattern: RegExp; max: number; windowMs: number; keyFn?: string }[] = [
  // Bot write actions: 1 per 30 seconds per token
  { pattern: /\/api\/events\/[^/]+\/chat$/, max: 1, windowMs: 30_000 },
  { pattern: /\/api\/events\/[^/]+\/live-chat$/, max: 1, windowMs: 30_000 },
  { pattern: /\/api\/events\/[^/]+\/scene$/, max: 1, windowMs: 30_000 },
  { pattern: /\/api\/roast\/[^/]+\/fire$/, max: 1, windowMs: 30_000 },
  { pattern: /\/api\/arena\/[^/]+\/move$/, max: 1, windowMs: 30_000 },
  { pattern: /\/api\/mystery\/[^/]+\/speak$/, max: 1, windowMs: 30_000 },
  { pattern: /\/api\/world\/action$/, max: 1, windowMs: 30_000 },
  { pattern: /\/api\/world\/move$/, max: 1, windowMs: 30_000 },
  { pattern: /\/api\/world\/build$/, max: 1, windowMs: 30_000 },

  // Bot join/create: 3 per 5 minutes
  { pattern: /\/api\/events\/[^/]+\/register$/, max: 3, windowMs: 300_000 },
  { pattern: /\/api\/roast\/create$/, max: 3, windowMs: 300_000 },
  { pattern: /\/api\/arena\/create$/, max: 3, windowMs: 300_000 },
  { pattern: /\/api\/mystery\/create$/, max: 3, windowMs: 300_000 },

  // Read endpoints: 30 per minute per IP (prevent scraping)
  { pattern: /\/api\/events\/[^/]+\/heartbeat$/, max: 6, windowMs: 60_000 },
  { pattern: /\/api\//, max: 30, windowMs: 60_000, keyFn: "ip" },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // Skip GET list/screen endpoints (they're public)
  if (request.method === "GET" && (pathname.includes("/list") || pathname.includes("/screen"))) {
    return NextResponse.next();
  }

  // Find matching rate limit rule
  for (const rule of RATE_LIMITS) {
    if (!rule.pattern.test(pathname)) continue;

    // Determine rate limit key
    let key: string;
    if (rule.keyFn === "ip") {
      key = `ip:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}:${pathname}`;
    } else {
      // Use bearer token as key
      const auth = request.headers.get("authorization") || "";
      const token = auth.replace(/^Bearer\s+/i, "");
      if (!token) break; // No token = no rate limit by token (auth will reject anyway)
      key = `token:${token}:${rule.pattern.source}`;
    }

    const { limited, retryAfter } = isRateLimited(key, rule.max, rule.windowMs);
    if (limited) {
      return NextResponse.json(
        {
          error: "请求太频繁，请稍后再试",
          retry_after_seconds: retryAfter,
          hint: `每 ${Math.round(rule.windowMs / 1000)} 秒最多 ${rule.max} 次`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    break; // Only apply first matching rule
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
