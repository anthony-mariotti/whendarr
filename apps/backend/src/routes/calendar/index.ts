import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { calendarFeedQuerySchema, calendarQuerySchema } from '@whendarr/shared';
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

    const { start, end, tz } = calendarService.resolveFeed(query.data.cursor, query.data.tz);

    const cacheService = getCacheService();
    const cached = await cacheService.getFeed(start, end);

    const absoluteMax = instance.dayjs().add(6, 'month');

    const nextCursor = end.isBefore(absoluteMax) ? end.format('YYYY-MM-DD') : null;

    if (cached) {
      reply.cached = true;
      return {
        tz,
        start,
        end,
        nextCursor,
        feed: cached
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

    const feed = calendarService.mapFeed(radarrResponse.data, sonarrResponse.data, start, end);
    // .sort((a, b) => instance.dayjs(a.date).diff(instance.dayjs(b.date)));

    await cacheService.setFeed(start, end, feed);

    const first = feed.at(0);
    const item = first?.items.filter((e) => e.type === 'show').at(0);

    if (first && item) {
      // TODO: Since we are working on this feature in `dev` branch.
      // this is currently temp since we want to force seeing the multi episode release
      first.items.push({
        type: 'show',
        title: 'The Custom Show',
        date: first.date,
        certification: item.certification,
        available: item.available,
        overview: 'The custom show is custom to the show',
        status: item.status,
        episodes: [
          {
            title: 'Now Showing Custom',
            overview: 'Custom episode for the custom show',
            available: false,
            date: first.date,
            number: 1,
            season: 1
          },
          {
            title: 'The End of Custom',
            overview: 'Custom episode for the custom show',
            available: false,
            date: first.date,
            number: 2,
            season: 1
          }
        ]
      });
      feed[0] = first;
    }

    return {
      tz,
      feed: [...feed],
      start,
      end,
      nextCursor,
      radarrResponse,
      sonarrResponse
    };
  });
};
