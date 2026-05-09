import type { CalendarEvent } from '@whendarr/shared';
import { CalendarTile } from './CalendarTile';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { eventsForDay, filterEvents, getWeekDays } from '@/lib/calendar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useCalendar } from '@/hooks/useCalendar';

interface CalendarWeekViewProps {
  events?: CalendarEvent[];
}

function CalendarWeekView({ events }: CalendarWeekViewProps) {
  const { selectedDay, filter, selectDay, setView } = useCalendar();
  const { desktop } = useMediaQuery();

  const week = getWeekDays(selectedDay);
  const filtered = filterEvents(events, filter);

  return (
    <div className="flex h-full flex-col">
      {/* Weekday headers with full date */}
      <div className="border-border flex border-b">
        {week.map((day) => {
          const isToday = day.isSame(dayjs(), 'day');
          const isSelected = day.isSame(selectedDay, 'day');

          return (
            <button
              key={day.toString()}
              type="button"
              onClick={() => {
                selectDay(day);
                setView('day');
              }}
              className={clsx(
                'hover:text-primary flex-1 py-2 text-center text-sm transition-colors',
                isToday && 'text-primary font-bold',
                isSelected && 'bg-accent'
              )}
            >
              {desktop ? (
                <>
                  <div className="font-semibold">{day.format('ddd')}</div>
                  <div
                    className={clsx(
                      'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm',
                      isToday && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {day.format('D')}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-semibold">{day.format('dd')}</div>
                  <div
                    className={clsx(
                      'mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      isToday && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {day.format('D')}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Event columns */}
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
