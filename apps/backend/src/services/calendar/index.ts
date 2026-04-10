import type { RadarrCalendarResponse } from '@/integrations/radarr/api.js';
import type { SonarrCalendarResponse } from '@/integrations/sonarr/api.js';
import type { EpisodeGroup, EpisodeItem, EventItem, MovieItem } from '@whendarr/shared';
import dayjs from 'dayjs';

export async function retrieveCalendar(
  radarr: RadarrCalendarResponse[],
  sonarr: SonarrCalendarResponse[],
  start: dayjs.Dayjs,
  end: dayjs.Dayjs
): Promise<EventItem[]> {
  const promise = new Promise<EventItem[]>((resolve) => {
    const mappedRadarr = radarr.flatMap((movie) => mapMovie(movie, start, end));
    const mappedSonarr = mapEpisodeAndGroup(sonarr);

    resolve([...mappedRadarr, ...mappedSonarr]);
  });

  return promise;
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

function mapEpisodeAndGroup(episodes: SonarrCalendarResponse[]): (EpisodeItem | EpisodeGroup)[] {
  const grouped = new Map<string, EpisodeItem | EpisodeGroup>();
  for (const episode of episodes) {
    if (!episode.airDateUtc) continue;

    const seriesId = episode.series?.id ?? 0;

    const date = episode.airDateUtc.split('T')[0];
    const key = `${seriesId}-${date}`;

    if (!grouped.has(key)) {
      grouped.set(key, mapEpisode(episode, false));
    }

    const group = grouped.get(key);
    if (group && group?.grouped === true) {
      group.available ||= episode.hasFile ?? false;
      group.episodes.push(mapEpisode(episode, false));
    }
  }

  return Array.from(grouped.values());
}

function mapEpisode(episode: SonarrCalendarResponse, group: false): EpisodeItem;
function mapEpisode(episode: SonarrCalendarResponse, group: true): EpisodeGroup;
function mapEpisode(episode: SonarrCalendarResponse, group: boolean): EpisodeItem | EpisodeGroup {
  const base = {
    type: 'episode',
    title: episode.title ?? 'Unknown',
    available: episode.hasFile ?? false,
    date: episode.airDateUtc,
    overview: episode.overview,
    series: {
      id: episode.series?.id ?? 0,
      title: episode.series?.title ?? 'Unknown',
      certification: episode.series?.certification ?? 'NOT RATED'
    }
  };

  if (group) {
    return {
      ...base,
      grouped: true,
      episodes: []
    } as EpisodeGroup;
  }

  return {
    ...base,
    grouped: false
  } as EpisodeItem;
}
