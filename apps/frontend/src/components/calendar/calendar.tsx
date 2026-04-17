import type {
  CalendarEvent,
  EpisodeItem,
  MovieItem,
  ReleaseType,
  ShowItem
} from '@whendarr/shared';
import dayjs, { Dayjs } from 'dayjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Disc3Icon, LaptopIcon, FilmIcon, TvIcon } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ExpandableText } from '../expandableText';
import { createContext, useContext, useState } from 'react';
import { useCalendarApi } from '@/hooks/api/useCalendarApi';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';

type CalendarState = {
  month: dayjs.Dayjs;
  filter: {
    movies: boolean;
    show: boolean;
  };
  prevMonth: () => void;
  nextMonth: () => void;
  today: () => void;
  setFilter: (filter: Partial<CalendarState['filter']>) => void;
};

const initialState: CalendarState = {
  month: dayjs(),
  filter: {
    movies: true,
    show: true
  },
  prevMonth: () => null,
  nextMonth: () => null,
  today: () => null,
  setFilter: () => null
};

const CalendarProviderContext = createContext<CalendarState>(initialState);

type CalendarProviderProps = {
  children: React.ReactNode;
};

export function CalendarProvider({ children, ...props }: CalendarProviderProps) {
  const [month, setMonth] = useState<dayjs.Dayjs>(initialState.month);
  const [filters, setFilters] = useState<CalendarState['filter']>(initialState.filter);

  const value: CalendarState = {
    month,
    filter: filters,
    prevMonth: () => setMonth(month.subtract(1, 'month')),
    nextMonth: () => setMonth(month.add(1, 'month')),
    today: () => setMonth(dayjs()),
    setFilter: (filter: Partial<CalendarState['filter']>) => {
      setFilters({
        ...filters,
        ...filter
      });
    }
  };

  return (
    <CalendarProviderContext.Provider {...props} value={value}>
      {children}
    </CalendarProviderContext.Provider>
  );
}

export const useCalendar = () => {
  const context = useContext(CalendarProviderContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a <CalendarProvider>');
  }
  return context;
};

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

