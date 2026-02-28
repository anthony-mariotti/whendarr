export type SonarrAPICalendarItem = {
  seriesId: number;
  title: string;
  overview: string;
  seasonNumber: number;
  episodeNumber: number;
  airDateUtc: string;
  hasFile: boolean;
  series:
    | {
        title: string;
        certification: string;
        airTime: string;
      }
    | undefined;
};
