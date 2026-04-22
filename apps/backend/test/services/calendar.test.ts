import { describe, it, expect, beforeEach } from 'vitest';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import timezone from 'dayjs/plugin/timezone.js';
import type { RadarrCalendarResponse } from '../../src/integrations/radarr/api.js';
import type { SonarrCalendarResponse } from '../../src/integrations/sonarr/api.js';
import { CalendarService, getCalendarService } from '../../src/services/calendar.js';
import type { EpisodeItem, MovieItem, ShowItem } from '@whendarr/shared';

dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.extend(timezone);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const start = dayjs.utc('2024-03-01');
const end = dayjs.utc('2024-03-31');

function makeRadarrMovie(overrides: Partial<RadarrCalendarResponse> = {}): RadarrCalendarResponse {
  return {
    title: 'Test Movie',
    status: 'released',
    overview: 'A test movie overview.',
    certification: 'PG-13',
    hasFile: false,
    inCinemas: undefined,
    digitalRelease: undefined,
    physicalRelease: undefined,
    ...overrides
  };
}

function makeSonarrEpisode(
  overrides: Partial<SonarrCalendarResponse> = {}
): SonarrCalendarResponse {
  return {
    seriesId: 1,
    title: 'Test Episode',
    airDateUtc: '2024-03-15T00:00:00Z',
    seasonNumber: 1,
    episodeNumber: 1,
    hasFile: false,
    overview: 'A test episode overview.',
    series: {
      title: 'Test Show',
      status: 'continuing',
      certification: 'TV-14',
      overview: 'A test show overview.'
    },
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// CalendarService
// ---------------------------------------------------------------------------

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    service = new CalendarService();
  });

  // -------------------------------------------------------------------------
  // resolveRange
  // -------------------------------------------------------------------------

  describe('resolveRange', () => {
    it('defaults tz to UTC when not provided', () => {
      const { tz } = service.resolveRange('2024-03-01');
      expect(tz).toBe('UTC');
    });

    it('uses the provided tz', () => {
      const { tz } = service.resolveRange('2024-03-01', 'America/New_York');
      expect(tz).toBe('America/New_York');
    });

    it('start is before end when month is provided', () => {
      const { start, end } = service.resolveRange('2024-03-01');
      expect(start.isBefore(end)).toBe(true);
    });

    it('start of week falls on or before first day of month', () => {
      const { start } = service.resolveRange('2024-03-01');
      expect(start.isBefore(dayjs('2024-03-01')) || start.isSame(dayjs('2024-03-01'))).toBe(true);
    });

    it('end of week falls on or after last day of month', () => {
      const { end } = service.resolveRange('2024-03-01');
      expect(end.isAfter(dayjs('2024-03-31')) || end.isSame(dayjs('2024-03-31'))).toBe(true);
    });

    it('returns a valid range when no month is provided', () => {
      const { start, end } = service.resolveRange();
      expect(start).toBeDefined();
      expect(end).toBeDefined();
      expect(start.isBefore(end)).toBe(true);
    });

    it('start is before end when no month or tz is provided', () => {
      const { start, end } = service.resolveRange(undefined, 'America/New_York');
      expect(start.isBefore(end)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // map
  // -------------------------------------------------------------------------

  describe('map', () => {
    it('returns an empty array when both radarr and sonarr are empty', () => {
      const result = service.map([], [], start, end);
      expect(result).toEqual([]);
    });

    it('merges radarr movies and sonarr shows into a single array', () => {
      const radarr = [makeRadarrMovie({ digitalRelease: '2024-03-15T00:00:00Z' })];
      const sonarr = [makeSonarrEpisode()];

      const result = service.map(radarr, sonarr, start, end);

      const types = result.map((r) => r.type);
      expect(types).toContain('movie');
      expect(types).toContain('show');
    });

    describe('movies', () => {
      it('maps a digital release within range', () => {
        const radarr = [makeRadarrMovie({ digitalRelease: '2024-03-15T00:00:00Z', hasFile: true })];

        const [result] = service.map(radarr, [], start, end);

        expect(result).toMatchObject({
          type: 'movie',
          title: 'Test Movie',
          release: 'digital',
          available: true,
          certification: 'PG-13'
        });
      });

      it('maps a cinema release within range', () => {
        const radarr = [makeRadarrMovie({ inCinemas: '2024-03-10T00:00:00Z' })];

        const [result] = service.map(radarr, [], start, end);

        expect(result).toMatchObject({ type: 'movie', release: 'cinema' });
      });

      it('maps a physical release within range', () => {
        const radarr = [makeRadarrMovie({ physicalRelease: '2024-03-20T00:00:00Z' })];

        const [result] = service.map(radarr, [], start, end);

        expect(result).toMatchObject({ type: 'movie', release: 'physical' });
      });

      it('produce multiple entries with several releases within range', () => {
        const radarr = [
          makeRadarrMovie({
            inCinemas: '2024-03-05T00:00:00Z',
            digitalRelease: '2024-03-15T00:00:00Z',
            physicalRelease: '2024-03-25T00:00:00Z'
          })
        ];

        const result = service.map(radarr, [], start, end);

        expect(result).toHaveLength(3);
        const releases = result.map((r) => (r as MovieItem).release);
        expect(releases).toContain('cinema');
        expect(releases).toContain('digital');
        expect(releases).toContain('physical');
      });

      it('excludes releases outside the date range', () => {
        const radarr = [makeRadarrMovie({ digitalRelease: '2024-01-01T00:00:00Z' })];
        const result = service.map(radarr, [], start, end);
        expect(result).toHaveLength(0);
      });

      it('adds one day to the release date', () => {
        const date = '2024-03-15T00:00:00Z';
        const expected = dayjs(date).add(1, 'day').toISOString();
        const radarr = [
          makeRadarrMovie({
            inCinemas: date,
            digitalRelease: date,
            physicalRelease: date
          })
        ];

        const results = service.map(radarr, [], start, end);

        expect(results).toHaveLength(3);
        expect(results[0]?.date).toBe(expected);
        expect(results[1]?.date).toBe(expected);
        expect(results[2]?.date).toBe(expected);
      });

      it('returns no entries when all release dates are undefined', () => {
        const radarr = [makeRadarrMovie()];
        const result = service.map(radarr, [], start, end);
        expect(result).toHaveLength(0);
      });

      describe('cinema release', () => {
        it('marks available when movie hasFile', () => {
          const radarr = [makeRadarrMovie({ inCinemas: '2024-03-10T00:00:00Z', hasFile: true })];
          const movie = service.map(radarr, [], start, end)[0] as MovieItem;
          expect(movie.available).toBe(true);
        });

        it('marks available false when movie hasFile is undefined', () => {
          const radarr = [
            makeRadarrMovie({ inCinemas: '2024-03-20T00:00:00Z', hasFile: undefined })
          ];
          const movie = service.map(radarr, [], start, end);
          expect(movie[0]?.available).toBe(false);
        });

        it('marks release with explicit certification', () => {
          const radarr = [
            makeRadarrMovie({ inCinemas: '2024-03-10T00:00:00Z', certification: 'R' })
          ];
          const movie = service.map(radarr, [], start, end)[0] as MovieItem;
          expect(movie.certification).toBe('R');
        });

        it('marks release as NOT RATED when certification is undefined', () => {
          const radarr = [
            makeRadarrMovie({ inCinemas: '2024-03-10T00:00:00Z', certification: undefined })
          ];
          const movie = service.map(radarr, [], start, end)[0] as MovieItem;
          expect(movie.certification).toBe('NOT RATED');
        });
      });

      describe('digital release', () => {
        it('marks available when movie hasFile', () => {
          const radarr = [
            makeRadarrMovie({ digitalRelease: '2024-03-10T00:00:00Z', hasFile: true })
          ];

          const movie = service.map(radarr, [], start, end)[0] as MovieItem;

          expect(movie.available).toBe(true);
        });

        it('marks available false when movie hasFile is undefined', () => {
          const radarr = [
            makeRadarrMovie({ digitalRelease: '2024-03-20T00:00:00Z', hasFile: undefined })
          ];
          const movie = service.map(radarr, [], start, end);
          expect(movie[0]?.available).toBe(false);
        });

        it('marks release with explicit certification', () => {
          const radarr = [
            makeRadarrMovie({ digitalRelease: '2024-03-10T00:00:00Z', certification: 'R' })
          ];

          const movie = service.map(radarr, [], start, end)[0] as MovieItem;

          expect(movie.certification).toBe('R');
        });

        it('marks release as NOT RATED when certification is undefined', () => {
          const radarr = [
            makeRadarrMovie({ digitalRelease: '2024-03-10T00:00:00Z', certification: undefined })
          ];
          const movie = service.map(radarr, [], start, end)[0] as MovieItem;
          expect(movie.certification).toBe('NOT RATED');
        });
      });

      describe('physical release', () => {
        it('marks available when movie hasFile', () => {
          const radarr = [
            makeRadarrMovie({ physicalRelease: '2024-03-20T00:00:00Z', hasFile: true })
          ];

          const movie = service.map(radarr, [], start, end)[0] as MovieItem;

          expect(movie.available).toBe(true);
        });

        it('marks available false when movie hasFile is undefined', () => {
          const radarr = [
            makeRadarrMovie({ physicalRelease: '2024-03-20T00:00:00Z', hasFile: undefined })
          ];
          const movie = service.map(radarr, [], start, end);
          expect(movie[0]?.available).toBe(false);
        });

        it('marks release with explicit certification', () => {
          const radarr = [
            makeRadarrMovie({ physicalRelease: '2024-03-20T00:00:00Z', certification: 'R' })
          ];

          const movie = service.map(radarr, [], start, end)[0] as MovieItem;

          expect(movie.certification).toBe('R');
        });

        it('marks release as NOT RATED when certification is undefined', () => {
          const radarr = [
            makeRadarrMovie({ physicalRelease: '2024-03-10T00:00:00Z', certification: undefined })
          ];
          const movie = service.map(radarr, [], start, end)[0] as MovieItem;
          expect(movie.certification).toBe('NOT RATED');
        });
      });
    });

    describe('shows', () => {
      it('maps a single episode to a show item', () => {
        const [result] = service.map([], [makeSonarrEpisode()], start, end);

        expect(result).toMatchObject({
          type: 'show',
          title: 'Test Show',
          certification: 'TV-14',
          status: 'continuing'
        });
      });

      it('maps episode fields correctly', () => {
        const [show] = service.map([], [makeSonarrEpisode()], start, end);

        expect((show as ShowItem).episodes[0]).toMatchObject({
          title: 'Test Episode',
          season: 1,
          number: 1,
          available: false
        });
      });

      it('groups multiple episodes from the same show and air date into one ShowItem', () => {
        const sonarr = [
          makeSonarrEpisode({ episodeNumber: 1 }),
          makeSonarrEpisode({ episodeNumber: 2 })
        ];

        const result = service.map([], sonarr, start, end);

        expect(result).toHaveLength(1);
        expect((result[0] as ShowItem).episodes).toHaveLength(2);
      });

      it('separates episodes from the same show that air on different dates', () => {
        const sonarr = [
          makeSonarrEpisode({ episodeNumber: 1, airDateUtc: '2024-03-15T00:00:00Z' }),
          makeSonarrEpisode({ episodeNumber: 2, airDateUtc: '2024-03-22T00:00:00Z' })
        ];

        const result = service.map([], sonarr, start, end);

        expect(result).toHaveLength(2);
      });

      it('sorts grouped episodes by episode number', () => {
        const sonarr = [
          makeSonarrEpisode({ episodeNumber: 3 }),
          makeSonarrEpisode({ episodeNumber: 1 }),
          makeSonarrEpisode({ episodeNumber: 2 })
        ];

        const [show] = service.map([], sonarr, start, end);

        const numbers = (show as ShowItem).episodes.map((e: EpisodeItem) => e.number);
        expect(numbers).toEqual([1, 2, 3]);
      });

      it('marks availability as available when all episodes have files', () => {
        const sonarr = [
          makeSonarrEpisode({ episodeNumber: 1, hasFile: true }),
          makeSonarrEpisode({ episodeNumber: 2, hasFile: true })
        ];

        const [show] = service.map([], sonarr, start, end);

        expect((show as ShowItem).available).toBe('available');
      });

      it('marks availability as partial when only some episodes have files', () => {
        const sonarr = [
          makeSonarrEpisode({ episodeNumber: 1, hasFile: true }),
          makeSonarrEpisode({ episodeNumber: 2, hasFile: false })
        ];

        const [show] = service.map([], sonarr, start, end);

        expect((show as ShowItem).available).toBe('partial');
      });

      it('marks availability as unavailable when no episodes have files', () => {
        const sonarr = [
          makeSonarrEpisode({ episodeNumber: 1, hasFile: false }),
          makeSonarrEpisode({ episodeNumber: 2, hasFile: false })
        ];

        const [show] = service.map([], sonarr, start, end);

        expect((show as ShowItem).available).toBe('unavailable');
      });

      it('marks a single available episode as available', () => {
        const [show] = service.map([], [makeSonarrEpisode({ hasFile: true })], start, end);
        expect((show as ShowItem).available).toBe('available');
      });

      it('marks a single unavailable episode as unavailable', () => {
        const [show] = service.map([], [makeSonarrEpisode({ hasFile: false })], start, end);
        expect((show as ShowItem).available).toBe('unavailable');
      });

      it('defaults show title to Unknown when series is missing', () => {
        const [show] = service.map([], [makeSonarrEpisode({ series: undefined })], start, end);
        expect((show as ShowItem).title).toBe('Unknown');
      });

      it('defaults status to unknown when series status is missing', () => {
        const [show] = service.map(
          [],
          [makeSonarrEpisode({ series: { status: undefined } })],
          start,
          end
        );
        expect((show as ShowItem).status).toBe('unknown');
      });

      it('defaults certification to NOT RATED when series certification is missing', () => {
        const [show] = service.map(
          [],
          [makeSonarrEpisode({ series: { certification: undefined } })],
          start,
          end
        );
        expect((show as ShowItem).certification).toBe('NOT RATED');
      });

      it('defaults season to 0 when seasonNumber is missing', () => {
        const [show] = service.map(
          [],
          [makeSonarrEpisode({ seasonNumber: undefined })],
          start,
          end
        );
        expect((show as ShowItem).episodes[0]?.season).toBe(0);
      });

      it('defaults episode number to 0 when episodeNumber is missing', () => {
        const [show] = service.map(
          [],
          [makeSonarrEpisode({ episodeNumber: undefined })],
          start,
          end
        );
        expect((show as ShowItem).episodes[0]?.number).toBe(0);
      });

      it('defaults available to false when hasFile is undefined', () => {
        const [show] = service.map([], [makeSonarrEpisode({ hasFile: undefined })], start, end);
        expect((show as ShowItem).episodes[0]?.available).toBe(false);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// getCalendarService
// ---------------------------------------------------------------------------

describe('getCalendarService', () => {
  it('returns an CalendarService instance', () => {
    const service = getCalendarService();
    expect(service).toBeDefined();
    expect(service).instanceOf(CalendarService);
  });

  it('returns the same instance on subsequent calls', () => {
    const a = getCalendarService();
    const b = getCalendarService();
    expect(a).toBe(b);
  });
});
