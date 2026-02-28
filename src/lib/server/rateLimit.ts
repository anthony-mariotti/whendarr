import { env } from '$env/dynamic/private';
import { createHash } from 'crypto';
import { redis } from './redis';

const WINDOW_SECONDS = Number(env.RATELIMIT_WINDOW ?? 60);
const MAX_REQUESTS = Number(env.RATELIMIT_BURST ?? 500);

export async function rateLimit(ip: string): Promise<boolean> {
  if (redis?.status !== 'ready') return true;

  const key = `ratelimit:${createHash('sha256').update(ip).digest('hex')}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  return current <= MAX_REQUESTS;
}
