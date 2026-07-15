/**
 * In-memory fixed-window per-IP rate limiter. Caps cost and abuse on the ask
 * endpoint. State lives in module scope, so it resets on cold start; that is
 * acceptable for a single-instance portfolio endpoint and keeps the function
 * dependency-free (no Redis, no KV).
 */

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the current window resets. */
  retryAfter: number;
  /** Requests remaining in the current window. */
  remaining: number;
}

export interface RateLimiterOptions {
  /** Max requests per window. Default 10. */
  limit?: number;
  /** Window length in milliseconds. Default 10 minutes. */
  windowMs?: number;
}

interface Window {
  count: number;
  resetAt: number;
}

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;

/** Creates an isolated limiter. Separate instances do not share state. */
export function createRateLimiter(options: RateLimiterOptions = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const windows = new Map<string, Window>();

  function check(key: string, now: number = Date.now()): RateLimitResult {
    const existing = windows.get(key);

    if (!existing || now >= existing.resetAt) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, retryAfter: 0, remaining: limit - 1 };
    }

    if (existing.count >= limit) {
      return {
        ok: false,
        retryAfter: Math.ceil((existing.resetAt - now) / 1000),
        remaining: 0,
      };
    }

    existing.count += 1;
    return {
      ok: true,
      retryAfter: 0,
      remaining: limit - existing.count,
    };
  }

  /** Test/maintenance helper to drop expired windows. */
  function sweep(now: number = Date.now()): void {
    for (const [key, w] of windows) {
      if (now >= w.resetAt) windows.delete(key);
    }
  }

  return { check, sweep };
}

/** Shared limiter used by the ask endpoint: 10 requests / 10 minutes per IP. */
export const askRateLimiter = createRateLimiter();
