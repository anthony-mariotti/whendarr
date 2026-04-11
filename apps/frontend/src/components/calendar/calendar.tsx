import type {
  CalendarEvent,
  EpisodeItem,
  MovieItem,
  ReleaseType,
  ShowItem
} from '@whendarr/shared';
import dayjs, { Dayjs } from 'dayjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Disc3Icon, LaptopIcon, PopcornIcon, TvIcon } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

function getMonthDays(date: Dayjs): Dayjs[] {
  const start = date.startOf('month').startOf('week');
  const end = date.endOf('month').endOf('week');

  const days: Dayjs[] = [];
  let current = start;

  while (current <= end) {
    days.push(current);
    current = current.add(1, 'day');
  }

  return days;
}

function chunk(array: Dayjs[], size: number) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

interface Props {
  selectedMonth: dayjs.Dayjs;
  events?: CalendarEvent[];
  isLoading?: boolean;
}

function Calendar({ selectedMonth, events, isLoading }: Props) {
  const days = getMonthDays(selectedMonth);
  const weeks = chunk(days, 7);

  return (
    <div className="flex h-full flex-col">
      <div className="flex">
        {dayjs.weekdaysShort().map((d) => (
          <div key={d} className="m-0 flex-1 p-3 text-center text-lg text-ellipsis">
            <h1 className="font-semibold">{d}</h1>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        {weeks.map((week, i) => (
          <CalendarWeek key={i} week={week} events={events} />
        ))}
      </div>
    </div>
  );
}

interface CalendarWeekProps {
  week: Dayjs[];
  events?: CalendarEvent[];
}

function CalendarWeek({ week, events }: CalendarWeekProps) {
  return (
    <div className="flex h-full w-full flex-1 flex-col border-t border-black last:border-b">
      <div className="flex h-full w-full">
        {week.map((day, j) => {
          return <CalendarDay key={j} day={day} events={events} />;
        })}
      </div>
    </div>
  );
}

interface CalendarDayProps {
  day: Dayjs;
  events?: CalendarEvent[];
}

function CalendarDay({ day, events }: CalendarDayProps) {
  const dayEvents = events?.filter((e) => day.isSame(dayjs(e.date), 'day'));
  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden border-l border-black last:border-r">
      <h2 className="text-center">
        {day.date() === 1 ? `${day.format('MMM')} ${day.format('D')}` : day.format('D')}
      </h2>
      <div className="flex h-full w-full flex-1 flex-col flex-nowrap space-y-1 p-1">
        {dayEvents?.map((event, idx) => (
          <CalendarEvent key={idx} event={event} />
        ))}
      </div>
    </div>
  );
}

interface CalendarEventProps {
  event: CalendarEvent;
}

function CalendarEvent({ event }: CalendarEventProps) {
  return (
    <Dialog>
      <CalendarEventTrigger event={event} />

      <DialogContent className="sm:max-w-lg">
        <CalendarDialogHeader title={event.title} overview={event.overview} />
        <CalendarDialogContent event={event} />
      </DialogContent>
    </Dialog>
  );
}

interface CalendarEventTriggerProps {
  event?: CalendarEvent;
}

function CalendarEventTrigger({ event, ...props }: CalendarEventTriggerProps) {
  if (!event) return <></>;

  if (event.type === 'movie') {
    return (
      <DialogTrigger asChild>
        <Movie event={event} {...props} />
      </DialogTrigger>
    );
  }

  if (event.type === 'show') {
    return (
      <DialogTrigger asChild>
        <Show event={event} {...props} />
      </DialogTrigger>
    );
  }

  return <></>;
}

interface CalendarDialogContentProps {
  event: CalendarEvent;
}

function CalendarDialogContent({ event, ...props }: CalendarDialogContentProps) {
  switch (event?.type) {
    case 'movie':
      return <MovieDetail event={event} />;
    case 'show':
      return (
        <>
          {event.episodes.map((episode, i) => (
            <Episode key={i} episode={episode} />
          ))}
        </>
      );
  }
}

interface CalendarDialogHeaderProps {
  title: string;
  overview?: string;
}

function CalendarDialogHeader({ title, overview }: CalendarDialogHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{overview}</DialogDescription>
      <Separator />
    </DialogHeader>
  );
}

interface MovieProps {
  event: MovieItem;
}

function Movie({ event, ...props }: MovieProps) {
  const { t } = useTranslation(['common']);
  const release = event.release;

  return (
    <div
      className={clsx(
        'bg-accent flex items-center space-x-1 border-l-4 p-1 text-sm',
        movieBorderColor(event)
      )}
      {...props}
    >
      <Tooltip>
        <TooltipTrigger>
          <MovieReleaseIcon release={release} />
        </TooltipTrigger>
        <TooltipContent side="left">{t(`common:media:${release}`)}</TooltipContent>
      </Tooltip>
      <h3 className="cursor-pointer truncate">{event.title}</h3>
    </div>
  );
}

function MovieReleaseIcon({ release }: { release: ReleaseType }) {
  switch (release) {
    case 'cinema':
      return <PopcornIcon size={16} />;
    case 'digital':
      return <LaptopIcon size={16} />;
    case 'physical':
      return <Disc3Icon size={16} />;
  }
}

export const BORDER_COLORS = {
  available: 'border-green-500',
  unavailable: 'border-red-500',
  partial: 'border-orange-500',
  future: 'border-blue-500',
  untracked: 'border-gray-500'
} as const;

function movieBorderColor(event: MovieItem) {
  if (dayjs(event.date).isAfter(dayjs())) {
    return BORDER_COLORS.future;
  }

  if (event.available) {
    return BORDER_COLORS.available;
  }

  if (event.release === 'cinema') {
    return BORDER_COLORS.untracked;
  }

  return BORDER_COLORS.unavailable;
}

interface ShowProps {
  event: ShowItem;
}

function Show({ event, ...props }: ShowProps) {
  const { t } = useTranslation(['common']);

  return (
    <div
      className={clsx(
        'bg-accent flex items-center space-x-1 border-l-4 p-1 text-sm',
        showBorderColor(event)
      )}
      {...props}
    >
      <Tooltip>
        <TooltipTrigger>
          <TvIcon size={16} />
        </TooltipTrigger>
        <TooltipContent side="left">{t(`common:media:episode`)}</TooltipContent>
      </Tooltip>
      <h3 className="cursor-pointer truncate">{event.title}</h3>
    </div>
  );
}

function showBorderColor(event: ShowItem) {
  if (dayjs(event.date).isAfter(dayjs())) {
    return BORDER_COLORS.future;
  }

  if (event.available === 'available') {
    return BORDER_COLORS.available;
  }

  if (event.available === 'partial') {
    return BORDER_COLORS.partial;
  }

  return BORDER_COLORS.unavailable;
}

interface EpisodeProps {
  episode: EpisodeItem;
}

function Episode({ episode, ...props }: EpisodeProps) {
  return <p>{episode.title}</p>;
}

interface MovieDetailProps {
  event: MovieItem;
}

function MovieDetail({ ...props }: MovieDetailProps) {
  return <></>;
}

export { Calendar };
