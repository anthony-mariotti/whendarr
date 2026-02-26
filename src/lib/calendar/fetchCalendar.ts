import type { CalendarItem } from "$lib/components/CalendarItem";

export async function fetchCalendar(
    year: number,
    month: number,
    scope: string
): Promise<Array<CalendarItem>> {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const start = `${firstDay.toISOString().split('T')[0]}T00:00:00Z`;
    const end = `${lastDay.toISOString().split('T')[0]}T23:59:59Z`;

    const res = await fetch(
        `/api/calendar?scope=${scope}&start=${start}&end=${end}`
    );

    if (!res.ok) throw new Error('Calendar fetch failed');

    return await res.json();
}