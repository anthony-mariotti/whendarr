import { getCurrentVersion } from '@/utils/version.js';
import type { ServiceHealthCheck } from '@whendarr/shared';
import type { FastifyInstance } from 'fastify';

const RadarrApiRoutes = {
  calendar: {
    get: '/api/v3/calendar'
  },
  health: {
    get: '/api/v3/health'
  }
} as const;

export interface RadarrApiOptions {
  endpoint: string;
  key: string;
  headers?: Record<string, string>;
  instance?: FastifyInstance;
}

export class RadarrApi {
  private endpoint: string;
  private headers: Record<string, string>;
  private instance: FastifyInstance | undefined;

  constructor(options: RadarrApiOptions) {
    this.endpoint = options.endpoint;

    this.headers = {
      'X-API-KEY': options.key,
      'User-Agent': `Whendarr/${getCurrentVersion()}`,
      ...options.headers
    };

    this.instance = options.instance;
  }

  calendar = async (params: RadarrCalendarParams) => {
    return this.get<RadarrCalendarResponse[]>(RadarrApiRoutes.calendar.get, params);
  };

  health = async (): Promise<ServiceHealthCheck> => {
    try {
      const response = await fetch(`${this.endpoint}${RadarrApiRoutes.health.get}`, {
        headers: this.headers,
        signal: AbortSignal.timeout(5000)
      });
      return {
        status: response.ok ? 'healthy' : 'unhealthy'
      };
    } catch {
      return {
        status: 'unhealthy'
      };
    }
  };

  private get = async <T>(url: string, params?: unknown): Promise<RadarrResponse<T>> => {
    const response = await fetch(
      `${this.endpoint}${params ? `${url}?${this.toSearchParams(params).toString()}` : url}`,
      {
        headers: this.headers
      }
    );

    this.instance?.log.debug({
      integration: {
        name: 'radarr',
        req: {
          method: 'GET',
          path: url,
          query: params,
          headers: this.headers
        },
        res: {
          ok: response.ok,
          status: response.status,
          length: response.headers.get('length')
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

export interface RadarrCalendarParams {
  start?: string;
  end?: string;
  unmonitored?: boolean;
  tags?: string;
}

type RadarrResponseSuccess<T> = {
  ok: true;
  data: T;
};

type RadarrResponseFailed = Response & {
  ok: false;
};

export type RadarrResponse<T> = RadarrResponseSuccess<T> | RadarrResponseFailed;

export interface RadarrCalendarResponse {
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
