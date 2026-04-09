import type { Dayjs } from 'dayjs';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { calendarQuerySchema, type MovieItem } from '@whendarr/shared';

export async function registerCalendarRoute(instance: FastifyInstance) {
  await instance.register(calendarV1, { prefix: '/api/v1/calendar' });
}

const calendarV1: FastifyPluginAsync = async (instance: FastifyInstance) => {
  instance.get('/', async (request) => {
    const query = await calendarQuerySchema.safeParseAsync(request.query);
    instance.assert(query.success, 400, query.error?.issues?.at(0)?.message);

    const start = query.data.month
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

    const end = query.data.month
      ? instance.dayjs(query.data.month, 'YYYY-MM-DD').endOf('month').endOf('week').endOf('date')
      : instance.dayjs
          .utc()
          .endOf('month')
          .endOf('week')
          .tz(query.data.tz ?? 'UTC', false)
          .endOf('date');

    const response = await instance.radarr.calendar({
      start: start.toISOString(),
      end: end.toISOString()
    });

    if (!response.ok) {
      return {
        status: response.status,
        message: response.statusText
      };
    }

    const mapped = response.data.flatMap((movie) =>
      mapMovieToEntries(instance, movie, start, end, query.data.tz ?? 'UTC')
    );

    return {
      tz: query.data.tz ?? 'UTC',
      start: start.toISOString(),
      end: end.toISOString(),
      data: mapped,
      raw: response.data
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
