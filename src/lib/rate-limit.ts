/**
 * Small in-memory fixed-window rate limiter.
 *
 * V1 runs as a single Node process, so process memory is enough. If the app is
 * ever scaled to several instances, move this to Postgres or Redis.
 */
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number }

export const rateLimit = (key: string, max: number, windowMs: number): RateLimitResult => {
  // End-to-end tests log in and register many times from one IP.
  if (process.env.RATE_LIMIT_DISABLED === 'true') return { ok: true, retryAfterSeconds: 0 }
  const now = Date.now()

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }

  bucket.count += 1
  if (bucket.count > max) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfterSeconds: 0 }
}

export const resetRateLimits = (): void => buckets.clear()
