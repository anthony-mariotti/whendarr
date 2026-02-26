export type TvCalendarItem = {
    type: 'tv';
    seriesId: number;
    series: string;
    title: string;
    season: number;
    episode: number;
    date: string;
    airTime: Date;
    hasFile: boolean;
}

export type MovieCalendarItem = {
    type: 'movie';
    title: string;
    status: string;
    isAvailable: boolean;
    inCinemas: string;
    physicalRelease: string;
    digitalRelease: string;
    releaseDate: string;
    hasFile: boolean;
}

export type CalendarItem = TvCalendarItem | MovieCalendarItem;