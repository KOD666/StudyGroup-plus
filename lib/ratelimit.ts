import { NextResponse } from "next/server";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Sliding window in-memory rate limiter for serverless endpoints
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, maxRequests: 30 }
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    const resetTime = now + options.windowMs;
    memoryStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - 1,
      resetTime,
    };
  }

  if (record.count >= options.maxRequests) {
    return {
      success: false,
      limit: options.maxRequests,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    success: true,
    limit: options.maxRequests,
    remaining: options.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Helper to produce a standard 429 Too Many Requests HTTP response
 */
export function rateLimitExceededResponse(
  result: RateLimitResult
): NextResponse {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.resetTime - Date.now()) / 1000)
  );

  return NextResponse.json(
    {
      error:
        "Too Many Requests: Rate limit exceeded. Please try again after a brief pause.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetTime.toString(),
      },
    }
  );
}

/**
 * Resets rate limit store (used in testing and cleanup)
 */
export function resetRateLimits(key?: string): void {
  if (key) {
    memoryStore.delete(key);
  } else {
    memoryStore.clear();
  }
}
