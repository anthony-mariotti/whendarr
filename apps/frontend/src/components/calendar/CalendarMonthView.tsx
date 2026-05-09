import type { CalendarEvent } from '@whendarr/shared';
import dayjs, { Dayjs } from 'dayjs';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useCalendar } from '@/hooks/useCalendar';
import { chunk, eventsForDay, filterEvents, getMonthDays } from '@/lib/calendar';
import { CalendarTile } from './CalendarTile';
import clsx from 'clsx';
import { Button } from '../ui/button';

interface CalendarMonthViewProps {
  events?: CalendarEvent[];
}

function CalendarMonthView({ events }: CalendarMonthViewProps) {
  const { selected, filter, navigateToDay } = useCalendar();
  const { desktop } = useMediaQuery();

  const days = getMonthDays(selected);
  const weeks = chunk(days, 7);
  const filtered = filterEvents(events, filter);

  return (
    <>
      <div className="border-border border-b px-4 py-3 sm:hidden">
        <h2 className={clsx('text-xl font-semibold')}>{selected.format('MMMM YYYY')}</h2>
        <p className="text-muted-foreground text-sm">
          {events?.length === 0
            ? 'No releases'
            : `${events?.length} release${events?.length !== 1 ? 's' : ''}`}
        </p>
      </div>
      <div className="flex">
        {(desktop ? dayjs.weekdays() : dayjs.weekdaysShort()).map((d) => (
          <div key={d} className="m-0 flex-1 p-3 text-center text-lg text-ellipsis">
            <h1 className="font-semibold">{d}</h1>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        {weeks.map((week, i) => (
          <CalendarWeekRow
            key={i}
            week={week}
            events={filtered}
            currentMonth={selected}
            onCellClick={(day) => navigateToDay(day)}
          />
        ))}
      </div>
    </>
  );
}

interface CalendarWeekRowProps {
  week: Dayjs[];
  events: CalendarEvent[];
  currentMonth: Dayjs;
  onCellClick: (day: Dayjs) => void;
}

function CalendarWeekRow({ week, events, currentMonth, onCellClick }: CalendarWeekRowProps) {
  return (
    <div className="border-border flex h-full w-full flex-1 flex-col border-t last:border-b">
      <div className="flex h-full w-full">
        {week.map((day, j) => {
          return (
            <CalendarDayCell
              key={j}
              day={day}
              events={events}
              currentMonth={currentMonth}
              onCellClick={onCellClick}
            />
          );
        })}
      </div>
    </div>
  );
}

interface CalendarDayCellProps {
  day: Dayjs;
  events: CalendarEvent[];
  currentMonth: Dayjs;
  onCellClick: (day: Dayjs) => void;
}

function CalendarDayCell({ day, events, currentMonth, onCellClick }: CalendarDayCellProps) {
  const dayEvents = eventsForDay(events, day);
  const isToday = day.isSame(dayjs(), 'day');
  const isCurrentMonth = day.isSame(currentMonth, 'month');

  return (
    <div
      className={clsx(
        'border-border relative flex h-full w-full flex-1 flex-col overflow-hidden border-l last:border-r',
        { 'opacity-65': !isCurrentMonth }
      )}
    >
      <Button
        variant={'ghost'}
        className={clsx('rounded-none text-center', isToday && 'text-primary font-bold')}
        onClick={() => onCellClick(day)}
      >
        {day.date() === 1 ? `${day.format('MMM')} ${day.format('D')}` : day.format('D')}
      </Button>
      <div className="flex h-full w-full flex-1 flex-col flex-nowrap space-y-1 p-1">
        {dayEvents?.map((event, idx) => (
          <CalendarTile key={idx} event={event} />
        ))}
      </div>
    </div>
  );
}

export { CalendarMonthView };
