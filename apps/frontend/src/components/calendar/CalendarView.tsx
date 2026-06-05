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
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
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
import { ButtonGroup } from '../ui/button-group';

export function CalendarView() {
  return (
    <CalendarProvider>
      <CalendarViewInner />
    </CalendarProvider>
  );
}

function CalendarViewInner() {
  const { view, selected, prevView, setView, prevPeriod, nextPeriod } = useCalendar();
  const { data: events, isLoading, isFetching } = useCalendarApi();

  const isTransitioning = isLoading || isFetching;

  const headerNode = useMemo(
    () => (
      <div
        className={cn('flex min-w-0 items-center gap-2 pr-3', {
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
        {!prevView && (
          <ButtonGroup>
            <Button variant={'outline'} size={'icon-lg'} onClick={prevPeriod}>
              <span className="sr-only">{t('actions.previousMonth')}</span>
              <ChevronLeftIcon />
            </Button>
            <Button variant={'outline'} size={'icon-lg'} onClick={nextPeriod}>
              <span className="sr-only">{t('actions.nextMonth')}</span>
              <ChevronRightIcon />
            </Button>
          </ButtonGroup>
        )}
        <div className="min-w-0 flex-1 text-center">
          <h2 className={clsx('truncate text-xl font-semibold')}>
            {view === 'day' && selected.format('MMMM D, YYYY')}
            {view !== 'day' && selected.format('MMMM, YYYY')}
          </h2>
        </div>
        <div className="shrink-0">
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
      </div>
    ),
    [prevView, selected, view, setView, prevPeriod, nextPeriod]
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
