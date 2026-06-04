import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { calendarFeedQuerySchema, calendarQuerySchema, type CalendarEvent } from '@whendarr/shared';
import { getCalendarService, type ICalendarService } from '@/services/calendar.js';
import { getCacheService, type ICacheService } from '@/services/cache.js';

export async function registerCalendarRoute(instance: FastifyInstance) {
  await instance.register(calendarV1, { prefix: '/api/v1/calendar' });
}

// Discriminated union so callers can propagate upstream error messages
// back through reply.badGateway() without the helper needing access to reply.
type MonthEventsResult =
  | { ok: true; events: CalendarEvent[]; fromCache: boolean }
  | { ok: false; error: string };

async function getMonthEvents(
  monthKey: string,
  instance: FastifyInstance,
  calendarService: ICalendarService,
  cacheService: ICacheService
): Promise<MonthEventsResult> {
  const cached = await cacheService.getMonthRaw(monthKey);

  if (cached) {
    return { ok: true, events: cached, fromCache: true };
  }

  const monthStart = instance.dayjs(monthKey).startOf('month');
  const monthEnd = instance.dayjs(monthKey).endOf('month');

  const [radarrRes, sonarrRes] = await Promise.all([
    instance.radarr.calendar({
      start: monthStart.toISOString(),
      end: monthEnd.toISOString()
    }),
    instance.sonarr.calendar({
      start: monthStart.toISOString(),
      end: monthEnd.toISOString(),
      includeSeries: true
    })
  ]);

  if (!radarrRes.ok) {
    return { ok: false, error: `Radarr API failed with status ${radarrRes.status}` };
  }

  if (!sonarrRes.ok) {
    return { ok: false, error: `Sonarr API failed with status ${sonarrRes.status}` };
  }

  const events = calendarService.map(radarrRes.data, sonarrRes.data, monthStart, monthEnd);
  await cacheService.setMonthRaw(monthKey, events);

  return { ok: true, events, fromCache: false };
}

const calendarV1: FastifyPluginAsync = async (instance: FastifyInstance) => {
  instance.get('/', async (request, reply) => {
    const query = await calendarQuerySchema.safeParseAsync(request.query);
    instance.assert(query.success, 400, query.error?.issues?.at(0)?.message);

    const calendarService = getCalendarService();
    const cacheService = getCacheService();

    const { start, end, tz } = calendarService.resolveRange(query.data.month, query.data.tz);

    // Build the list of calendar months spanned by the display window.
    // resolveRange extends to week boundaries, so a June calendar typically
    // spans parts of May, June, and July - each needs its own cache entry.
    const monthsNeeded: string[] = [];
    let cursor = start.startOf('month');
    while (!cursor.isAfter(end, 'month')) {
      monthsNeeded.push(cursor.format('YYYY-MM'));
      cursor = cursor.add(1, 'month');
    }

    let allCached = true;
    const allEvents: CalendarEvent[] = [];

    for (const monthKey of monthsNeeded) {
      const result = await getMonthEvents(monthKey, instance, calendarService, cacheService);
      if (!result.ok) return reply.badGateway(result.error);
      if (!result.fromCache) allCached = false;
      allEvents.push(...result.events);
    }

    if (allCached) reply.cached = true;

    // Filter aggregated month events down to the exact display window.
    // Month cache entries intentionally contain the full month; events
    // outside the week-extended display window are excluded here.
    const calendar = allEvents.filter((event) => {
      const eventDate = instance.dayjs(event.date);
      return (
        (eventDate.isSame(start, 'day') || eventDate.isAfter(start, 'day')) &&
        (eventDate.isSame(end, 'day') || eventDate.isBefore(end, 'day'))
      );
    });

    return {
      tz,
      start,
      end,
      data: calendar
    };
  });

  instance.get('/feed', async (request, reply) => {
    const query = await calendarFeedQuerySchema.safeParseAsync(request.query);
    instance.assert(query.success, 400, query.error?.issues?.at(0)?.message);

    const calendarService = getCalendarService();
    const cacheService = getCacheService();

    const { start, end, tz } = calendarService.resolveFeed(query.data.cursor, query.data.tz);

    const absoluteMax = instance.dayjs().add(6, 'month');
    const nextCursor = end.isBefore(absoluteMax) ? end.add(1, 'day').format('YYYY-MM-DD') : null;

    const startMonthKey = start.format('YYYY-MM');
    const endMonthKey = end.format('YYYY-MM');
    const monthsNeeded =
      startMonthKey === endMonthKey ? [startMonthKey] : [startMonthKey, endMonthKey];

    let allCached = true;
    const allEvents: CalendarEvent[] = [];

    for (const monthKey of monthsNeeded) {
      const result = await getMonthEvents(monthKey, instance, calendarService, cacheService);
      if (!result.ok) return reply.badGateway(result.error);
      if (!result.fromCache) allCached = false;
      allEvents.push(...result.events);
    }

    if (allCached) reply.cached = true;

    // Slice to the 14-day feed window before grouping.
    // Month cache entries span the full month; only the cursor window is returned.
    const windowEvents = allEvents.filter((event) => {
      const eventDate = instance.dayjs(event.date);
      return (
        (eventDate.isSame(start, 'day') || eventDate.isAfter(start, 'day')) &&
        (eventDate.isSame(end, 'day') || eventDate.isBefore(end, 'day'))
      );
    });

    return {
      tz,
      feed: calendarService.groupByDay(windowEvents),
      start,
      end,
      nextCursor
    };
  });
};
