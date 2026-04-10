const MEDIA_TYPES = ['movie', 'show'] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

const RELEASE_TYPES = ['cinema', 'digital', 'physical'] as const;
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

const SHOW_STATUS = ['deleted', 'continuing', 'ended', 'upcoming', 'unknown'] as const;
export type ShowStatus = (typeof SHOW_STATUS)[number];

const SHOW_AVAILABILITY = ['unavailable', 'partial', 'available'] as const;
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
}

export type CalendarEvent = MovieItem | ShowItem;
