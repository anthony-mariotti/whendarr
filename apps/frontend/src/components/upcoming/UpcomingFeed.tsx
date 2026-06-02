import { useCalendarFeedApi } from '@/hooks/api/useCalendarApi';
import { useUpcoming } from './UpcomingContext';
import { useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { UpcomingShowGroup } from './UpcomingShowGroup';
import { UpcomingMovieGroup } from './UpcomingMovieGroup';
import { Loader2Icon, TicketXIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useScrollAreaContext } from '../layout/ScrollAreaContext';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FeedDay } from '@whendarr/shared';
import clsx from 'clsx';

export function UpcomingFeed() {
  'use no memo';

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCalendarFeedApi();
  const { filter, setShowCount, setMovieCount } = useUpcoming();
  const scrollElement = useScrollAreaContext();

  const flatFeed = useMemo(() => data?.pages.flatMap((page) => page.feed) ?? [], [data]);

  const allItems = useMemo(() => flatFeed.flatMap((d) => d.items) ?? [], [flatFeed]);

  useEffect(() => {
    setShowCount(allItems.filter((i) => i.type === 'show').length);
    setMovieCount(allItems.filter((i) => i.type === 'movie').length);
  }, [allItems, setShowCount, setMovieCount]);

  const filteredFeed = useMemo(() => {
    if (filter === 'all') return flatFeed;
    return flatFeed
      .map((day) => ({
        ...day,
        items: day.items.filter((item) => item.type === filter)
      }))
      .filter((day) => day.items.length > 0);
  }, [flatFeed, filter]);

  const headerSize = 24;
  const itemSize = 78;
  const spacing = 8;
  const virtualizer = useVirtualizer({
    count: filteredFeed.length,
    getScrollElement: () => scrollElement,
    estimateSize: (index) => {
      const gap = index === 0 ? 8 : 16;
      const itemCount = filteredFeed[index]?.items.length ?? 0;
      const estimateSize = headerSize + itemCount * itemSize + itemCount * spacing + gap;
      return estimateSize;
    },
    overscan: 3
  });

  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems.at(-1);
    if (!last) return;

    if (last.index >= filteredFeed.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, filteredFeed.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <UpcomingSkeleton />;
  }

  if (filteredFeed.length === 0) {
    return (
      <div className="absolute h-full w-full">
        <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center">
          <TicketXIcon size={48} />
          <h2 className="text-xl">No upcoming media</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map((virtualItem) => {
          const day = filteredFeed[virtualItem.index];
          if (!day) return <></>;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`
              }}
              className={clsx(
                'flex flex-col gap-2 pb-2',
                virtualItem.index === 0 ? 'pt-0' : 'pt-2'
              )}
            >
              <UpcomingRow day={day} />
            </div>
          );
        })}
      </div>
      <div className="text-muted-foreground flex w-full items-center justify-center py-6 text-sm">
        {isFetchingNextPage ? (
          <div className="flex animate-pulse items-center gap-2">
            <Loader2Icon className="animate-spin" size={16} />
            <span>Loading more...</span>
          </div>
        ) : hasNextPage ? (
          <span>Scroll for more</span>
        ) : (
          <span>You have reached the end</span>
        )}
      </div>
    </div>
  );
}

function DateHeader({ date }: { date: string }) {
  const d = dayjs(date);

  return (
    <div>
      {d.isSame(dayjs(), 'day') && (
        <>
          <span>{t('common:time.today').toLocaleUpperCase()}</span>
          <span>{' - '}</span>
        </>
      )}
      {d.isSame(dayjs().add(1, 'day'), 'day') && (
        <>
          <span>{t('common:time.tomorrow').toLocaleUpperCase()}</span>
          <span>{' - '}</span>
        </>
      )}
      <span className="font-medium">{d.format('ddd DD MMM').toLocaleUpperCase()}</span>
    </div>
  );
}

function UpcomingRow({ day }: { day: FeedDay }) {
  return (
    <>
      <DateHeader date={day.date} />
      <div className="flex flex-col space-y-2">
        {day.items.map((item, i) => {
          if (item.type === 'show') return <UpcomingShowGroup key={`${i}-show`} item={item} />;
          if (item.type === 'movie') return <UpcomingMovieGroup key={`${i}-movie`} item={item} />;
          return null;
        })}
      </div>
    </>
  );
}

function UpcomingSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-3">
      {[1, 2, 3].map((dayIndex) => (
        <div className="flex flex-col gap-2" key={dayIndex}>
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-col space-y-2">
            {[1, 2].map((itemIndex) => (
              <div key={itemIndex} className="flex items-center gap-4">
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
