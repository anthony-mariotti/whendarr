import type { MEDIA_TYPES, RELEASE_TYPES, SHOW_AVAILABILITY, SHOW_STATUS } from './constants.js';

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
}

export type CalendarEvent = MovieItem | ShowItem;
