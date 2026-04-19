import type { EventItem, MovieItem } from '@whendarr/shared';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createCacheService,
  getCachePrefix,
  getCacheService,
  getCalendarTTL,
  REDIS_KEYS,
  setCachePrefix,
  setCalendarTTL,
  type ICacheService
} from '../../src/services/cache.js';
import RedisMock from 'ioredis-mock';

dayjs.extend(utc);

const start = dayjs.utc('2024-03-01');
const end = dayjs.utc('2024-03-31');

const sampleEvents: EventItem[] = [
  {
    type: 'movie',
    title: 'Test Movie',
    certification: 'PG-13',
    date: '2024-03-15T00:00:00.000Z',
    overview: 'A test movie',
    available: true,
    release: 'digital'
  } as MovieItem
];

// ---------------------------------------------------------------------------
// REDIS_KEYS
// ---------------------------------------------------------------------------

describe('REDIS_KEYS', () => {
  afterEach(() => setCachePrefix('whendarr'));

  describe('CALENDAR_RANGE', () => {
    it('formats the key correctly with default prefix', () => {
      const key = REDIS_KEYS.CALENDAR_RANGE(start, end);
      expect(key).toBe('whendarr:calendar:20240301-20240331');
    });

    it('reflects an updated prefix', () => {
      setCachePrefix('customprefix');
      const key = REDIS_KEYS.CALENDAR_RANGE(start, end);
      expect(key).toBe('customprefix:calendar:20240301-20240331');
    });

    it('formats start and end dates independently', () => {
      const key = REDIS_KEYS.CALENDAR_RANGE(dayjs.utc('2024-01-01'), dayjs.utc('2024-12-31'));
      expect(key).toBe('whendarr:calendar:20240101-20241231');
    });
  });
});

// ---------------------------------------------------------------------------
// Cache prefix helpers
// ---------------------------------------------------------------------------

describe('cache prefix helpers', () => {
  afterEach(() => setCachePrefix('whendarr'));

  it('getCachePrefix returns default prefix', () => {
    expect(getCachePrefix()).toBe('whendarr');
  });

  it('setCachePrefix updates prefix returned by getCachePrefix', () => {
    setCachePrefix('custom');
    expect(getCachePrefix()).toBe('custom');
  });
});

// ---------------------------------------------------------------------------
// Calendar TTL helpers
// ---------------------------------------------------------------------------

