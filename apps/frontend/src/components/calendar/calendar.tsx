import type { CalendarEvent, ReleaseType } from '@whendarr/shared';
import dayjs, { Dayjs } from 'dayjs';
import { Disc3, Popcorn, Laptop, Tv } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import clsx from 'clsx';

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
  event?: CalendarEvent;
}

function CalendarEvent({ event }: CalendarEventProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <CalendarEventTrigger event={event} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event?.title}</DialogTitle>
          <DialogDescription>{event?.overview}</DialogDescription>
          <Separator />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

interface CalendarEventTriggerProps {
  event?: CalendarEvent;
}

const statusClasses = {
  available: 'border-green-500',
  unavailable: 'border-red-500',
  partial: 'border-orange-500',
  future: 'border-blue-500',
  untracked: 'border-gray-500'
} as const;

function generateBorderColor(event: CalendarEvent) {
  if (dayjs(event.date).isAfter(dayjs())) {
    return statusClasses.future;
  }

  if (event.type === 'movie') {
    if (event.available) {
      return statusClasses.available;
    }

    if (event.release === 'cinema') {
      return statusClasses.untracked;
    }

    return statusClasses.unavailable;
  }

  if (event.type === 'show') {
    if (event.available === 'available') {
      return statusClasses.available;
    }

    if (event.available === 'partial') {
      return statusClasses.partial;
    }

    return statusClasses.unavailable;
  }

  return statusClasses.unavailable;
}

function CalendarEventTrigger({ event, ...props }: CalendarEventTriggerProps) {
  if (!event) return <></>;

  if (event.type === 'movie') {
    return (
      <div
        className={clsx(
          'bg-accent flex items-center space-x-1 border-l-4 p-1 text-sm',
          generateBorderColor(event)
        )}
        {...props}
      >
        <MovieReleaseIcon release={event.release} />
        <h3 className="cursor-pointer truncate">{event?.title}</h3>
      </div>
    );
  }

  if (event.type === 'show') {
    return (
      <div
        className={clsx(
          'bg-accent flex items-center space-x-1 border-l-4 p-1 text-sm',
          generateBorderColor(event)
        )}
        {...props}
      >
        <EpisodeIcon />
        <h3 className="cursor-pointer truncate">{event.title}</h3>
      </div>
    );
  }

  return <></>;
}

function MovieReleaseIcon({ release }: { release: ReleaseType }) {
  function icon() {
    switch (release) {
      case 'cinema':
        return <Popcorn size={16} />;
      case 'digital':
        return <Laptop size={16} />;
      case 'physical':
        return <Disc3 size={16} />;
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger>{icon()}</TooltipTrigger>
      <TooltipContent side="left" className="capitalize">
        {release}
      </TooltipContent>
    </Tooltip>
  );
}

function EpisodeIcon() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Tv size={16} />
      </TooltipTrigger>
      <TooltipContent side="left" className="capitalize">
        Episode
      </TooltipContent>
    </Tooltip>
  );
}

export { Calendar };
