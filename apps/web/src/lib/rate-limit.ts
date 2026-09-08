/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Good enough for a single-instance deployment (Vercel serverless shares
 * memory across invocations within the same function instance). For
 * multi-instance production, swap to Redis-backed limiting.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check whether a request from `key` (typically an IP) is within the rate
 * limit. Returns whether the request is allowed, how many requests remain,
 * and when the window resets.
 *
 * @param key       unique identifier (IP address, user ID, etc.)
 * @param maxHits   maximum requests per window
 * @param windowMs  window duration in milliseconds
 */
export function rateLimit(
  key: string,
  maxHits: number,
  windowMs: number,
): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  if (entry.timestamps.length >= maxHits) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + windowMs,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxHits - entry.timestamps.length,
    resetAt: now + windowMs,
  };
}

/**
 * Extract a client identifier from the request for rate limiting.
 * Checks forwarded headers first (behind proxies like Vercel), then
 * falls back to a generic key.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
