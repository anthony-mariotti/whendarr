export interface RadarrApiOptions {
  endpoint: string;
  key: string;
  headers?: Record<string, string>;
}

export class RadarrApi {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(options: RadarrApiOptions) {
    this.endpoint = options.endpoint;

    this.headers = {
      'X-API-KEY': options.key,
      'User-Agent': 'Whendarr/0.0.1',
      ...options.headers
    };
  }

  private get = async <T>(url: string): Promise<RadarrResponse<T>> => {
    const response = await fetch(url, {
      headers: this.headers
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

  calendar = async (params: CalendarParams) => {
    const query = new URLSearchParams();
    if (params.start) query.set('start', params.start);
    if (params.end) query.set('end', params.end);
    if (params.unmonitored) query.set('unmonitored', `${params.unmonitored}`);
    if (params.tags) query.set('tags', params.tags);

    return this.get<CalendarResponse[]>(
      query.size > 0
        ? `${this.endpoint}/api/v3/calendar?${query}`
        : `${this.endpoint}/api/v3/calendar`
    );
  };
}

export interface CalendarParams {
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

export interface CalendarResponse {
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
