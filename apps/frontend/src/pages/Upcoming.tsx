import { useAppHeaderContent } from '@/components/mobile/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCalendarFeedApi } from '@/hooks/api/useCalendarApi';
import { movieBackgroundColor, showStatus, STATUS_COLORS } from '@/lib/calendar';
import type { MovieItem, ShowItem } from '@whendarr/shared';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { ChevronDownIcon, FilmIcon, TvIcon } from 'lucide-react';
import { useMemo } from 'react';

function Upcoming() {
  const { data } = useCalendarFeedApi();

  const tvCount = useMemo(
    () => data?.feed.flatMap((day) => day.items).filter((item) => item.type === 'show').length,
    [data]
  );
  const movieCount = useMemo(
    () => data?.feed.flatMap((day) => day.items).filter((item) => item.type === 'movie').length,
    [data]
  );

  useAppHeaderContent(<UpcomingAppHeader tvCount={tvCount} movieCount={movieCount} />);

  if (!data || !data.feed) {
    return <div>Nothing to see here...</div>;
  }

  const { feed } = data;

  return (
    <div className="flex flex-col gap-2 p-3">
      {feed.map((d, dayIndex) => {
        const date = dayjs(d.date);
        return (
          <div className="flex flex-col gap-2" key={dayIndex}>
            <div>
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
              <CardDescription className="truncate overflow-hidden">TODO</CardDescription>
            </CardHeader>
            <div className="flex items-center justify-center gap-1 p-4">
              <ChevronDownIcon className="group-data-[state=open]:rotate-180" />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t-2 px-0">
            {item.episodes.map((episode, i) => (
              <>
                {i > 0 && <Separator />}
                <div key={episode.number} className="flex items-center gap-2 px-4 py-2">
                  <span className="text-muted-foreground shrink-0">
                    {`S${String(episode.season).padStart(2, '0')}E${String(episode.number).padStart(2, '0')}`}
                  </span>
                  <span className="grow">{episode.title}</span>
                </div>
              </>
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
        {/* <div className="flex items-center justify-center gap-1 p-4">
          <AvailabilityBadge status={showStatus(item)} />
        </div> */}
      </div>
    </Card>
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
        {/* <div className="flex items-center justify-center gap-1 p-4">
          <AvailabilityBadge status={movieStatus(item)} />
        </div> */}
      </div>
    </Card>
  );
}

function UpcomingAppHeader({ tvCount, movieCount }: { tvCount?: number; movieCount?: number }) {
  return (
    <div className="flex gap-1">
      <ToggleGroup type="single" defaultValue="all">
        <ToggleGroupItem value="all" variant={'outline'} size={'lg'}>
          All
        </ToggleGroupItem>
        <ToggleGroupItem value="tv" variant={'outline'} size={'lg'}>
          TV <span className="text-muted-foreground text-xs">{tvCount ?? 0}</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="movie" variant={'outline'} size={'lg'}>
          Movie <span className="text-muted-foreground text-xs">{movieCount ?? 0}</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export { Upcoming };
