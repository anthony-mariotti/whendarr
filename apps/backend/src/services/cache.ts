import type dayjs from 'dayjs';

let cachePrefix = 'whendarr';

export function setCachePrefix(prefix: string): void {
  cachePrefix = prefix;
}

export function getCachePrefix(): string {
  return cachePrefix;
}

export const REDIS_KEYS = {
  CALENDAR_RANGE(start: dayjs.Dayjs, end: dayjs.Dayjs): string {
    return `${cachePrefix}:calendar:${start.format('YYYYMMDD')}-${end.format('YYYMMDD')}`;
  }
};
