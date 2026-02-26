import { env } from "$env/dynamic/private";
import type { CalendarItem, MovieCalendarItem, TvCalendarItem } from "$lib/components/CalendarItem";
import { rateLimit } from "$lib/server/rateLimit";
import { redis } from "$lib/server/redis";

import type { RequestHandler } from "./$types";

const ALLOWED_SCOPES = ['tv', 'movie'] as const;
type CalendarScopes = Array<typeof ALLOWED_SCOPES[number]>

export const GET: RequestHandler = async ({ fetch, url, getClientAddress }) => {
    const ip = getClientAddress();
    const allowed = await rateLimit(ip);

    if (!allowed) {
        return new Response(JSON.stringify({
            status: 429,
            message: 'Rate Limit Exceeded'
        }), { status: 429 })
    }

    const now = url.searchParams.get('start')
        ?? `${new Date().toISOString().split('T')[0]}T00:00:00Z`;

    const end = url.searchParams.get('end')
        ?? `${new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
            .toISOString().split('T')[0]}T00:00:00Z`;

    const scope = processScope(url.searchParams);
    const cacheKey = `calendar:${now}:${end}`;
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
        }),
    ]);

    if (!sonarrResponse.ok || !radarrResponse.ok) {
        return new Response(JSON.stringify({
            status: 502,
            message: 'Upstream Error'
        }), { status: 502 });
    }

    const sonarr = await sonarrResponse.json();
    // console.log(sonarr);

    const radarr = await radarrResponse.json();
    // console.log(radarr);

    const normalized: Array<CalendarItem> = ([
        ...radarr.map((m: any) => ({
            type: 'movie',
            title: m.title,
            status: m.status,
            isAvailable: m.isAvailable,
            inCinemas: m.inCinemas,
            physicalRelease: m.physicalRelease,
            digitalRelease: m.digitalRelease,
            hasFile: m.hasFile
        } as MovieCalendarItem)),
        ...sonarr.map((s: any) => ({
            type: 'tv',
            seriesId: s.seriesId,
            series: s.series.title,
            title: s.title,
            season: s.seasonNumber,
            episode: s.episodeNumber,
            date: s.airDateUtc,
            airTime: s.series.airTime,
            hasFile: s.hasFile
        } as TvCalendarItem))
    ] as Array<CalendarItem>).map(item => ({
        ...item,
        sortKey: getSortKey(item)
    })).sort((a, b) => {
        for(let i = 0; i < a.sortKey.length; i++) {
            if (a.sortKey[i] < b.sortKey[i]) return -1;
            if (a.sortKey[i] > b.sortKey[i]) return 1;
        }
        return 0;
    });


    await setCached(cacheKey, normalized);
    return filteredResponse(scope, normalized);
}

function getSortKey(item: CalendarItem) {
    const date = getSortDate(item);

    if (item.type === 'tv') {
        return [
            date,
            0,
            item.seriesId,
            item.season,
            item.episode
        ];
    }

    return [
        date,
        1,
        item.title
    ];
}

function getSortDate(item: CalendarItem) {
    if (item.type === 'tv') {
        return new Date(item.date).getTime();
    }

    return 0;
}

function filteredResponse(scope: CalendarScopes, normalized: Array<CalendarItem>) {
    return new Response(
        JSON.stringify(normalized.filter(item => scope.includes(item.type))),
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
}

function processScope(params: URLSearchParams): CalendarScopes {
    const rawScope = params.get('scope') ?? 'tv,movie';

    const scope = Array.from(
        new Set(
            rawScope
                .split(',')
                .map(s => s.trim().toLocaleLowerCase())
                .filter((s): s is typeof ALLOWED_SCOPES[number] => ALLOWED_SCOPES.includes(s as any))
        )
    );

    if (scope.length === 0) {
        scope.push(...ALLOWED_SCOPES);
    }

    return scope;
}

async function getCached(key: string): Promise<string | null> {
    if (redis.enabled) {
        try {
            return await redis.client.get(key);
        } catch (err) {
            console.error('Cache read failed', err);
            return null;
        }
    }

    return null;
}

async function setCached(key: string, value: any): Promise<void> {
    if (redis.enabled) {
        try {
            await redis.client.set(key, JSON.stringify(value), {
                expiration: {
                    type: 'EX',
                    value: 300
                }
            });
        } catch (err) {
            console.error('Cache write failed', err);
        }
    }
}