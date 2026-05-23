import { useAppHeaderContent } from '@/components/mobile/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCalendarFeedApi } from '@/hooks/api/useCalendarApi';
import { movieBackgroundColor, showStatus, STATUS_COLORS } from '@/lib/calendar';
import type { EpisodeItem, MovieItem, ShowItem } from '@whendarr/shared';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { ChevronDownIcon, FilmIcon, TvIcon } from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type UpcomingFilter = 'all' | 'movie' | 'show';

interface UpcomingContextState {
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

function UpcomingProvider({ children }: { children: React.ReactNode }) {
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

function useUpcoming() {
  const context = useContext(UpcomingContext);
  if (!context) throw new Error('useUpcoming must be used within a <UpcomingProvider>');
  return context;
}

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

function Upcoming() {
  return (
    <UpcomingProvider>
      <UpcomingInner />
    </UpcomingProvider>
  );
}

function UpcomingFeed() {
  const { data } = useCalendarFeedApi();
  const { filter, setShowCount, setMovieCount } = useUpcoming();

  const allItems = useMemo(() => data?.feed.flatMap((d) => d.items) ?? [], [data]);

  useEffect(() => {
    setShowCount(allItems.filter((i) => i.type === 'show').length);
    setMovieCount(allItems.filter((i) => i.type === 'movie').length);
  }, [allItems, setShowCount, setMovieCount]);

  const filteredFeed = useMemo(() => {
    if (filter === 'all') return data?.feed ?? [];
    return (data?.feed ?? [])
      .map((day) => ({
        ...day,
        items: day.items.filter((item) => item.type === filter)
      }))
      .filter((day) => day.items.length > 0);
  }, [data, filter]);

  if (!data || !data.feed) {
    return <div>Nothing to see here...</div>;
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
            <div key={`${d.date}-body`} className="flex flex-col space-y-4">
              {d.items.map((item, i) => {
                if (item.type === 'show') return <ShowGroup key={`${i}-show`} item={item} />;
                if (item.type === 'movie') return <MovieGroup key={`${i}-movie`} item={item} />;
                return <></>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShowGroup({ item }: { item: ShowItem }) {
  if (item.episodes.length < 2) {
    return <EpisodeGroup item={item} />;
  }

  const availability = STATUS_COLORS[showStatus(item)];

  return (
    <Card className="p-0">
      <Collapsible className="group">
        <CollapsibleTrigger asChild>
          <div className="flex">
            <div className={clsx('flex items-center justify-center p-4', availability.background)}>
              <span className="sr-only">{t(availability.label)}</span>
              <TvIcon />
            </div>
            <CardHeader className="grow rounded-none py-4">
              <CardTitle className="truncate overflow-hidden">{item.title}</CardTitle>
              <CardDescription className="truncate overflow-hidden">
                {item.episodes.length} Episodes
              </CardDescription>
            </CardHeader>
            <div className="flex items-center justify-center gap-1 p-4">
              <ChevronDownIcon className="group-data-[state=open]:rotate-180" />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-border border-t px-0">
            {item.episodes.map((episode, i) => (
              <EpisodeRow key={i} episode={episode} />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function EpisodeGroup({ item }: { item: ShowItem }) {
  const episode = item.episodes.at(0);

  if (!episode) {
    return <></>;
  }

  const availability = STATUS_COLORS[showStatus(item)];

  return (
    <Card className="p-0">
      <div className="flex">
        <div className={clsx('flex items-center justify-center p-4', availability.background)}>
          <span className="sr-only">{t(availability.label)}</span>
          <TvIcon />
        </div>
        <CardHeader className="grow rounded-none py-4">
          <CardTitle className="truncate overflow-hidden">{item.title}</CardTitle>
          <CardDescription className="truncate overflow-hidden">
            <span>{`S${String(episode.season).padStart(2, '0')}E${String(episode.number).padStart(2, '0')}`}</span>
            <span>{' - '}</span>
            <span>{episode.title}</span>
          </CardDescription>
        </CardHeader>
      </div>
    </Card>
  );
}

function EpisodeRow({ episode }: { episode: EpisodeItem }) {
  return (
    <div
      key={episode.number}
      className="border-border grid grid-cols-[min-content_1fr_min-content] gap-2 border-t px-4 py-2 first:border-t-0"
    >
      <p className="text-muted-foreground shrink-0">
        {`S${String(episode.season).padStart(2, '0')}E${String(episode.number).padStart(2, '0')}`}
      </p>
      <p className="truncate overflow-hidden">{episode.title}</p>
      <p className="text-muted-foreground min-w-max">{dayjs(episode.date).format('HH:mm A')}</p>
    </div>
  );
}

function MovieGroup({ item }: { item: MovieItem }) {
  return (
    <Card className="p-0">
      <div className="flex">
        <div className={clsx('flex items-center justify-center p-4', movieBackgroundColor(item))}>
          <FilmIcon />
        </div>
        <CardHeader className="grow rounded-none py-4">
          <CardTitle className="truncate overflow-hidden">{item.title}</CardTitle>
          <CardDescription className="truncate overflow-hidden">
            {t(`common:media:${item.release}`)}
          </CardDescription>
        </CardHeader>
      </div>
    </Card>
  );
}

interface UpcomingHeaderProps {
  filter: UpcomingFilter;
  setFilter: (filter: UpcomingFilter) => void;
  showCount: number;
  movieCount: number;
}

function UpcomingHeader({ filter, setFilter, showCount, movieCount }: UpcomingHeaderProps) {
  return (
    <div className="flex gap-1">
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && setFilter(v as UpcomingFilter)}
      >
        <ToggleGroupItem value="all" variant={'outline'} size={'lg'}>
          All
        </ToggleGroupItem>
        <ToggleGroupItem value="movie" variant={'outline'} size={'lg'} className="leading-snug">
          Movie <span className="text-muted-foreground text-xs">{movieCount}</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="show" variant={'outline'} size={'lg'} className="leading-snug">
          Show <span className="text-muted-foreground text-xs">{showCount}</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export { Upcoming };
