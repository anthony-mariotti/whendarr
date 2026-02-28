export type TvCalendarItem = {
  type: 'tv';
  seriesId: number;
  series: string;
  title: string;
  overview: string;
  season: number;
  episode: number;
  certification: string;
  date: string;
  airTime: string;
  hasFile: boolean;
};

export type MovieCalendarItem = {
  type: 'movie';
  title: string;
  overview: string;
  certification: string;
  status: string;
  isAvailable: boolean;
  inCinemas: string;
  physicalRelease: string;
  digitalRelease: string;
  releaseDate: string;
  hasFile: boolean;
  qualityNotMet: boolean;
};

export type CalendarItem = TvCalendarItem | MovieCalendarItem;
