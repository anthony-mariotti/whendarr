import type { CalendarItem } from "$lib/components/CalendarItem";
import dayjs, { type Dayjs } from "$lib/helpers/dayjs";

export type CalendarDay = {
    date: Dayjs;
    dayNumber: number;
    releases: Array<CalendarItem>;
} | null;

function indexReleases(currentDate: Dayjs, items: Array<CalendarItem>) {
    const map = new Map<string, CalendarItem[]>();

    const push = (date: Dayjs, item: CalendarItem) => {
        if (!currentDate.isSame(date, 'month')) return;

        const key = date.format('YYYY-MM-DD');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    }

    for (const item of items) {
        if (item.type === 'tv') {
            push(dayjs.utc(item.date).local(), item);
        }
        else {
            if (item.inCinemas) push(dayjs.utc(item.inCinemas).local(), item);
            if (item.physicalRelease) push(dayjs.utc(item.physicalRelease).local(), item);
            if (item.digitalRelease) push(dayjs.utc(item.digitalRelease).local(), item);
        }
    }

    console.log(map);
    return map;
}

export function buildMonth(
    date: Dayjs,
    items: Array<CalendarItem>): Array<CalendarDay> {
    const firstDay = date.startOf('month');
    const lastDay = date.endOf('month');

    const startDayOfWeek = firstDay.day();
    const totalDays = lastDay.date();

    const releaseMap = indexReleases(date, items);
    const days: CalendarDay[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
        const current = date.set('date', day);
        days.push({
            date: current,
            dayNumber: day,
            releases: releaseMap.get(current.format('YYYY-MM-DD')) ?? []
        });
    }

    while (days.length % 7 !== 0) {
        days.push(null);
    }

    return days;
}