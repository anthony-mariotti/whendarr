import type { Dayjs } from 'dayjs';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { calendarQuerySchema, type MovieItem } from '@whendarr/shared';

export async function registerCalendarRoute(instance: FastifyInstance) {
  await instance.register(calendarV1, { prefix: '/api/v1/calendar' });
}

const calendarV1: FastifyPluginAsync = async (instance: FastifyInstance) => {
  instance.get('/', async (request, reply) => {
    const query = await calendarQuerySchema.safeParseAsync(request.query);
    instance.assert(query.success, 400, query.error?.issues?.at(0)?.message);

    const startDate = query.data.month
      ? instance
          .dayjs(query.data.month, 'YYYY-MM-DD')
          .startOf('month')
          .startOf('week')
          .startOf('date')
      : instance.dayjs
          .utc()
          .startOf('month')
          .startOf('week')
          .tz(query.data.tz ?? 'UTC', false)
          .startOf('date');

    const endDate = query.data.month
      ? instance.dayjs(query.data.month, 'YYYY-MM-DD').endOf('month').endOf('week').endOf('date')
      : instance.dayjs
          .utc()
          .endOf('month')
          .endOf('week')
          .tz(query.data.tz ?? 'UTC', false)
          .endOf('date');

    const start = startDate.toISOString();
    const end = endDate.toISOString();

    const [radarrResponse, sonarrResponse] = await Promise.all([
      instance.radarr.calendar({ start, end }),
      instance.sonarr.calendar({ start, end })
    ]);

    if (!radarrResponse.ok) {
      return reply.badGateway(`Radarr API failed with status ${radarrResponse.status}`);
    }

    if (!sonarrResponse.ok) {
      return reply.badGateway(`Sonarr API failed with status ${sonarrResponse.status}`);
    }

    const mapped = radarrResponse.data.flatMap((movie) =>
      mapMovieToEntries(instance, movie, startDate, endDate, query.data.tz ?? 'UTC')
    );

    return {
      tz: query.data.tz ?? 'UTC',
      start: start,
      end: end,
      data: mapped,
      raw: radarrResponse.data
    };
  });
};

interface IRadarrCalendarItem {
  isAvailable?: boolean;
  title: string;
  status: string;
  hasFile?: boolean;
  inCinemas?: string;
  physicalRelease?: string;
  digitalRelease?: string;
  releaseDate?: string;
  certification?: string;
  overview?: string;
}

function isInRange(
  instance: FastifyInstance,
  dateString: string | undefined,
  start: Dayjs,
  end: Dayjs
) {
  if (!dateString) return false;
  return instance.dayjs.utc(dateString).isBetween(start, end, 'month', '[]');
}

function mapMovieToEntries(
  instance: FastifyInstance,
  movie: IRadarrCalendarItem,
  start: Dayjs,
  end: Dayjs,
  tz: string
) {
  const entries: MovieItem[] = [];

  if (movie.inCinemas && isInRange(instance, movie.inCinemas, start, end)) {
    entries.push({
      type: 'movie',
      title: movie.title,
      release: 'cinema',
      available: movie.hasFile ?? false,
      date: instance.dayjs.utc(movie.inCinemas).tz(tz, true).toISOString(),
      certification: movie.certification ?? 'NOT RATED',
      overview: movie.overview
    });
  }

  if (movie.digitalRelease && isInRange(instance, movie.digitalRelease, start, end)) {
    entries.push({
      type: 'movie',
      title: movie.title,
      release: 'digital',
      available: movie.hasFile ?? false,
      date: instance.dayjs.utc(movie.digitalRelease).tz(tz, true).toISOString(),
      certification: movie.certification ?? 'NOT RATED',
      overview: movie.overview
    });
  }

  if (movie.physicalRelease && isInRange(instance, movie.physicalRelease, start, end)) {
    entries.push({
      type: 'movie',
      title: movie.title,
      release: 'physical',
      available: movie.hasFile ?? false,
      date: instance.dayjs.utc(movie.physicalRelease).tz(tz, true).toISOString(),
      certification: movie.certification ?? 'NOT RATED',
      overview: movie.overview
    });
  }

  return entries;
}
