export type RadarrAPICalendarItem = {
  title: string;
  overview: string;
  certification: string;
  status: string;
  isAvailable: boolean;
  inCinemas: string;
  physicalRelease: string;
  digitalRelease: string;
  hasFile: boolean;
  movieFile:
    | {
        qualityCutoffNotMet: boolean;
      }
    | undefined;
};
