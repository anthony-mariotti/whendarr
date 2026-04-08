export const MEDIA_TYPES = ['movie', 'episode'] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export interface CalendarItem {
  type: MediaType;
  title: string;
  available: boolean;
  date: string;
  certification: string;
  overview?: string;
}

export const RELEASE_TYPES = ['cinema', 'digital', 'physical'] as const;
export type ReleaseType = (typeof RELEASE_TYPES)[number];

export interface MovieItem extends CalendarItem {
  type: 'movie';
  release: ReleaseType;
}

export interface EpisodeItem extends CalendarItem {
  type: 'episode';
}
