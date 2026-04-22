import type {
  HEALTH_STATUS,
  MEDIA_TYPES,
  MOVIE_STATUS,
  RELEASE_TYPES,
  SHOW_AVAILABILITY,
  SHOW_STATUS
} from './constants.js';

export type MediaType = (typeof MEDIA_TYPES)[number];

export type ReleaseType = (typeof RELEASE_TYPES)[number];

export interface EventItem {
  type: MediaType;
  title: string;
  date: string;
  overview?: string;
  certification: string;
}

export interface MovieItem extends EventItem {
  type: 'movie';
  available: boolean;
  release: ReleaseType;
}

export type MovieStatus = (typeof MOVIE_STATUS)[number];

export type ShowStatus = (typeof SHOW_STATUS)[number];

export type ShowAvailability = (typeof SHOW_AVAILABILITY)[number];

export interface ShowItem extends EventItem {
  type: 'show';
  status: ShowStatus;
  episodes: EpisodeItem[];
  available: ShowAvailability;
}

export interface EpisodeItem {
  title: string;
  overview?: string;
  season: number;
  number: number;
  available: boolean;
  date: string;
}

export type CalendarEvent = MovieItem | ShowItem;

export interface VesrionInfo {
  current: {
    version: string;
    tag: string | null;
    commit: string | null;
    date: string | null;
    edge: boolean;
  };
  latest: {
    version: string;
    tag: string;
    url: string;
    published: string;
    edgeRelease: boolean;
    name: string | null;
    notes: string | null;
  } | null;
  hasUpdate: boolean;
  lastChecked: string | null;
}

export type HealthStatus = (typeof HEALTH_STATUS)[number];

export interface ServiceHealthCheck {
  status: HealthStatus;
}

export interface HealthCheck {
  status: HealthStatus;
  checks: {
    redis: ServiceHealthCheck;
    sonarr: ServiceHealthCheck;
    radarr: ServiceHealthCheck;
  };
  uptime: number;
  timestamp: number;
}
