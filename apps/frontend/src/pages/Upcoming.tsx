import { useAppHeaderContent } from '@/components/mobile/AppHeader';
import { UpcomingFeed, UpcomingHeader, UpcomingProvider, useUpcoming } from '@/components/upcoming';
import { useMemo } from 'react';

function UpcomingInner() {
  const { filter, setFilter, showCount, movieCount } = useUpcoming();

  const headerNode = useMemo(
    () => (
      <UpcomingHeader
        filter={filter}
        setFilter={setFilter}
        showCount={showCount}
        movieCount={movieCount}
      />
    ),
    [filter, setFilter, showCount, movieCount]
  );

  useAppHeaderContent(headerNode);

  return <UpcomingFeed />;
}

export function Upcoming() {
  return (
    <UpcomingProvider>
      <UpcomingInner />
    </UpcomingProvider>
  );
}
