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

  const days = getMonthDays(selected);
  const weeks = chunk(days, 7);
  const filtered = filterEvents(events, filter);

  return (
    <>
      <CalendarWeekHeader />
      <div className="grid h-full overflow-y-auto">
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

function CalendarWeekHeader() {
  const { desktop } = useMediaQuery();

  return (
    <div className="border-border grid h-10 shrink-0 auto-cols-fr grid-flow-col items-center border-b">
      {(desktop ? dayjs.weekdays() : dayjs.weekdaysShort()).map((d) => (
        <div key={d} className="text-center text-lg text-ellipsis">
          <h1 className="font-semibold">{d}</h1>
        </div>
      ))}
    </div>
  );
}

function CalendarWeekRow({ week, events, currentMonth, onCellClick }: CalendarWeekRowProps) {
  return (
    <div className="border-border grid auto-cols-fr grid-flow-col border-t last:border-b">
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
        'border-border relative flex min-w-0 flex-col overflow-hidden border-l last:border-r',
        { 'opacity-45': !isCurrentMonth }
      )}
    >
      <Button
        variant={'ghost'}
        className={clsx(
          'h-8 min-h-8 rounded-none px-0 text-center',
          isToday && 'text-primary font-bold'
        )}
        onClick={() => onCellClick(day)}
      >
        {day.date() === 1 ? `${day.format('MMM')} ${day.format('D')}` : day.format('D')}
      </Button>
      <div className="flex h-full w-full flex-1 flex-col flex-nowrap space-y-1 p-1">
        {dayEvents?.length > 3
          ? dayEvents.slice(0, 2).map((event, idx) => <CalendarTile key={idx} event={event} />)
          : dayEvents.map((event, idx) => <CalendarTile key={idx} event={event} />)}
      </div>
      {dayEvents.length > 3 && (
        <Button
          variant={'ghost'}
          size={'xs'}
          className={clsx('h-8 min-h-8 rounded-none px-0 text-center')}
          onClick={() => onCellClick(day)}
        >
          +{dayEvents.length - 2}
        </Button>
      )}
    </div>
  );
}

export { CalendarMonthView };
