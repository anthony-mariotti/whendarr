import { redis } from "./redis";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 60;

export async function rateLimit(ip: string): Promise<boolean> {
    if (!redis.enabled) return true;

    const key = `ratelimit:${ip}`;
    const current = await redis.client.incr(key);
    if (current === 1) {
        await redis.client.expire(key, WINDOW_SECONDS);
    }

    return current <= MAX_REQUESTS;
}