import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { calendarQuerySchema } from '@whendarr/shared';
import { retrieveCalendar } from '../../services/calendar/index.js';

export async function registerCalendarRoute(instance: FastifyInstance) {
  await instance.register(calendarV1, { prefix: '/api/v1/calendar' });
}

const calendarV1: FastifyPluginAsync = async (instance: FastifyInstance) => {
  instance.get('/', async (request, reply) => {
    const query = await calendarQuerySchema.safeParseAsync(request.query);
    instance.assert(query.success, 400, query.error?.issues?.at(0)?.message);

    const tz = query.data.tz ?? 'UTC';

    const start = query.data.month
      ? instance
          .dayjs(query.data.month, 'YYYY-MM-DD')
          .startOf('month')
          .startOf('week')
          .startOf('date')
      : instance.dayjs.utc().startOf('month').startOf('week').tz(tz, true);

    const end = query.data.month
      ? instance.dayjs(query.data.month, 'YYYY-MM-DD').endOf('month').endOf('week').endOf('date')
      : instance.dayjs.utc().endOf('month').endOf('week').tz(tz, true);

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

    const calendar = await retrieveCalendar(radarrResponse.data, sonarrResponse.data, start, end);

    return {
      tz,
      start: start,
      end: end,
      data: calendar,
      radarr: radarrResponse.data,
      sonarr: sonarrResponse.data
    };
  });
};
