import type { CalendarState } from '@/hooks/useCalendar';
import type { CalendarEvent, EpisodeItem, MovieItem, ShowItem } from '@whendarr/shared';
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

export const STATUS_COLORS = {
  available: {
    border: 'border-green-500',
    background: 'bg-green-500 dark:bg-green-700',
    label: 'common:legend.available'
  },
  unavailable: {
    border: 'border-red-500',
    background: 'bg-red-500 dark:bg-red-700',
    label: 'common:legend.missing'
  },
  partial: {
    border: 'border-orange-500',
    background: 'bg-orange-500 dark:bg-orange-700',
    label: 'common:legend.partial'
  },
  future: {
    border: 'border-blue-500',
    background: 'bg-blue-500 dark:bg-blue-700',
    label: 'common:legend.future'
  },
  untracked: {
    border: 'border-gray-500',
    background: 'bg-gray-500 dark:bg-gray-700',
    label: 'common:legend.untracked'
  }
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;

export function movieStatus(event: MovieItem): StatusKey {
  if (event.release === 'cinema') return 'untracked';
  if (dayjs(event.date).isAfter(dayjs())) return 'future';
  if (event.available) return 'available';
  return 'unavailable';
}

export function showStatus(event: ShowItem): StatusKey {
  if (dayjs(event.date).isAfter(dayjs())) return 'future';
  if (event.available === 'available') return 'available';
  if (event.available === 'partial') return 'partial';
  return 'unavailable';
}

export function episodeStatus(episode: EpisodeItem): StatusKey {
  if (dayjs(episode.date).isAfter(dayjs())) return 'future';
  if (episode.available) return 'available';
  return 'unavailable';
}

export const movieBorderColor = (event: MovieItem) => STATUS_COLORS[movieStatus(event)].border;
export const movieBackgroundColor = (event: MovieItem) =>
  STATUS_COLORS[movieStatus(event)].background;
export const showBorderColor = (event: ShowItem) => STATUS_COLORS[showStatus(event)].border;
export const showBackgroundColor = (event: ShowItem) => STATUS_COLORS[showStatus(event)].background;
