import dayjs from 'dayjs';
import { createContext, useCallback, useContext, useState } from 'react';

export const CALENDAR_VIEWS = ['month', 'week', 'day'] as const;
export type CalendarViewMode = (typeof CALENDAR_VIEWS)[number];

export type CalendarState = {
  month: dayjs.Dayjs;
  selectedDay: dayjs.Dayjs;
  view: CalendarViewMode;
  filter: {
    movies: boolean;
    shows: boolean;
  };
  prevPeriod: () => void;
  nextPeriod: () => void;
  today: () => void;
  setFilter: (filter: Partial<CalendarState['filter']>) => void;
  setView: (view: CalendarViewMode) => void;
  selectDay: (day: dayjs.Dayjs) => void;
};

const initialState: CalendarState = {
  month: dayjs(),
  selectedDay: dayjs(),
  view: 'month',
  filter: {
    movies: true,
    shows: true
  },
  prevPeriod: () => null,
  nextPeriod: () => null,
  today: () => null,
  setFilter: () => null,
  setView: () => null,
  selectDay: () => null
};

const CalendarProviderContext = createContext<CalendarState>(initialState);

type CalendarProviderProps = {
  children: React.ReactNode;
};

export function CalendarProvider({ children, ...props }: CalendarProviderProps) {
  const [month, setMonth] = useState<dayjs.Dayjs>(initialState.month);
  const [selectedDay, setSelectedDay] = useState<dayjs.Dayjs>(initialState.selectedDay);
  const [view, setView] = useState<CalendarViewMode>(initialState.view);
  const [filters, setFilters] = useState<CalendarState['filter']>(initialState.filter);

  const prevPeriod = useCallback(() => {
    switch (view) {
      case 'month':
        setMonth((m) => {
          const next = m.subtract(1, 'month');
          setSelectedDay(next.endOf('month'));
          return next;
        });
        break;
      case 'week':
        setSelectedDay((d) => {
          const next = d.subtract(1, 'week').startOf('week');
          setMonth(next.startOf('month'));
          return next;
        });
        break;
      case 'day':
        setSelectedDay((d) => {
          const next = d.subtract(1, 'day');
          setMonth(next.startOf('month'));
          return next;
        });
        break;
    }
  }, [view]);

  const nextPeriod = useCallback(() => {
    switch (view) {
      case 'month':
        setMonth((m) => {
          const next = m.add(1, 'month');
          setSelectedDay(next.startOf('month'));
          return next;
        });
        break;
      case 'week':
        setSelectedDay((d) => {
          const next = d.add(1, 'week').startOf('week');
          setMonth(next.startOf('month'));
          return next;
        });

        break;
      case 'day':
        setSelectedDay((d) => {
          const next = d.add(1, 'day');
          setMonth(next.startOf('month'));
          return next;
        });

        break;
    }
  }, [view]);

  const today = useCallback(() => {
    const today = dayjs();
    setMonth(today);
    setSelectedDay(today);
  }, []);

  const setFilter = useCallback((filter: Partial<CalendarState['filter']>) => {
    setFilters((prev) => ({
      ...prev,
      ...filter
    }));
  }, []);

  const selectDay = useCallback((day: dayjs.Dayjs) => {
    setSelectedDay(day);
    setMonth(day.startOf('month'));
  }, []);

  const value: CalendarState = {
    month,
    selectedDay,
    view,
    filter: filters,
    prevPeriod,
    nextPeriod,
    today,
    setFilter,
    setView,
    selectDay
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
