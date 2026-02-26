import type { CalendarItem } from "$lib/components/CalendarItem";
import { stripTimestamp } from "../utils";

export type CalendarDay = {
    date: string;
    dayNumber: number;
    releases: Array<CalendarItem>;
} | null;

function indexReleases(items: Array<CalendarItem>) {
    const map = new Map<string, CalendarItem[]>();

    const push = (key: string, item: CalendarItem) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    }

    for (const item of items) {
        if (item.type === 'tv') push(stripTimestamp(item.date), item);
        else {
            if (item.inCinemas) push(stripTimestamp(item.inCinemas), item);
            if (item.physicalRelease) push(stripTimestamp(item.physicalRelease), item);
            if (item.digitalRelease) push(stripTimestamp(item.digitalRelease), item);
        }
    }

    return map;
}

export function buildMonth(
    year: number,
    month: number,
    items: Array<CalendarItem>): Array<CalendarDay> {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const releaseMap = indexReleases(items);
    const days: CalendarDay[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month, day).toISOString();
      const iso = stripTimestamp(dateObj);

      days.push({
        date: iso,
        dayNumber: day,
        releases: releaseMap.get(iso) ?? []
      });
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
}