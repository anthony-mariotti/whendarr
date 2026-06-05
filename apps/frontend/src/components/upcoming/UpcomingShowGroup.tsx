import { ChevronDownIcon, TvIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import type { EpisodeItem, ShowItem } from '@whendarr/shared';
import { showStatus, STATUS_COLORS } from '@/lib/calendar';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { Button } from '../ui/button';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function UpcomingShowGroup({ item }: { item: ShowItem }) {
  const { t } = useTranslation(['common', 'media']);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (item.episodes.length < 2) {
    return <EpisodeGroup item={item} />;
  }

  const availability = STATUS_COLORS[showStatus(item)];

  return (
    <Card className="p-0">
      <Collapsible className="group" open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex">
          <div className={clsx('flex items-center justify-center p-4', availability.background)}>
            <span className="sr-only">{availability.i18n}</span>
            <TvIcon />
          </div>
          <CardHeader className="grow rounded-none py-4">
            <CardTitle className="truncate overflow-hidden">{item.title}</CardTitle>
            <CardDescription className="truncate overflow-hidden">
              {t('media:count.episode_other', { count: item.episodes.length })}
            </CardDescription>
          </CardHeader>
          <CollapsibleTrigger asChild>
            <Button
              variant={'ghost'}
              size={'icon-lg'}
              className="flex size-auto items-center justify-center gap-1 rounded-none p-4"
            >
              <span className="sr-only">
                {isOpen ? t('common:actions.showLess') : t('common:actions.showMore')}
              </span>
              <ChevronDownIcon className="group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </div>
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
          <span className="sr-only">{availability.i18n}</span>
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
