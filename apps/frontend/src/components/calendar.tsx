import type { CalendarEvent, ReleaseType } from '@whendarr/shared';
import dayjs, { Dayjs } from 'dayjs';
import { Disc3, Popcorn, Laptop } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

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
  const dayEvents = events?.filter((e) => day.isSame(dayjs.tz(e.date), 'day'));
  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden border-l border-black last:border-r">
      <h2 className="text-center">
        {day.date() === 1 ? `${day.format('MMM')} ${day.date()}` : day.date()}
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
  if (!event) return <></>;

  if (event.type === 'movie') {
    if (event.available) {
      return (
        <div className="bg-accent flex items-center space-x-1 border-l-4 border-green-500 p-1 text-sm">
          <MovieReleaseIcon release={event.release} />
          <h3 className="pointer-events-none truncate">{event?.title}</h3>
        </div>
      );
    }

    if (event.release === 'cinema') {
      return (
        <div className="bg-accent flex items-center space-x-1 border-l-4 border-gray-500 p-1 text-sm">
          <MovieReleaseIcon release={event.release} />
          <h3 className="pointer-events-none truncate">{event?.title}</h3>
        </div>
      );
    }

    if (dayjs(event.date).isAfter(dayjs())) {
      return (
        <div className="bg-accent flex items-center space-x-1 border-l-4 border-blue-500 p-1 text-sm">
          <MovieReleaseIcon release={event.release} />
          <h3 className="pointer-events-none truncate">{event?.title}</h3>
        </div>
      );
    }
    return (
      <div className="bg-accent flex items-center space-x-1 border-l-4 border-red-500 p-1 text-sm">
        <MovieReleaseIcon release={event.release} />
        <h3 className="pointer-events-none truncate">{event?.title}</h3>
      </div>
    );
  }

  if (event.type === 'episode') {
    return (
      <div className="pointer-events-none flex border-l-4 border-amber-500 bg-amber-100 p-1 text-sm">
        <h3 className="truncate">{event?.title}</h3>
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

export { Calendar };
