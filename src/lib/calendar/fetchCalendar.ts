import type { CalendarItem } from '$lib/components/CalendarItem';
import type { Dayjs } from 'dayjs';

export async function fetchCalendar(date: Dayjs, scope: string): Promise<Array<CalendarItem>> {
  const start = date.startOf('month').format('YYYY-MM-DD');
  const end = date.endOf('month').format('YYYY-MM-DD');

  const res = await fetch(`/api/calendar?scope=${scope}&start=${start}&end=${end}`);

  if (!res.ok) throw new Error('Calendar fetch failed');

  return await res.json();
}
