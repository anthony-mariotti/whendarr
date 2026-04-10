export const MEDIA_TYPES = ['movie', 'episode'] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export const RELEASE_TYPES = ['cinema', 'digital', 'physical'] as const;
export type ReleaseType = (typeof RELEASE_TYPES)[number];

export interface EventItem {
  type: MediaType;
  title: string;
  available: boolean;
  date: string;
  overview?: string;
}

export interface MovieItem extends EventItem {
  type: 'movie';
  release: ReleaseType;
  certification: string;
}

export interface EpisodeBase extends EventItem {
  type: 'episode';
  series: {
    id: number;
    title: string;
    certification: string;
  };
}

export interface EpisodeItem extends EpisodeBase {
  type: 'episode';
  series: {
    id: number;
    title: string;
    certification: string;
  };
  grouped: false;
}

export interface EpisodeGroup extends EpisodeBase {
  grouped: true;
  episodes: EpisodeItem[];
}

export type CalendarEvent = MovieItem | EpisodeItem;
