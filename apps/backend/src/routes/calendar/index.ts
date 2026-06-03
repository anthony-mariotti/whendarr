import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { calendarFeedQuerySchema, calendarQuerySchema, type FeedDay } from '@whendarr/shared';
import { getCalendarService } from '@/services/calendar.js';
import { getCacheService } from '@/services/cache.js';

export async function registerCalendarRoute(instance: FastifyInstance) {
  await instance.register(calendarV1, { prefix: '/api/v1/calendar' });
}

const calendarV1: FastifyPluginAsync = async (instance: FastifyInstance) => {
  instance.get('/', async (request, reply) => {
    const query = await calendarQuerySchema.safeParseAsync(request.query);
    instance.assert(query.success, 400, query.error?.issues?.at(0)?.message);

    const calendarService = getCalendarService();

    const { start, end, tz } = calendarService.resolveRange(query.data.month, query.data.tz);

    const cacheService = getCacheService();
    const cached = await cacheService.getCalendar(start, end);

    if (cached) {
      reply.cached = true;
      return {
        tz,
        start,
        end,
        data: cached
      };
    }

    const [radarrResponse, sonarrResponse] = await Promise.all([
      instance.radarr.calendar({ start: start.toISOString(), end: end.toISOString() }),
      instance.sonarr.calendar({
        start: start.toISOString(),
        end: end.toISOString(),
        includeSeries: true
      })
    ]);

    if (!radarrResponse.ok) {
      return reply.badGateway(`Radarr API failed with status ${radarrResponse.status}`);
    }

    if (!sonarrResponse.ok) {
      return reply.badGateway(`Sonarr API failed with status ${sonarrResponse.status}`);
    }

    const calendar = calendarService.map(radarrResponse.data, sonarrResponse.data, start, end);

    await cacheService.setCalendar(start, end, calendar);

    return {
      tz,
      start: start,
      end: end,
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

    let combinedFeed: FeedDay[] = [];
    let allCached = true;

    for (const monthKey of monthsNeeded) {
      let monthData = await cacheService.getFeedMonth(monthKey);

      if (!monthData) {
        allCached = false;

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

        if (!radarrRes.ok || !sonarrRes.ok) {
          return reply.badGateway(`Upstream API failed.`);
        }

        monthData = calendarService.mapFeed(radarrRes.data, sonarrRes.data, monthStart, monthEnd);

        await cacheService.setFeedMonth(monthKey, monthData);
      }

      combinedFeed = combinedFeed.concat(monthData);
    }

    const slicedFeed = combinedFeed.filter((day) => {
      const current = instance.dayjs(day.date);
      return (
        (current.isSame(start, 'day') || current.isAfter(start, 'day')) &&
        (current.isSame(end, 'day') || current.isBefore(end, 'day'))
      );
    });

    if (allCached) {
      reply.cached = true;
    }

    return {
      tz,
      feed: slicedFeed,
      start,
      end,
      nextCursor
    };
  });
};
