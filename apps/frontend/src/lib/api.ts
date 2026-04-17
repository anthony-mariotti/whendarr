import {
  API_V1_BASE_PATH,
  type VesrionInfo,
  type CalendarEvent,
  type CalendarQuery
} from '@whendarr/shared';
import { BASE_PATH } from './basePath';

class WhendarrApi {
  private base: string;

  constructor(base: string = `${BASE_PATH}${API_V1_BASE_PATH}`) {
    this.base = base;
    console.log(base);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>)
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.base}${path}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      throw new Error(
        ((body.message ?? body.error) as string) ?? `Request failed: ${response.status}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType?.includes('application/json')) {
      return undefined as T;
    }

    return response.json();
  }

  calendar = {
    get: (params?: CalendarQuery) => {
      const searchParams = new URLSearchParams();
      if (params?.month) searchParams.set('month', String(params.month));
      if (params?.tz) searchParams.set('tz', String(params.tz));
      return this.request<{ data: CalendarEvent[]; raw: unknown }>(
        searchParams.size > 0 ? `/calendar?${searchParams.toString()}` : '/calendar'
      );
    }
  };

  version = {
    get: () => this.request<VesrionInfo>('/version')
  };
}

export const api = new WhendarrApi();
