import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalendarRange, ICalendarService } from '../../../src/services/calendar.js';
import type { CalendarEvent, FeedDay } from '@whendarr/shared';
import type { RadarrApi, RadarrCalendarResponse } from '../../../src/integrations/radarr.js';
import type { SonarrApi, SonarrCalendarResponse } from '../../../src/integrations/sonarr.js';
import type { ICacheService } from '../../../src/services/cache.js';
import fastify, { type FastifyInstance } from 'fastify';
import fastifySensible from '@fastify/sensible';
import { registerCalendarRoute } from '../../../src/routes/calendar/index.js';

dayjs.extend(utc);

const mockCalendarService: ICalendarService = {
  resolveRange: vi.fn(),
  map: vi.fn(),
  resolveFeed: vi.fn(),
  mapFeed: vi.fn(),
  groupByDay: vi.fn()
};

const mockCacheService: ICacheService = {
  getMonthRaw: vi.fn(),
  setMonthRaw: vi.fn()
};

vi.mock('@/services/calendar.js', () => ({
  getCalendarService: () => mockCalendarService
}));

vi.mock('@/services/cache.js', () => ({
  getCacheService: () => mockCacheService
}));

const resolvedRange: CalendarRange = {
  tz: 'UTC',
  start: dayjs('2024-03-01'),
  end: dayjs('2024-03-31').endOf('day')
};

const resolvedFeed: CalendarRange = {
  tz: 'UTC',
  start: dayjs('2024-03-01'),
  end: dayjs('2024-03-31').endOf('day')
};

const sampleEvents: CalendarEvent[] = [
  {
    type: 'movie',
    title: 'Test Movie',
    release: 'digital',
    available: true,
    date: '2024-03-15T00:00:00.000Z',
    certification: 'PG-13',
    overview: 'A test movie overview.'
  }
];

const sampleFeed: FeedDay[] = [{ date: '2024-03-15', items: sampleEvents }];

const radarrData: RadarrCalendarResponse[] = [
  {
    title: 'Test Movie',
    status: 'released',
    digitalRelease: '2024-03-15T00:00:00Z',
    hasFile: true,
    certification: 'PG-13',
    overview: 'A test movie overview.'
  }
];

const sonarrData: SonarrCalendarResponse[] = [
  {
    seriesId: 1,
    title: 'Test Episode',
    airDateUtc: '2024-03-15T00:00:00Z',
    seasonNumber: 1,
    episodeNumber: 1,
    hasFile: false,
    series: {
      title: 'Test Show',
      status: 'continuing',
      certification: 'TV-14'
    }
  }
];

function makeRadarr(overrides: { calendar?: RadarrApi['calendar'] } = {}): RadarrApi {
  return {
    calendar: vi.fn().mockResolvedValue({ ok: true, data: radarrData }),
    ...overrides
  } as unknown as RadarrApi;
}

function makeSonarr(overrides: { calendar?: SonarrApi['calendar'] } = {}): SonarrApi {
  return {
    calendar: vi.fn().mockResolvedValue({ ok: true, data: sonarrData }),
    ...overrides
  } as unknown as SonarrApi;
}

async function buildInstance(
  options: {
    radarr?: { calendar?: RadarrApi['calendar'] };
    sonarr?: { calendar?: SonarrApi['calendar'] };
  } = {}
): Promise<FastifyInstance> {
  const instance = fastify({ logger: false });

  await instance.register(fastifySensible);

  instance.decorate('dayjs', Object.assign(dayjs, { utc: dayjs.utc }));
  instance.decorate('radarr', makeRadarr(options.radarr));
  instance.decorate('sonarr', makeSonarr(options.sonarr));

  await registerCalendarRoute(instance);

  return instance;
}