describe('calendar TTL helpers', () => {
  afterEach(() => setCalendarTTL(300));

  it('getCalendarTTL returns default TTL 300', () => {
    expect(getCalendarTTL()).toBe(300);
  });

  it('setCalendarTTL updates value returned by getCalendarTTL', () => {
    setCalendarTTL(60);
    expect(getCalendarTTL()).toBe(60);
  });

  it('setCalendarTTL defaults 300 when argument passed', () => {
    setCalendarTTL(60);
    setCalendarTTL();
    expect(getCalendarTTL()).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// CacheService
// ---------------------------------------------------------------------------

describe('CacheService', () => {
  let redis: InstanceType<typeof RedisMock>;
  let cache: ICacheService;

  beforeEach(async () => {
    redis = new RedisMock();
    Object.defineProperty(redis, 'status', { value: 'ready', configurable: true });
    cache = createCacheService(redis);
    await redis.flushall();
    setCachePrefix('whendarr');
    setCalendarTTL(300);
  });

  afterEach(async () => {
    await redis.flushall();
    setCachePrefix('whendarr');
    setCalendarTTL(300);
  });

  // -------------------------------------------------------------------------
  // getCalendar
  // -------------------------------------------------------------------------

  describe('getCalendar', () => {
    it('returns undefined when key does not exist', async () => {
      const result = await cache.getCalendar(start, end);
      expect(result).toBeUndefined();
    });

    it('returns events after having been set', async () => {
      await cache.setCalendar(start, end, sampleEvents);
      const result = await cache.getCalendar(start, end);
      expect(result).toEqual(sampleEvents);
    });

    it('returns undefined for a different date range than what was set', async () => {
      await cache.setCalendar(start, end, sampleEvents);
      const result = await cache.getCalendar(dayjs.utc('2024-04-01'), dayjs.utc('2024-04-30'));
      expect(result).toBeUndefined();
    });

    it('returns undefined after key is flushed', async () => {
      await cache.setCalendar(start, end, sampleEvents);
      await redis.flushall();
      const result = await cache.getCalendar(start, end);
      expect(result).toBeUndefined();
    });

    it('uses current prefix when looking up keys', async () => {
      await cache.setCalendar(start, end, sampleEvents);
      setCachePrefix('otherprefix');
      const result = await cache.getCalendar(start, end);
      expect(result).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // setCalendar
  // -------------------------------------------------------------------------

  describe('setCalendar', () => {
    it('persists events that can be retrieved with getCalendar', async () => {
      await cache.setCalendar(start, end, sampleEvents);
      const result = await cache.getCalendar(start, end);
      expect(result).toEqual(sampleEvents);
    });

    it('persists an empty array of events', async () => {
      await cache.setCalendar(start, end, []);
      const result = await cache.getCalendar(start, end);
      expect(result).toEqual([]);
    });

    it('overwrites a previously cached value', async () => {
      const updated: EventItem[] = [{ ...sampleEvents[0], title: 'Updated Movie' } as MovieItem];
      await cache.setCalendar(start, end, sampleEvents);
      await cache.setCalendar(start, end, updated);
      const result = await cache.getCalendar(start, end);
      expect(result).toEqual(updated);
    });

    it('stores keys under separate prefixes independently', async () => {
      await cache.setCalendar(start, end, sampleEvents);

      setCachePrefix('other');
      const otherEvents: EventItem[] = [{ ...sampleEvents[0], title: 'Other Movie' } as MovieItem];
      await cache.setCalendar(start, end, otherEvents);

      setCachePrefix('whendarr');
      expect(await cache.getCalendar(start, end)).toEqual(sampleEvents);

      setCachePrefix('other');
      expect(await cache.getCalendar(start, end)).toEqual(otherEvents);
    });

    it('sets the key with the correct TTL', async () => {
      await cache.setCalendar(start, end, sampleEvents);
      const ttl = await redis.ttl(REDIS_KEYS.CALENDAR_RANGE(start, end));
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300);
    });

    it('uses the TTL from getCalendarTTL', async () => {
      setCalendarTTL(60);
      await cache.setCalendar(start, end, sampleEvents);
      const ttl = await redis.ttl(REDIS_KEYS.CALENDAR_RANGE(start, end));
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });
  });

  // -------------------------------------------------------------------------
  // enabled guard
  // -------------------------------------------------------------------------

  describe('enabled guard', () => {
    it('getCalendar returns undefined when Redis is not ready', async () => {
      const disconnectedRedis = new RedisMock();
      Object.defineProperty(disconnectedRedis, 'status', { value: 'end', configurable: true });
      const disabledCache = createCacheService(disconnectedRedis);

      const result = await disabledCache.getCalendar(start, end);
      expect(result).toBeUndefined();
    });

    it('setCalendar does nothing when Redis is not ready', async () => {
      const disconnectedRedis = new RedisMock();
      Object.defineProperty(disconnectedRedis, 'status', { value: 'end', configurable: true });
      const disabledCache = createCacheService(disconnectedRedis);

      await disabledCache.setCalendar(start, end, sampleEvents);

      // Nothing should have been written — check against the connected cache
      const result = await cache.getCalendar(start, end);
      expect(result).toBeUndefined();
    });
  });

  describe('getCacheService', () => {
    it('returns the cache service created by createCacheService', () => {
      const created = createCacheService(redis);
      expect(getCacheService()).toBe(created);
    });
  });
});
