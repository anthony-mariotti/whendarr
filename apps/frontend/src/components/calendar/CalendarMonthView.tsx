import type { CalendarEvent } from '@whendarr/shared';
import dayjs, { Dayjs } from 'dayjs';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useCalendar, type CalendarState } from '@/hooks/useCalendar';
import { chunk, getMonthDays } from '@/lib/calendar';
import { CalendarTile } from './CalendarTile';
import clsx from 'clsx';

interface CalendarMonthViewProps {
  events?: CalendarEvent[];
}

function CalendarMonthView({ events }: CalendarMonthViewProps) {
  const { month, filter } = useCalendar();
  const { desktop } = useMediaQuery();

  const days = getMonthDays(month);
  const weeks = chunk(days, 7);

  return (
    <>
      <div className="border-border border-b px-4 py-3 sm:hidden">
        <h2 className={clsx('text-xl font-semibold')}>{month.format('MMMM YYYY')}</h2>
        <p className="text-muted-foreground text-sm">
          {events?.length === 0
            ? 'No releases'
            : `${events?.length} release${events?.length !== 1 ? 's' : ''}`}
        </p>
      </div>
      <div className="flex">
        {desktop &&
          dayjs.weekdays().map((d) => (
            <div key={d} className="m-0 flex-1 p-3 text-center text-lg text-ellipsis">
              <h1 className="font-semibold">{d}</h1>
            </div>
          ))}
        {!desktop &&
          dayjs.weekdaysShort().map((d) => (
            <div key={d} className="m-0 flex-1 p-3 text-center text-lg text-ellipsis">
              <h1 className="font-semibold">{d}</h1>
            </div>
          ))}
      </div>
      <div className="flex flex-1 flex-col">
        {weeks.map((week, i) => (
          <CalendarWeek key={i} week={week} events={events} filter={filter} />
        ))}
      </div>
    </>
  );
}

interface CalendarWeekProps {
  week: Dayjs[];
  events?: CalendarEvent[];
  filter: CalendarState['filter'];
}

function CalendarWeek({ week, events, filter }: CalendarWeekProps) {
  return (
    <div className="border-border flex h-full w-full flex-1 flex-col border-t last:border-b">
      <div className="flex h-full w-full">
        {week.map((day, j) => {
          return <CalendarDay key={j} day={day} events={events} filter={filter} />;
        })}
      </div>
    </div>
  );
}

interface CalendarDayProps {
  day: Dayjs;
  events?: CalendarEvent[];
  filter: CalendarState['filter'];
}

function CalendarDay({ day, events, filter }: CalendarDayProps) {
  const dayEvents = events
    ?.filter((e) => day.isSame(dayjs(e.date), 'day'))
    .filter((event) => {
      switch (event.type) {
        case 'movie':
          return filter.movies;
        case 'show':
          return filter.shows;
        default:
          return true;
      }
    });
  return (
    <div className="border-border relative flex h-full w-full flex-1 flex-col overflow-hidden border-l last:border-r">
      <h2 className="text-center">
        {day.date() === 1 ? `${day.format('MMM')} ${day.format('D')}` : day.format('D')}
      </h2>
      <div className="flex h-full w-full flex-1 flex-col flex-nowrap space-y-1 p-1">
        {dayEvents?.map((event, idx) => (
          <CalendarTile key={idx} event={event} />
        ))}
      </div>
    </div>
  );
}

export { CalendarMonthView };
