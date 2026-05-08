import dayjs from 'dayjs';
import { createContext, useContext, useState } from 'react';

export type CalendarViewMode = 'month' | 'week' | 'day';

export type CalendarState = {
  month: dayjs.Dayjs;
  view: CalendarViewMode;
  filter: {
    movies: boolean;
    shows: boolean;
  };
  prevMonth: () => void;
  nextMonth: () => void;
  today: () => void;
  setFilter: (filter: Partial<CalendarState['filter']>) => void;
  setView: (view: CalendarViewMode) => void;
};

const initialState: CalendarState = {
  month: dayjs(),
  view: 'month',
  filter: {
    movies: true,
    shows: true
  },
  prevMonth: () => null,
  nextMonth: () => null,
  today: () => null,
  setFilter: () => null,
  setView: () => null
};

const CalendarProviderContext = createContext<CalendarState>(initialState);

type CalendarProviderProps = {
  children: React.ReactNode;
};

export function CalendarProvider({ children, ...props }: CalendarProviderProps) {
  const [month, setMonth] = useState<dayjs.Dayjs>(initialState.month);
  const [view, setView] = useState<CalendarViewMode>(initialState.view);
  const [filters, setFilters] = useState<CalendarState['filter']>(initialState.filter);

  const value: CalendarState = {
    month,
    view,
    filter: filters,
    prevMonth: () => setMonth(month.subtract(1, 'month')),
    nextMonth: () => setMonth(month.add(1, 'month')),
    today: () => setMonth(dayjs()),
    setFilter: (filter: Partial<CalendarState['filter']>) => {
      setFilters({
        ...filters,
        ...filter
      });
    },
    setView: (view) => setView(view)
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
