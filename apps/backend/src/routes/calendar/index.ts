import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { calendarQuerySchema } from '@whendarr/shared';
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
};
