import dayjs from 'dayjs';
import { createContext, useCallback, useContext, useState } from 'react';

export const CALENDAR_VIEWS = ['month', 'week', 'day'] as const;
export type CalendarViewMode = (typeof CALENDAR_VIEWS)[number];

export type CalendarState = {
  selected: dayjs.Dayjs;
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
  selected: dayjs(),
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
  const [selected, setSelected] = useState<dayjs.Dayjs>(initialState.selected);
  const [view, setView] = useState<CalendarViewMode>(initialState.view);
  const [filters, setFilters] = useState<CalendarState['filter']>(initialState.filter);

  const prevPeriod = useCallback(() => {
    switch (view) {
      case 'month':
        setSelected((m) => m.subtract(1, 'month').startOf('month'));
        break;
      case 'week':
        setSelected((m) => m.subtract(1, 'week').startOf('week'));
        break;
      case 'day':
        setSelected((m) => m.subtract(1, 'day'));
        break;
    }
  }, [view]);

  const nextPeriod = useCallback(() => {
    switch (view) {
      case 'month':
        setSelected((m) => m.add(1, 'month').startOf('month'));
        break;
      case 'week':
        setSelected((m) => m.add(1, 'week').startOf('week'));
        break;
      case 'day':
        setSelected((d) => d.add(1, 'day'));
        break;
    }
  }, [view]);

  const today = useCallback(() => {
    const today = dayjs();
    setSelected(today);
  }, []);

  const setFilter = useCallback((filter: Partial<CalendarState['filter']>) => {
    setFilters((prev) => ({
      ...prev,
      ...filter
    }));
  }, []);

  const selectDay = useCallback((day: dayjs.Dayjs) => {
    setSelected(day);
  }, []);

  const value: CalendarState = {
    selected,
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
