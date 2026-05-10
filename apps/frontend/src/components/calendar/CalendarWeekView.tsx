import type { CalendarEvent } from '@whendarr/shared';
import { CalendarTile } from './CalendarTile';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { eventsForDay, filterEvents, getWeekDays } from '@/lib/calendar';
import { useCalendar } from '@/hooks/useCalendar';
import { Button } from '../ui/button';

interface CalendarWeekViewProps {
  events?: CalendarEvent[];
}

function CalendarWeekView({ events }: CalendarWeekViewProps) {
  const { selected, filter, navigateToDay } = useCalendar();

  const week = getWeekDays(selected);
  const filtered = filterEvents(events, filter);

  const weekEventCount = week.reduce((sum, day) => sum + eventsForDay(filtered, day).length, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="border-border border-b px-4 py-3 sm:hidden">
        <h2 className={clsx('text-xl font-semibold')}>{selected.format('MMMM YYYY')}</h2>
        <p className="text-muted-foreground text-sm">
          {week.length === 0
            ? 'No releases'
            : `${weekEventCount} release${weekEventCount !== 1 ? 's' : ''}`}
        </p>
      </div>
      <div className="border-border flex border-b">
        {week.map((day) => {
          const isToday = day.isSame(dayjs(), 'day');

          return (
            <Button
              key={day.toString()}
              variant={'ghost'}
              className={clsx(
                'hover:text-primary flex h-auto flex-1 flex-col rounded-none py-2 text-center text-sm transition-colors',
                isToday && 'text-primary font-bold'
              )}
              onClick={() => navigateToDay(day)}
            >
              <div className="text-xs font-semibold sm:text-base">{day.format('ddd')}</div>
              <div
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs sm:h-7 sm:w-7 sm:text-sm',
                  isToday && 'bg-primary text-primary-foreground'
                )}
              >
                {day.format('D')}
              </div>
            </Button>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {week.map((day) => {
          const dayEvents = eventsForDay(filtered, day);
          const isToday = day.isSame(dayjs(), 'day');

          return (
            <div
              key={day.toString()}
              className={clsx(
                'border-border flex-1 overflow-y-auto border-l p-1 last:border-r',
                'flex flex-col space-y-1',
                isToday && 'bg-accent/30'
              )}
            >
              {dayEvents.length === 0 ? (
                <div className="text-muted-foreground flex h-full items-start justify-center pt-4 text-xs">
                  —
                </div>
              ) : (
                dayEvents.map((event, idx) => <CalendarTile key={idx} event={event} />)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { CalendarWeekView };
