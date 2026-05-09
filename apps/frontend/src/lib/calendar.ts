import type { CalendarState } from '@/hooks/useCalendar';
import type { CalendarEvent, MovieItem, ShowItem } from '@whendarr/shared';
import dayjs from 'dayjs';

export function getMonthDays(date: dayjs.Dayjs): dayjs.Dayjs[] {
  const start = date.startOf('month').startOf('week');
  const end = date.endOf('month').endOf('week');

  const days: dayjs.Dayjs[] = [];
  let current = start;

  while (current <= end) {
    days.push(current);
    current = current.add(1, 'day');
  }

  return days;
}

export function getWeekDays(date: dayjs.Dayjs): dayjs.Dayjs[] {
  const start = date.startOf('week');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
}

export function filterEvents(events: CalendarEvent[] | undefined, filter: CalendarState['filter']) {
  return (events ?? []).filter((event) => {
    switch (event.type) {
      case 'movie':
        return filter.movies;
      case 'show':
        return filter.shows;
      default:
        return true;
    }
  });
}

export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function eventsForDay(events: CalendarEvent[], day: dayjs.Dayjs): CalendarEvent[] {
  return events.filter((e) => day.isSame(dayjs(e.date), 'day'));
}

const BORDER_COLORS = {
  available: 'border-green-500',
  unavailable: 'border-red-500',
  partial: 'border-orange-500',
  future: 'border-blue-500',
  untracked: 'border-gray-500'
} as const;

export function movieBorderColor(event: MovieItem) {
  if (event.release === 'cinema') return BORDER_COLORS.untracked;
  if (dayjs(event.date).isAfter(dayjs())) return BORDER_COLORS.future;
  if (event.available) return BORDER_COLORS.available;
  return BORDER_COLORS.unavailable;
}

export function showBorderColor(event: ShowItem) {
  if (dayjs(event.date).isAfter(dayjs())) return BORDER_COLORS.future;
  if (event.available === 'available') return BORDER_COLORS.available;
  if (event.available === 'partial') return BORDER_COLORS.partial;
  return BORDER_COLORS.unavailable;
}
