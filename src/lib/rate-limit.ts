import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Serverless-compatible rate limiter backed by Upstash Redis.
 * Uses a sliding window log approach.
 *
 * Returns `{ ok: true }` if the request is within the limit,
 * or `{ ok: false, retryAfterMs }` if rate-limited.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Remove stale entries and add the current request timestamp
  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  multi.zcard(key);
  multi.expire(key, Math.ceil(windowMs / 1000));

  const [, , count] = (await multi.exec()) as [unknown, unknown, number];

  if (count > limit) {
    // Get the oldest entry's timestamp to compute retry-after
    const oldest = await redis.zrange(key, 0, 0, { withScores: true });
    const oldestTimestamp = oldest[1] as number;
    return { ok: false, retryAfterMs: oldestTimestamp + windowMs - now };
  }

  return { ok: true };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}
