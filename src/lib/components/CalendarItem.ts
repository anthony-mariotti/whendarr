export type TvCalendarItem = {
    type: 'tv';
    series: string;
    title: string;
    season: number;
    episode: number;
    date: string;
    airTime: Date;
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
}

export type CalendarItem = TvCalendarItem | MovieCalendarItem;