import type { CalendarItem } from "$lib/components/CalendarItem";
import type { Dayjs } from "dayjs";

export async function fetchCalendar(
    date: Dayjs,
    scope: string
): Promise<Array<CalendarItem>> {
    const firstDay = date.startOf('month');
    const lastDay = date.endOf('month').subtract(1, 'day');

    const start = `${firstDay.toISOString().split('T')[0]}T00:00:00Z`;
    const end = `${lastDay.toISOString().split('T')[0]}T23:59:59Z`;

    const res = await fetch(
        `/api/calendar?scope=${scope}&start=${start}&end=${end}`
    );

    if (!res.ok) throw new Error('Calendar fetch failed');

    return await res.json();
}