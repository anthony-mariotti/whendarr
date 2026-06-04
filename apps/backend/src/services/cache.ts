import type { IRedisPlugin } from '@/plugins/redis.js';
import type { CalendarEvent, FeedDay } from '@whendarr/shared';
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
  },
  CALENDAR_FEED_MONTH(monthKey: string): string {
    return `${cachePrefix}:feed:month:${monthKey}`;
  },
  MONTH_RAW(monthKey: string): string {
    return `${cachePrefix}:raw:month:${monthKey}`;
  }
};

export interface ICacheService {
  // Retained for backward compatibility - no longer called by routes
  getCalendar(start: dayjs.Dayjs, end: dayjs.Dayjs): Promise<CalendarEvent[] | undefined>;
  setCalendar(start: dayjs.Dayjs, end: dayjs.Dayjs, data: CalendarEvent[]): Promise<void>;
  getFeedMonth(monthKey: string): Promise<FeedDay[] | undefined>;
  setFeedMonth(monthKey: string, data: FeedDay[]): Promise<void>;
  // Shared month-keyed raw event cache used by both /calendar and /calendar/feed
  getMonthRaw(monthKey: string): Promise<CalendarEvent[] | undefined>;
  setMonthRaw(monthKey: string, data: CalendarEvent[]): Promise<void>;
}

let cacheService: ICacheService;

class CacheService implements ICacheService {
  private redis!: Redis;
  private configured: boolean;

  constructor(plugin: IRedisPlugin) {
    this.configured = plugin.configured;
    if (plugin.server) {
      this.redis = plugin.server;
    }
  }

  private get enabled(): boolean {
    return this.configured && this.redis?.status === 'ready';
  }

  async getCalendar(start: dayjs.Dayjs, end: dayjs.Dayjs): Promise<CalendarEvent[] | undefined> {
    if (!this.enabled) return undefined;
    const cached = await this.redis.get(REDIS_KEYS.CALENDAR_RANGE(start, end));
    return cached ? (JSON.parse(cached) as CalendarEvent[]) : undefined;
  }

  async setCalendar(start: dayjs.Dayjs, end: dayjs.Dayjs, data: CalendarEvent[]): Promise<void> {
    if (!this.enabled) return;
    await this.redis.setex(
      REDIS_KEYS.CALENDAR_RANGE(start, end),
      getCalendarTTL(),
      JSON.stringify(data)
    );
  }

  async getFeedMonth(monthKey: string): Promise<FeedDay[] | undefined> {
    if (!this.enabled) return undefined;
    const cached = await this.redis.get(REDIS_KEYS.CALENDAR_FEED_MONTH(monthKey));
    return cached ? (JSON.parse(cached) as FeedDay[]) : undefined;
  }

  async setFeedMonth(monthKey: string, data: FeedDay[]): Promise<void> {
    if (!this.enabled) return;
    await this.redis.setex(
      REDIS_KEYS.CALENDAR_FEED_MONTH(monthKey),
      getCalendarTTL(),
      JSON.stringify(data)
    );
  }

  async getMonthRaw(monthKey: string): Promise<CalendarEvent[] | undefined> {
    if (!this.enabled) return undefined;
    const cached = await this.redis.get(REDIS_KEYS.MONTH_RAW(monthKey));
    return cached ? (JSON.parse(cached) as CalendarEvent[]) : undefined;
  }

  async setMonthRaw(monthKey: string, data: CalendarEvent[]): Promise<void> {
    if (!this.enabled) return;
    await this.redis.setex(REDIS_KEYS.MONTH_RAW(monthKey), getCalendarTTL(), JSON.stringify(data));
  }
}

export function createCacheService(plugin: IRedisPlugin): ICacheService {
  cacheService = new CacheService(plugin);
  return cacheService;
}

export function getCacheService(): ICacheService {
  return cacheService;
}
