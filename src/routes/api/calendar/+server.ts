import { env } from '$env/dynamic/private';
import type { CalendarItem, MovieCalendarItem, TvCalendarItem } from '$lib/components/CalendarItem';
import { rateLimit } from '$lib/server/rateLimit';
import { redis } from '$lib/server/redis';
import dayjs from '$lib/helpers/dayjs';

import type { RequestHandler } from './$types';
import type { RadarrAPICalendarItem } from '$lib/server/types/radarr';
import type { SonarrAPICalendarItem } from '$lib/server/types/sonarr';

const ALLOWED_SCOPES = ['tv', 'movie'] as const;
type CalendarScopes = Array<(typeof ALLOWED_SCOPES)[number]>;

export const GET: RequestHandler = async ({ fetch, url, getClientAddress }) => {
  const ip = getClientAddress();
  const allowed = await rateLimit(ip);

  if (!allowed) {
    return new Response(
      JSON.stringify({
        status: 429,
        message: 'Rate Limit Exceeded'
      }),
      { status: 429 }
    );
  }

  const now =
    url.searchParams.get('start') ??
    dayjs.utc().hour(0).minute(0).second(0).millisecond(0).toISOString();

  const end =
    url.searchParams.get('end') ??
    dayjs.utc().endOf('month').subtract(1).hour(23).minute(59).second(59).toISOString();

  const scope = processScope(url.searchParams);
  const cacheKey = `calendar:${now}-${end}`;
  const cached = await getCached(cacheKey);

  if (cached) {
    const data = JSON.parse(cached) as Array<CalendarItem>;
    return filteredResponse(scope, data);
  }

  const [sonarrResponse, radarrResponse] = await Promise.all([
    fetch(`${env.SONARR_URL}/api/v3/calendar?start=${now}&end=${end}&includeSeries=true`, {
      headers: {
        'X-API-KEY': env.SONARR_KEY,
        'User-Agent': 'Whendarr/0.0.1'
      }
    }),
    fetch(`${env.RADARR_URL}/api/v3/calendar?start=${now}&end=${end}`, {
      headers: {
        'X-API-KEY': env.RADARR_KEY,
        'User-Agent': 'Whendarr/0.0.1'
      }
    })
  ]);

  if (!sonarrResponse.ok || !radarrResponse.ok) {
    return new Response(
      JSON.stringify({
        status: 502,
        message: 'Upstream Error'
      }),
      { status: 502 }
    );
  }

  const sonarr = await sonarrResponse.json();
  // console.log(sonarr);

  const radarr = await radarrResponse.json();
  // console.log(radarr);

  const normalized: Array<CalendarItem> = [
    ...radarr.map(
      (m: RadarrAPICalendarItem) =>
        ({
          type: 'movie',
          title: m.title,
          overview: m.overview,
          certification: m.certification ?? 'NOT RATED',
          status: m.status,
          isAvailable: m.isAvailable,
          inCinemas: m.inCinemas,
          physicalRelease: m.physicalRelease,
          digitalRelease: m.digitalRelease,
          hasFile: m.hasFile,
          qualityNotMet: m.hasFile ? (m.movieFile?.qualityCutoffNotMet ?? false) : false
        }) as MovieCalendarItem
    ),
    ...sonarr.map(
      (s: SonarrAPICalendarItem) =>
        ({
          type: 'tv',
          seriesId: s.seriesId,
          series: s.series?.title,
          title: s.title,
          overview: s.overview,
          season: s.seasonNumber,
          episode: s.episodeNumber,
          certification: s.series?.certification ?? 'NOT RATED',
          date: s.airDateUtc,
          airTime: s.series?.airTime,
          hasFile: s.hasFile
        }) as TvCalendarItem
    )
  ] as Array<CalendarItem>;

  const tvBlocks = buildTvBlocks(normalized);

  const sorted = normalized
    .map((item) => ({
      ...item,
      sortKey: getSortKey(item, tvBlocks)
    }))
    .sort((a, b) => {
      for (let i = 0; i < a.sortKey.length; i++) {
        if (a.sortKey[i] < b.sortKey[i]) return -1;
        if (a.sortKey[i] > b.sortKey[i]) return 1;
      }
      return 0;
    });

  await setCached(cacheKey, sorted);
  return filteredResponse(scope, normalized);
};

function getSortKey(item: CalendarItem, tvBlocks?: Map<string, { priority: number }>) {
  const date = getSortDate(item);

  if (item.type === 'tv') {
    const key = `${item.seriesId}-${item.season}-${item.date}`;
    const blockPriority = tvBlocks?.get(key)?.priority ?? 2;

    return [blockPriority, date, 0, item.seriesId, item.season, item.episode];
  }

  return [0, date, item.title];
}

function getSortDate(item: CalendarItem) {
  if (item.type === 'tv') {
    return new Date(item.date).getTime();
  }

  return 0;
}

function filteredResponse(scope: CalendarScopes, normalized: Array<CalendarItem>) {
  return new Response(JSON.stringify(normalized.filter((item) => scope.includes(item.type))), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function processScope(params: URLSearchParams): CalendarScopes {
  const rawScope = params.get('scope') ?? 'tv,movie';

  const scope = Array.from(
    new Set(
      rawScope
        .split(',')
        .map((s) => s.trim().toLocaleLowerCase())
        .filter((s): s is (typeof ALLOWED_SCOPES)[number] =>
          ALLOWED_SCOPES.includes(s as (typeof ALLOWED_SCOPES)[number])
        )
    )
  );

  if (scope.length === 0) {
    scope.push(...ALLOWED_SCOPES);
  }

  return scope;
}

async function getCached(key: string): Promise<string | null> {
  if (redis?.status === 'ready') {
    try {
      return await redis.get(key);
    } catch (err) {
      console.error('Cache read failed', err);
      return null;
    }
  }

  return null;
}

async function setCached(key: string, value: unknown): Promise<void> {
  if (redis?.status === 'ready') {
    try {
      await redis.set(
        key,
        JSON.stringify(value),
        'EX',
        env.NODE_ENV === 'production' ? 43200 : 300
      );
    } catch (err) {
      console.error('Cache write failed', err);
    }
  }
}

function buildTvBlocks(items: CalendarItem[]) {
  const groups = new Map<string, TvCalendarItem[]>();

  for (const item of items) {
    if (item.type !== 'tv') continue;

    const key = `${item.seriesId}-${item.season}-${item.date}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const blockMeta = new Map<string, { priority: number }>();

  for (const [key, episodes] of groups.entries()) {
    const sorted = episodes.sort((a, b) => a.episode - b.episode);

    const isPremiereOnly = sorted.length === 1 && sorted[0].episode === 1;

    const isSeasonDrop = sorted.length > 1;

    let priority = 2;

    if (isPremiereOnly) priority = 0;
    else if (isSeasonDrop) priority = 1;

    blockMeta.set(key, { priority });
  }

  return blockMeta;
}