describe('GET /api/v1/calendar', () => {
  let instance: FastifyInstance;

  beforeEach(async () => {
    vi.resetAllMocks();

    vi.mocked(mockCalendarService.resolveRange).mockReturnValue(resolvedRange);
    vi.mocked(mockCalendarService.map).mockReturnValue(sampleEvents);
    vi.mocked(mockCacheService.getMonthRaw).mockResolvedValue(undefined);
    vi.mocked(mockCacheService.setMonthRaw).mockResolvedValue(undefined);

    instance = await buildInstance();
  });

  describe('query validation', () => {
    it('returns 400 when month parameter is not valid date', async () => {
      const response = await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar?month=not-a-date'
      });

      expect(response.statusCode).toBe(400);
    });

    it('returns 200 when no query parameters passed', async () => {
      const response = await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar'
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('cache hit', () => {
    beforeEach(() => {
      vi.mocked(mockCacheService.getMonthRaw).mockResolvedValue(sampleEvents);
    });

    it('returns 200 with cached events', async () => {
      const response = await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar?month=2024-03-01'
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual(sampleEvents);
    });

    it('does not call *arr integrations', async () => {
      const radarr = makeRadarr();
      const sonarr = makeSonarr();
      instance = await buildInstance({ radarr, sonarr });

      await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar?month=2024-03-01'
      });

      expect(radarr.calendar).not.toHaveBeenCalled();
      expect(sonarr.calendar).not.toHaveBeenCalled();
    });

    it('does not call cacheService.setMonthRaw', async () => {
      await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar?month=2024-03-01'
      });
      expect(mockCacheService.setMonthRaw).not.toHaveBeenCalled();
    });

    it('includes tz, start, and end in response', async () => {
      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar?month=2024-03-01'
      });
      const body = response.json();
      expect(body).toHaveProperty('tz');
      expect(body).toHaveProperty('start');
      expect(body).toHaveProperty('end');
    });
  });

  describe('cache miss', () => {
    it('calls radarr.calendar and sonarr.calendar', async () => {
      const radarr = makeRadarr();
      const sonarr = makeSonarr();
      instance = await buildInstance({ radarr, sonarr });

      await instance.inject({ method: 'GET', url: '/api/v1/calendar?month=2024-03-01' });

      expect(radarr.calendar).toHaveBeenCalledOnce();
      expect(sonarr.calendar).toHaveBeenCalledOnce();
    });

    it('passes ISO start and end strings to radarr', async () => {
      const radarr = makeRadarr();
      instance = await buildInstance({ radarr });

      await instance.inject({ method: 'GET', url: '/api/v1/calendar?month=2024-03-01' });

      expect(radarr.calendar).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          end: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
        })
      );
    });

    it('passes includeSeries: true to sonarr', async () => {
      const sonarr = makeSonarr();
      instance = await buildInstance({ sonarr });

      await instance.inject({ method: 'GET', url: '/api/v1/calendar?month=2024-03-01' });

      expect(sonarr.calendar).toHaveBeenCalledWith(
        expect.objectContaining({ includeSeries: true })
      );
    });

    it('calls calendarService.map with radarr and sonarr data', async () => {
      await instance.inject({ method: 'GET', url: '/api/v1/calendar?month=2024-03-01' });

      expect(mockCalendarService.map).toHaveBeenCalledWith(
        radarrData,
        sonarrData,
        resolvedRange.start,
        resolvedRange.end
      );
    });

    it('calls cacheService.setMonthRaw with the mapped result', async () => {
      await instance.inject({ method: 'GET', url: '/api/v1/calendar?month=2024-03-01' });

      expect(mockCacheService.setMonthRaw).toHaveBeenCalledWith('2024-03', sampleEvents);
    });

    it('returns mapped events in the response', async () => {
      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar?month=2024-03-01'
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual(sampleEvents);
    });
  });

  // -------------------------------------------------------------------------
  // Upstream failures
  // -------------------------------------------------------------------------

  describe('upstream failures', () => {
    it('returns 502 when radarr fails', async () => {
      instance = await buildInstance({
        radarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 500 })) }
      });

      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar?month=2024-03-01'
      });

      expect(response.statusCode).toBe(502);
    });

    it('returns 502 when sonarr fails', async () => {
      instance = await buildInstance({
        sonarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 500 })) }
      });

      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar?month=2024-03-01'
      });

      expect(response.statusCode).toBe(502);
    });

    it('includes the upstream status code in the radarr 502 message', async () => {
      instance = await buildInstance({
        radarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 503 })) }
      });

      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar?month=2024-03-01'
      });

      expect(response.json().message).toContain('503');
    });

    it('includes the upstream status code in the sonarr 502 message', async () => {
      instance = await buildInstance({
        sonarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 503 })) }
      });

      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar?month=2024-03-01'
      });

      expect(response.json().message).toContain('503');
    });

    it('does not call calendarService.map when radarr fails', async () => {
      instance = await buildInstance({
        radarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 500 })) }
      });

      await instance.inject({ method: 'GET', url: '/api/v1/calendar?month=2024-03-01' });

      expect(mockCalendarService.map).not.toHaveBeenCalled();
    });

    it('does not call cacheService.setMonthRaw when radarr fails', async () => {
      instance = await buildInstance({
        radarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 500 })) }
      });

      await instance.inject({ method: 'GET', url: '/api/v1/calendar?month=2024-03-01' });

      expect(mockCacheService.setMonthRaw).not.toHaveBeenCalled();
    });
  });
});

