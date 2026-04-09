import type { FastifyInstance } from 'fastify';

const SonarrApiRoutes = {
  calendar: {
    get: '/api/v3/calendar'
  }
} as const;

export interface SonarrApiOptions {
  endpoint: string;
  key: string;
  headers?: Record<string, string>;
  instance?: FastifyInstance;
}

export class SonarrApi {
  private endpoint: string;
  private headers: Record<string, string>;
  private instance: FastifyInstance | undefined;

  constructor(options: SonarrApiOptions) {
    this.endpoint = options.endpoint;

    this.headers = {
      'X-API-KEY': options.key,
      'User-Agent': 'Whendarr/0.0.1',
      ...options.headers
    };

    this.instance = options.instance;
  }

  calendar = async (params: SonarrCalendarParams) => {
    return this.get<SonarrCalendarResponse[]>(SonarrApiRoutes.calendar.get, params);
  };

  private get = async <T>(url: string, params?: unknown): Promise<SonarrResponse<T>> => {
    const response = await fetch(
      `${this.endpoint}${params ? `${url}?${this.toSearchParams(params).toString()}` : url}`,
      {
        headers: this.headers
      }
    );

    this.instance?.log.debug({
      service: 'sonarr',
      fetch: {
        method: 'GET',
        endpoint: url,
        params,
        response: {
          ok: response.ok,
          status: response.status
        }
      }
    });

    if (!response.ok) {
      return {
        ...response,
        ok: false
      };
    }

    return {
      ok: true,
      data: (await response.json()) as T
    };
  };

  private toSearchParams(params: unknown): URLSearchParams;
  private toSearchParams(params: undefined): undefined;
  private toSearchParams(params: unknown): URLSearchParams | undefined {
    if (params === undefined || typeof params !== 'object' || params === null) {
      return undefined;
    }

    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }

    return query;
  }
}

export interface SonarrCalendarParams {
  start?: string;
  end?: string;
  unmonitored?: boolean;
  includeSeries?: boolean;
  includeEpisodeFile?: boolean;
  includeEpisodeImages?: boolean;
  tags?: string;
}

type SonarrResponseSuccess<T> = {
  ok: true;
  data: T;
};

type SonarrResponseFailed = Response & {
  ok: false;
};

export type SonarrResponse<T> = SonarrResponseSuccess<T> | SonarrResponseFailed;

export interface SonarrCalendarResponse {
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
