import type { RadarrCalendarResponse } from '@/integrations/radarr/api.js';
import type { SonarrCalendarResponse } from '@/integrations/sonarr/api.js';
import type {
  CalendarEvent,
  EpisodeItem,
  MovieItem,
  ShowAvailability,
  ShowItem,
  ShowStatus
} from '@whendarr/shared';

import dayjs from 'dayjs';

export interface CalendarRange {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  tz: string;
}

export interface ICalendarService {
  resolveRange(month?: string, tz?: string): CalendarRange;
  map(
    radarr: RadarrCalendarResponse[],
    sonarr: SonarrCalendarResponse[],
    start: dayjs.Dayjs,
    end: dayjs.Dayjs
  ): CalendarEvent[];
}

let calendarService: ICalendarService;

export class CalendarService implements ICalendarService {
  constructor() {}

  resolveRange(month?: string, tz?: string): CalendarRange {
    const resolvedTz = tz ?? 'UTC';

    if (month) {
      return {
        tz: resolvedTz,
        start: dayjs(month, 'YYYY-MM-DD').startOf('month').startOf('week').startOf('date'),
        end: dayjs(month, 'YYYY-MM-DD').endOf('month').endOf('week').endOf('date')
      };
    }

    return {
      tz: resolvedTz,
      start: dayjs.utc().startOf('month').startOf('week').tz(resolvedTz, true),
      end: dayjs.utc().endOf('month').endOf('week').tz(resolvedTz, true)
    };
  }

  map(
    radarr: RadarrCalendarResponse[],
    sonarr: SonarrCalendarResponse[],
    start: dayjs.Dayjs,
    end: dayjs.Dayjs
  ): CalendarEvent[] {
    const mappedRadarr = radarr.flatMap((movie) => mapMovie(movie, start, end));
    const mappedSonarr = mapEpisodeToShow(sonarr);
    return [...mappedRadarr, ...mappedSonarr];
  }
}

export function getCalendarService(): ICalendarService {
  if (!calendarService) {
    calendarService = new CalendarService();
  }

  return calendarService;
}

function isInRange(dateString: string | undefined, start: dayjs.Dayjs, end: dayjs.Dayjs) {
  if (!dateString) return false;
  return dayjs.utc(dateString).isBetween(start, end, 'month', '[]');
}

function mapMovie(
  movie: RadarrCalendarResponse,
  start: dayjs.Dayjs,
  end: dayjs.Dayjs
): MovieItem[] {
  const entries: MovieItem[] = [];

  // TODO: for some reason I have to add one day for the release types?

  if (movie.inCinemas && isInRange(movie.inCinemas, start, end)) {
    entries.push({
      type: 'movie',
      title: movie.title,
      release: 'cinema',
      available: movie.hasFile ?? false,
      date: dayjs(movie.inCinemas).add(1, 'day').toISOString(),
      certification: movie.certification ?? 'NOT RATED',
      overview: movie.overview
    });
  }

  if (movie.digitalRelease && isInRange(movie.digitalRelease, start, end)) {
    entries.push({
      type: 'movie',
      title: movie.title,
      release: 'digital',
      available: movie.hasFile ?? false,
      date: dayjs(movie.digitalRelease).add(1, 'day').toISOString(),
      certification: movie.certification ?? 'NOT RATED',
      overview: movie.overview
    });
  }

  if (movie.physicalRelease && isInRange(movie.physicalRelease, start, end)) {
    entries.push({
      type: 'movie',
      title: movie.title,
      release: 'physical',
      available: movie.hasFile ?? false,
      date: dayjs(movie.physicalRelease).add(1, 'day').toISOString(),
      certification: movie.certification ?? 'NOT RATED',
      overview: movie.overview
    });
  }

  return entries;
}

function mapEpisodeToShow(episodes: SonarrCalendarResponse[]): ShowItem[] {
  const shows = new Map<string, ShowItem>();

  for (const episode of episodes) {
    const key = `${episode.seriesId}-${episode.airDateUtc.split('T')[0]}`;
    const show = shows.get(key);
    if (show) {
      show.episodes.push(mapEpisode(episode));
      show.episodes = show.episodes.sort((a, b) => a.number - b.number);

      show.available = mapAvailability(show.episodes);
      shows.set(key, show);
      continue;
    }

    shows.set(key, mapShow(episode));
  }

  return Array.from(shows.values());
}

function mapShow(item: SonarrCalendarResponse): ShowItem {
  const show = item.series;
  const episode = mapEpisode(item);

  return {
    type: 'show',
    title: show?.title ?? 'Unknown',
    overview: show?.overview,
    date: item.airDateUtc,
    available: episode.available ? 'available' : 'unavailable',
    certification: show?.certification ?? 'NOT RATED',
    status: (show?.status?.toLowerCase() ?? 'unknown') as ShowStatus,
    episodes: [episode]
  };
}

function mapEpisode(episode: SonarrCalendarResponse): EpisodeItem {
  return {
    title: episode.title,
    season: episode.seasonNumber ?? 0,
    number: episode.episodeNumber ?? 0,
    overview: episode.overview,
    available: episode.hasFile ?? false,
    date: episode.airDateUtc
  };
}

function mapAvailability(episodes: EpisodeItem[]): ShowAvailability {
  const allAvailable = episodes.every((x) => x.available);
  const allUnavailable = episodes.every((x) => !x.available);

  if (allAvailable) return 'available';
  if (allUnavailable) return 'unavailable';

  return 'partial';
}