describe('GET /api/v1/calendar/feed', () => {
  let instance: FastifyInstance;

  beforeEach(async () => {
    vi.resetAllMocks();

    vi.mocked(mockCalendarService.resolveFeed).mockReturnValue(resolvedFeed);
    vi.mocked(mockCalendarService.map).mockReturnValue(sampleEvents);
    vi.mocked(mockCalendarService.groupByDay).mockReturnValue(sampleFeed);
    vi.mocked(mockCacheService.getMonthRaw).mockResolvedValue(undefined);
    vi.mocked(mockCacheService.setMonthRaw).mockResolvedValue(undefined);

    instance = await buildInstance();
  });

  describe('query validation', () => {
    it('returns 400 when cursor is not a valid date', async () => {
      const response = await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar/feed?cursor=not-a-date'
      });

      expect(response.statusCode).toBe(400);
    });

    it('returns 200 when no cursor parameter is passed', async () => {
      const response = await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar/feed'
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('response shape', () => {
    it('includes tz, feed, start, end, and nextCursor in response', async () => {
      const response = await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar/feed?cursor=2024-03-15'
      });
      const body = response.json();

      expect(body).toHaveProperty('tz');
      expect(body).toHaveProperty('feed');
      expect(body).toHaveProperty('start');
      expect(body).toHaveProperty('end');
      expect(body).toHaveProperty('nextCursor');
    });
  });

  describe('nextCursor', () => {
    it('is a formatted date string when end is before absoluteMax', async () => {
      const response = await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(response.json().nextCursor).toBe(resolvedFeed.end.add(1, 'day').format('YYYY-MM-DD'));
    });

    it('is null when end is at or beyond six months from now', async () => {
      const farFuture = dayjs().add(1, 'year');
      vi.mocked(mockCalendarService.resolveFeed).mockReturnValue({
        tz: 'UTC',
        start: farFuture.startOf('month'),
        end: farFuture.endOf('month')
      });
      vi.mocked(mockCacheService.getMonthRaw).mockResolvedValue(sampleEvents);

      const response = await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar/feed'
      });

      expect(response.json().nextCursor).toBeNull();
    });
  });

  describe('cache hit', () => {
    beforeEach(() => {
      vi.mocked(mockCacheService.getMonthRaw).mockResolvedValue(sampleEvents);
    });

    it('returns 200 with grouped events', async () => {
      const response = await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().feed).toEqual(sampleFeed);
    });

    it('does not call *arr integrations', async () => {
      const radarr = makeRadarr();
      const sonarr = makeSonarr();
      instance = await buildInstance({ radarr, sonarr });

      await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(radarr.calendar).not.toHaveBeenCalled();
      expect(sonarr.calendar).not.toHaveBeenCalled();
    });

    it('does not call cacheService.setMonthRaw', async () => {
      await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(mockCacheService.setMonthRaw).not.toHaveBeenCalled();
    });

    it('calls groupByDay with filtered window events', async () => {
      await instance.inject({
        method: 'GET',
        path: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(mockCalendarService.groupByDay).toHaveBeenCalledWith(sampleEvents);
    });
  });

  describe('cache miss', () => {
    it('calls radarr.calendar and sonarr.calendar', async () => {
      const radarr = makeRadarr();
      const sonarr = makeSonarr();
      instance = await buildInstance({ radarr, sonarr });

      await instance.inject({ method: 'GET', url: '/api/v1/calendar/feed?cursor=2024-03-15' });

      expect(radarr.calendar).toHaveBeenCalledOnce();
      expect(sonarr.calendar).toHaveBeenCalledOnce();
    });

    it('calls calendarService.map with month start and end', async () => {
      await instance.inject({ method: 'GET', url: '/api/v1/calendar/feed?cursor=2024-03-15' });

      expect(mockCalendarService.map).toHaveBeenCalledWith(
        radarrData,
        sonarrData,
        dayjs('2024-03').startOf('month'),
        dayjs('2024-03').endOf('month')
      );
    });

    it('calls cacheService.setMonthRaw with the mapped result', async () => {
      await instance.inject({ method: 'GET', url: '/api/v1/calendar/feed?cursor=2024-03-15' });

      expect(mockCacheService.setMonthRaw).toHaveBeenCalledWith('2024-03', sampleEvents);
    });

    it('calls groupByDay with filtered window events', async () => {
      await instance.inject({ method: 'GET', url: '/api/v1/calendar/feed?cursor=2024-03-15' });

      expect(mockCalendarService.groupByDay).toHaveBeenCalledWith(sampleEvents);
    });

    it('returns 200 with grouped feed', async () => {
      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().feed).toEqual(sampleFeed);
    });
  });

  describe('multi-month span', () => {
    const crossMonthFeed: CalendarRange = {
      tz: 'UTC',
      start: dayjs('2024-03-20'),
      end: dayjs('2024-04-05').endOf('day')
    };

    it('fetches *arr data for each uncached month', async () => {
      vi.mocked(mockCalendarService.resolveFeed).mockReturnValue(crossMonthFeed);

      const radarr = makeRadarr();
      const sonarr = makeSonarr();
      instance = await buildInstance({ radarr, sonarr });

      await instance.inject({ method: 'GET', url: '/api/v1/calendar/feed?cursor=2024-03-20' });

      expect(radarr.calendar).toHaveBeenCalledTimes(2);
      expect(sonarr.calendar).toHaveBeenCalledTimes(2);
    });

    it('does not call *arr integrations when both months are cached', async () => {
      vi.mocked(mockCalendarService.resolveFeed).mockReturnValue(crossMonthFeed);
      vi.mocked(mockCacheService.getMonthRaw).mockResolvedValue(sampleEvents);

      const radarr = makeRadarr();
      const sonarr = makeSonarr();
      instance = await buildInstance({ radarr, sonarr });

      await instance.inject({ method: 'GET', url: '/api/v1/calendar/feed?cursor=2024-03-20' });

      expect(radarr.calendar).not.toHaveBeenCalled();
      expect(sonarr.calendar).not.toHaveBeenCalled();
    });
  });

  describe('upstream failures', () => {
    it('returns 502 when radarr fails', async () => {
      instance = await buildInstance({
        radarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 500 })) }
      });

      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(response.statusCode).toBe(502);
    });

    it('returns 502 when sonarr fails', async () => {
      instance = await buildInstance({
        sonarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 500 })) }
      });

      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(response.statusCode).toBe(502);
    });

    it('includes the upstream status code in the radarr 502 message', async () => {
      instance = await buildInstance({
        radarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 503 })) }
      });

      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(response.json().message).toContain('503');
    });

    it('includes the upstream status code in the sonarr 502 message', async () => {
      instance = await buildInstance({
        sonarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 503 })) }
      });

      const response = await instance.inject({
        method: 'GET',
        url: '/api/v1/calendar/feed?cursor=2024-03-15'
      });

      expect(response.json().message).toContain('503');
    });

    it('does not call calendarService.groupByDay when radarr fails', async () => {
      instance = await buildInstance({
        radarr: { calendar: vi.fn().mockResolvedValue(new Response(undefined, { status: 500 })) }
      });

      await instance.inject({ method: 'GET', url: '/api/v1/calendar/feed?cursor=2024-03-15' });

      expect(mockCalendarService.groupByDay).not.toHaveBeenCalled();
    });
  });
});
