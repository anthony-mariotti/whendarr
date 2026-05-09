import { useCalendarApi } from '@/hooks/api/useCalendarApi';
import clsx from 'clsx';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { CalendarMonthView } from './CalendarMonthView';
import { useCalendar } from '@/hooks/useCalendar';

export function Calendar() {
  const { view } = useCalendar();
  const { data: events, isLoading, isFetching } = useCalendarApi();

  const isTransitioning = isLoading || isFetching;

  return (
    <div
      className={clsx('relative mb-16 flex h-full flex-col sm:mb-0', {
        'blur-xs': isTransitioning
      })}
    >
      {view === 'month' && <CalendarMonthView events={events?.data} />}
      {view === 'week' && <CalendarWeekView events={events?.data} />}
      {view === 'day' && <CalendarDayView events={events?.data} />}
    </div>
  );
}
