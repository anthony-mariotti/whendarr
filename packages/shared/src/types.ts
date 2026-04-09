export const MEDIA_TYPES = ['movie', 'episode'] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export const RELEASE_TYPES = ['cinema', 'digital', 'physical'] as const;
export type ReleaseType = (typeof RELEASE_TYPES)[number];

export interface EventItem {
  type: MediaType;
  title: string;
  available: boolean;
  date: string;
  certification: string;
  overview?: string;
}

export interface MovieItem extends EventItem {
  type: 'movie';
  release: ReleaseType;
}

export interface EpisodeItem extends EventItem {
  type: 'episode';
}

export type CalendarEvent = MovieItem | EpisodeItem;
