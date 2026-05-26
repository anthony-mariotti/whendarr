import { useCalendarFeedApi } from '@/hooks/api/useCalendarApi';
import { useUpcoming } from './UpcomingContext';
import { useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { UpcomingShowGroup } from './UpcomingShowGroup';
import { UpcomingMovieGroup } from './UpcomingMovieGroup';
import { Loader2Icon, TicketXIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function UpcomingFeed() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCalendarFeedApi();
  const { filter, setShowCount, setMovieCount } = useUpcoming();

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

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const scrollContainer = target.closest('[data-radix-scroll-area-viewport]');

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: scrollContainer,
        rootMargin: '0px 0px 600px 0px',
        threshold: 0
      }
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    <div className="flex flex-col gap-4 p-3">
      {filteredFeed.map((d, dayIndex) => {
        const date = dayjs(d.date);
        return (
          <div className="flex flex-col gap-2" key={dayIndex}>
            <div>
              {date.isSame(dayjs(), 'day') && (
                <>
                  <span>{t('common:time.today').toLocaleUpperCase()}</span>
                  <span>{' - '}</span>
                </>
              )}
              {date.isSame(dayjs().add(1, 'day'), 'day') && (
                <>
                  <span>{t('common:time.tomorrow').toLocaleUpperCase()}</span>
                  <span>{' - '}</span>
                </>
              )}
              <span className="font-medium">{date.format('ddd DD MMM').toLocaleUpperCase()}</span>
            </div>
            <div key={`${d.date}-body`} className="flex flex-col space-y-2">
              {d.items.map((item, i) => {
                if (item.type === 'show')
                  return <UpcomingShowGroup key={`${i}-show`} item={item} />;
                if (item.type === 'movie')
                  return <UpcomingMovieGroup key={`${i}-movie`} item={item} />;
                return <></>;
              })}
            </div>
          </div>
        );
      })}

      <div
        ref={observerTarget}
        className="text-muted-foreground flex w-full items-center justify-center py-6 text-sm"
      >
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

function UpcomingSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-3">
      {[1, 2, 3].map((dayIndex) => (
        <div className="flex flex-col gap-2" key={dayIndex}>
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-col space-y-2">
            {[1, 2].map((itemIndex) => (
              <div key={itemIndex} className="flex items-center gap-4">
                {/* Poster/Thumbnail Skeleton */}
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