function Calendar() {
  const { month } = useCalendar();
  const { data: events, isLoading } = useCalendarApi();
  const { desktop } = useMediaQuery();

  const days = getMonthDays(month);
  const weeks = chunk(days, 7);

  return (
    <div className={clsx('relative mb-16 flex h-full flex-col sm:mb-0', { 'blur-xs': isLoading })}>
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
          <CalendarWeek key={i} week={week} events={events?.data} />
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
    <div className="border-border flex h-full w-full flex-1 flex-col border-t last:border-b">
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
    <div className="border-border relative flex h-full w-full flex-1 flex-col overflow-hidden border-l last:border-r">
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
  event: CalendarEvent;
}

function CalendarEvent({ event }: CalendarEventProps) {
  return (
    <Dialog>
      <CalendarEventTrigger event={event} />
      <DialogContent className="sm:max-w-lg">
        <CalendarDialogHeader title={event.title} overview={event.overview} />
        <Separator />
        <div className="no-scrollbar -mx-4 max-h-[40vh] space-y-2 overflow-y-auto px-4 py-px">
          <CalendarDialogContent event={event} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CalendarEventTriggerProps {
  event?: CalendarEvent;
}

function CalendarEventTrigger({ event, ...props }: CalendarEventTriggerProps) {
  if (!event) return <></>;

  if (event.type === 'movie') {
    return (
      <DialogTrigger asChild>
        <Movie event={event} {...props} />
      </DialogTrigger>
    );
  }

  if (event.type === 'show') {
    return (
      <DialogTrigger asChild>
        <Show event={event} {...props} />
      </DialogTrigger>
    );
  }

  return <></>;
}

interface CalendarDialogContentProps {
  event: CalendarEvent;
}

function CalendarDialogContent({ event }: CalendarDialogContentProps) {
  switch (event?.type) {
    case 'movie':
      return <MovieDetail event={event} />;
    case 'show':
      return (
        <>
          {event.episodes.map((episode, i) => (
            <Episode key={i} episode={episode} />
          ))}
        </>
      );
  }
}

interface CalendarDialogHeaderProps {
  title: string;
  overview?: string;
}

function CalendarDialogHeader({ title, overview }: CalendarDialogHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription asChild>
        <ExpandableText value={overview} />
      </DialogDescription>
    </DialogHeader>
  );
}

interface MovieProps {
  event: MovieItem;
}

function Movie({ event, ...props }: MovieProps) {
  const { t } = useTranslation(['common']);
  const release = event.release;

  return (
    <div
      className={clsx(
        'bg-accent flex items-center space-x-1 border-l-4 p-1 text-sm',
        movieBorderColor(event)
      )}
      {...props}
    >
      <Tooltip>
        <TooltipTrigger>
          <MovieReleaseIcon release={release} />
        </TooltipTrigger>
        <TooltipContent side="left">{t(`common:media:${release}`)}</TooltipContent>
      </Tooltip>
      <h3 className="cursor-pointer truncate">{event.title}</h3>
    </div>
  );
}

function MovieReleaseIcon({ release }: { release: ReleaseType }) {
  switch (release) {
    case 'cinema':
      return <FilmIcon size={16} />;
    case 'digital':
      return <LaptopIcon size={16} />;
    case 'physical':
      return <Disc3Icon size={16} />;
  }
}

export const BORDER_COLORS = {
  available: 'border-green-500',
  unavailable: 'border-red-500',
  partial: 'border-orange-500',
  future: 'border-blue-500',
  untracked: 'border-gray-500'
} as const;

function movieBorderColor(event: MovieItem) {
  if (event.release === 'cinema') {
    return BORDER_COLORS.untracked;
  }

  if (dayjs(event.date).isAfter(dayjs())) {
    return BORDER_COLORS.future;
  }

  if (event.available) {
    return BORDER_COLORS.available;
  }

  return BORDER_COLORS.unavailable;
}

interface ShowProps {
  event: ShowItem;
}

function Show({ event, ...props }: ShowProps) {
  const { t } = useTranslation(['common']);

  return (
    <div
      className={clsx(
        'bg-accent flex items-center space-x-1 border-l-4 p-1 text-sm',
        showBorderColor(event)
      )}
      {...props}
    >
      <Tooltip>
        <TooltipTrigger>
          <TvIcon size={16} />
        </TooltipTrigger>
        <TooltipContent side="left">{t(`common:media:tv_show`)}</TooltipContent>
      </Tooltip>
      <h3 className="cursor-pointer truncate">{event.title}</h3>
    </div>
  );
}

function showBorderColor(event: ShowItem) {
  if (dayjs(event.date).isAfter(dayjs())) {
    return BORDER_COLORS.future;
  }

  if (event.available === 'available') {
    return BORDER_COLORS.available;
  }

  if (event.available === 'partial') {
    return BORDER_COLORS.partial;
  }

  return BORDER_COLORS.unavailable;
}

interface EpisodeProps {
  episode: EpisodeItem;
}

function Episode({ episode }: EpisodeProps) {
  return (
    <Card>
      <div className="flex">
        <CardHeader className="grow">
          <CardTitle>{episode.title}</CardTitle>
          <CardDescription>
            S{String(episode.season).padStart(2, '0')} E{String(episode.number).padStart(2, '0')}
          </CardDescription>
        </CardHeader>
        {episode.date && (
          <div className="flex items-center justify-center px-4">
            <div>{dayjs(episode.date).format('hh:mm A')}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

interface MovieDetailProps {
  event: MovieItem;
}

function MovieDetail({ event }: MovieDetailProps) {
  return <div>{event.certification}</div>;
}

export { Calendar };
