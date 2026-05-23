import { createContext, useContext, useState } from 'react';

export type UpcomingFilter = 'all' | 'movie' | 'show';

export interface UpcomingContextState {
  filter: UpcomingFilter;
  setFilter: (filter: UpcomingFilter) => void;
  showCount: number;
  movieCount: number;
  setShowCount: (count: number) => void;
  setMovieCount: (count: number) => void;
}

const upcomingStateInit: UpcomingContextState = {
  filter: 'all',
  setFilter: () => null,
  showCount: 0,
  movieCount: 0,
  setShowCount: () => null,
  setMovieCount: () => null
};

const UpcomingContext = createContext<UpcomingContextState>(upcomingStateInit);

export function UpcomingProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<UpcomingFilter>(upcomingStateInit.filter);
  const [showCount, setShowCount] = useState<number>(upcomingStateInit.showCount);
  const [movieCount, setMovieCount] = useState<number>(upcomingStateInit.movieCount);

  const value: UpcomingContextState = {
    filter,
    setFilter,
    showCount,
    movieCount,
    setShowCount,
    setMovieCount
  };

  return <UpcomingContext.Provider value={value}>{children}</UpcomingContext.Provider>;
}

export function useUpcoming() {
  const context = useContext(UpcomingContext);
  if (!context) throw new Error('useUpcoming must be used within a <UpcomingProvider>');
  return context;
}
