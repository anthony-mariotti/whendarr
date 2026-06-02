import { ScrollAreaContext } from '@/components/layout/ScrollAreaContext';
import { useAppHeaderContent } from '@/components/mobile/AppHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UpcomingFeed, UpcomingHeader, UpcomingProvider, useUpcoming } from '@/components/upcoming';
import { useMemo, useState } from 'react';

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
  const [viewportRef, setViewportRef] = useState<HTMLDivElement | null>(null);

  return (
    <UpcomingProvider>
      <ScrollAreaContext.Provider value={viewportRef}>
        <ScrollArea className="flex-1" viewportRef={setViewportRef}>
          <UpcomingInner />
        </ScrollArea>
      </ScrollAreaContext.Provider>
    </UpcomingProvider>
  );
}
