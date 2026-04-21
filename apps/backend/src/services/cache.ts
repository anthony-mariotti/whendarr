import type { EventItem } from '@whendarr/shared';
import type dayjs from 'dayjs';
import { type Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyReply {
    cached: boolean;
  }
}

let cachePrefix = 'whendarr';
let calendarTTL = 300;

export function setCachePrefix(prefix: string): void {
  cachePrefix = prefix;
}

export function getCachePrefix(): string {
  return cachePrefix;
}

export function setCalendarTTL(ttl = 300): void {
  calendarTTL = ttl;
}

export function getCalendarTTL(): number {
  return calendarTTL;
}

export const REDIS_KEYS = {
  CALENDAR_RANGE(start: dayjs.Dayjs, end: dayjs.Dayjs): string {
    return `${cachePrefix}:calendar:${start.format('YYYYMMDD')}-${end.format('YYYYMMDD')}`;
  }
};

export interface ICacheService {
  getCalendar(start: dayjs.Dayjs, end: dayjs.Dayjs): Promise<EventItem[] | undefined>;
  setCalendar(start: dayjs.Dayjs, end: dayjs.Dayjs, data: EventItem[]): Promise<void>;
}

let cacheService: ICacheService;

class CacheService implements ICacheService {
  constructor(private redis: Redis) {}

  private get enabled() {
    return this.redis.status === 'ready';
  }

  async getCalendar(start: dayjs.Dayjs, end: dayjs.Dayjs): Promise<EventItem[] | undefined> {
    if (!this.enabled) return undefined;

    const cached = await this.redis.get(REDIS_KEYS.CALENDAR_RANGE(start, end));
    return cached ? (JSON.parse(cached) as EventItem[]) : undefined;
  }

  async setCalendar(start: dayjs.Dayjs, end: dayjs.Dayjs, data: EventItem[]): Promise<void> {
    if (!this.enabled) return;
    await this.redis.setex(
      REDIS_KEYS.CALENDAR_RANGE(start, end),
      getCalendarTTL(),
      JSON.stringify(data)
    );
  }

  // TODO: aotmicSetEx<T> Planned Not Ready
  // async atomicSetEx<T>(key: string, ttl: number, get: () => Promise<T>): Promise<T> {
  //   if (!this.enabled) return new Promise((_, reject) => reject());
  //   const lockKey = `${key}:lock`;
  //   const hasLock = await this.redis.set(key, '1', 'EX', 5, 'NX');

  //   if (!hasLock) {
  //     await new Promise((resolve) => setTimeout(resolve, 100));
  //     const cached = await this.redis.get(key);
  //     if (cached) {
  //       return JSON.parse(cached) as T;
  //     }
  //     return this.atomicSetEx(key, ttl, get);
  //   }

  //   try {
  //     const data = await get();
  //     await this.redis.setex(key, ttl, JSON.stringify(data));
  //     return data;
  //   } finally {
  //     await this.redis.del(lockKey);
  //   }
  // }
}

export function createCacheService(redis: Redis): ICacheService {
  cacheService = new CacheService(redis);
  return cacheService;
}

export function getCacheService(): ICacheService {
  return cacheService;
}
