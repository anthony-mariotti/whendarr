import { useCalendarApi } from '@/hooks/api/useCalendarApi';
import clsx from 'clsx';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { CalendarMonthView } from './CalendarMonthView';
import { CALENDAR_VIEWS, CalendarProvider, useCalendar } from '@/hooks/useCalendar';
import { useMemo } from 'react';
import { useAppHeaderContent } from '../mobile/AppHeader';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { CalendarViewIcon } from './CalendarViewIcon';
import { t } from 'i18next';

export function CalendarView() {
  return (
    <CalendarProvider>
      <CalendarViewInner />
    </CalendarProvider>
  );
}

function CalendarViewInner() {
  const { view, selected, prevView, setView } = useCalendar();
  const { data: events, isLoading, isFetching } = useCalendarApi();

  const isTransitioning = isLoading || isFetching;

  const headerNode = useMemo(
    () => (
      <>
        <div
          className={cn('flex items-center space-x-2', {
            'pl-3': !prevView
          })}
        >
          {prevView && (
            <Button
              variant={'ghost'}
              size={'icon-lg'}
              className="h-full min-w-12 rounded-none"
              onClick={() => setView(prevView)}
            >
              <ArrowLeftIcon className="size-6" />
            </Button>
          )}
          <h2 className={clsx('text-2xl font-semibold')}>
            {view === 'day' && selected.format('dddd, MMMM D, YYYY')}
            {view !== 'day' && selected.format('MMMM, YYYY')}
          </h2>
        </div>
        {view === 'month' && (
          <div>
            <Select value={view} defaultValue={view} onValueChange={setView}>
              {/* @ts-expect-error shadcn doesn't provide lg, but works as intended :) */}
              <SelectTrigger size="lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CALENDAR_VIEWS.map((view) => {
                    return (
                      <SelectItem key={view} value={view}>
                        <CalendarViewIcon view={view} size={16} />
                        {t(`common:time.${view}`)}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </>
    ),
    [prevView, selected, view, setView]
  );

  useAppHeaderContent(headerNode);

  return (
    <div
      className={clsx('relative flex h-full min-h-0 w-full max-w-full flex-1 flex-col', {
        'blur-xs': isTransitioning
      })}
    >
      {view === 'month' && <CalendarMonthView events={events?.data} />}
      {view === 'week' && <CalendarWeekView events={events?.data} />}
      {view === 'day' && <CalendarDayView events={events?.data} />}
    </div>
  );
}
