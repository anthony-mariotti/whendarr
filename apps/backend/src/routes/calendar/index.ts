import type { Dayjs } from 'dayjs';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { MovieItem } from '@whendarr/shared';

export async function registerCalendarRoute(instance: FastifyInstance) {
  await instance.register(calendarV1, { prefix: '/api/v1/calendar' });
}

const calendarV1Schema = z.object({
  start: z.string().optional(),
  end: z.string().optional()
});

const calendarV1: FastifyPluginAsync = async (instance) => {
  instance.get('/', async (request, reply) => {
    const query = calendarV1Schema.safeParse(request.query);
    if (!query.success) {
      return reply.badRequest('Invalid query parameters');
    }

    const start = query.data.start
      ? instance.dayjs(query.data.start)
      : instance.dayjs.utc().startOf('month').hour(0).minute(0).second(0).millisecond(0);

    const end = query.data.end
      ? instance.dayjs(query.data.end)
      : instance.dayjs.utc().endOf('month').hour(23).minute(59).second(59).millisecond(999);

    const radarrEndpoint = `https://radarrplaceholderforcommiting/api/v3/calendar?start=${start.toISOString()}&end=${end.toISOString()}`;
    instance.log.info({ service: 'radarr', fetch: { url: radarrEndpoint } });
    const response = await fetch(radarrEndpoint, {
      headers: {
        'X-API-KEY': 'totallylegitapikey',
        'User-Agent': 'Whendarr/0.0.1'
      }
    });

    if (!response.ok) {
      return {
        status: response.status,
        message: response.statusText
      };
    }

    const radarr = (await response.json()) as IRadarrCalendarItem[];
    const mapped = radarr.flatMap((movie) => mapMovieToEntries(instance, movie, start, end));
    return {
      data: mapped,
      raw: radarr
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
  end: Dayjs
) {
  const entries: MovieItem[] = [];

  if (movie.inCinemas && isInRange(instance, movie.inCinemas, start, end)) {
    entries.push({
      type: 'movie',
      title: movie.title,
      release: 'cinema',
      available: movie.hasFile ?? false,
      date: movie.inCinemas,
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
      date: movie.digitalRelease,
      certification: movie.certification ?? 'NOT RATED',
      overview: movie.overview
    });
  }

  if (movie.physicalRelease && isInRange(instance, movie.digitalRelease, start, end)) {
    entries.push({
      type: 'movie',
      title: movie.title,
      release: 'physical',
      available: movie.hasFile ?? false,
      date: movie.physicalRelease,
      certification: movie.certification ?? 'NOT RATED',
      overview: movie.overview
    });
  }

  return entries;
}
