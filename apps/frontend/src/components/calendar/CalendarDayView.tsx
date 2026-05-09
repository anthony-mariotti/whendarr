import type { CalendarEvent, MovieItem, ShowItem } from '@whendarr/shared';
import dayjs from 'dayjs';
import clsx from 'clsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { CalendarIcon, TvIcon } from 'lucide-react';
import { Card } from '../ui/card';
import { useTranslation } from 'react-i18next';
import { ExpandableText } from '../expandableText';
import { useCalendar } from '@/hooks/useCalendar';
import { eventsForDay, filterEvents, movieBorderColor, showBorderColor } from '@/lib/calendar';
import { MediaMovieDetail } from '../media/MediaMovieDetail';
import { MediaShowEpisode } from '../media/MediaShowEpisode';
import { MediaMovieReleaseIcon } from '../media/MediaMovieReleaseIcon';

interface CalendarDayViewProps {
  events?: CalendarEvent[];
}

export function CalendarDayView({ events }: CalendarDayViewProps) {
  const { selected, filter } = useCalendar();

  const filtered = filterEvents(events, filter);
  const dayEvents = eventsForDay(filtered, selected);

  const isToday = selected.isSame(dayjs(), 'day');

  return (
    <div className="flex h-full flex-col">
      <div className="border-border border-b px-4 py-3">
        <h2 className={clsx('text-xl font-semibold', isToday && 'text-primary')}>
          {selected.format('dddd, MMMM D, YYYY')}
          {isToday && (
            <span className="text-primary bg-primary/10 ml-2 rounded-full px-2 py-0.5 text-sm font-normal">
              Today
            </span>
          )}
        </h2>
        <p className="text-muted-foreground text-sm">
          {dayEvents.length === 0
            ? 'No releases'
            : `${dayEvents.length} release${dayEvents.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {dayEvents.length === 0 ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 py-16 text-sm">
            <span>
              <CalendarIcon className="size-9" />
            </span>
            <span>Nothing scheduled for this day</span>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {dayEvents.map((event, idx) => (
              <DayEventCard key={idx} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DayEventCardProps {
  event: CalendarEvent;
}

function DayEventCard({ event }: DayEventCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {event.type === 'movie' ? <DayMovieCard event={event} /> : <DayShowCard event={event} />}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription asChild>
            <ExpandableText value={event.overview} />
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="no-scrollbar -mx-4 max-h-[40vh] space-y-2 overflow-y-auto px-4 py-px">
          {event.type === 'movie' ? (
            <MediaMovieDetail event={event} />
          ) : (
            event.episodes.map((ep, i) => <MediaShowEpisode key={i} episode={ep} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DayMovieCardProps {
  event: MovieItem;
}

function DayMovieCard({ event, ...props }: DayMovieCardProps) {
  const { t } = useTranslation(['common']);
  const borderColor = movieBorderColor(event);
  // const isFuture = dayjs(event.date).isAfter(dayjs());

  return (
    <Card
      className={clsx(
        'cursor-pointer rounded-none border-l-4 transition-opacity hover:opacity-80',
        borderColor
      )}
      {...props}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Icon */}
        <div className="text-muted-foreground shrink-0">
          <MediaMovieReleaseIcon release={event.release} />
        </div>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{event.title}</div>
          <div className="text-muted-foreground text-xs">{t(`common:media:${event.release}`)}</div>
        </div>

        {/* Status badge */}
        {/* <DayStatusBadge
          color={borderColor}
          label={
            event.release === 'cinema'
              ? 'In Cinemas'
              : isFuture
                ? 'Upcoming'
                : event.available
                  ? 'Available'
                  : 'Unavailable'
          }
        /> */}
      </div>
    </Card>
  );
}

interface DayShowCardProps {
  event: ShowItem;
}

function DayShowCard({ event, ...props }: DayShowCardProps) {
  const borderColor = showBorderColor(event);
  // const isFuture = dayjs(event.date).isAfter(dayjs());
  const episodeCount = event.episodes?.length ?? 0;

  return (
    <Card
      className={clsx(
        'cursor-pointer rounded-none border-l-4 transition-opacity hover:opacity-80',
        borderColor
      )}
      {...props}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Icon */}
        <div className="text-muted-foreground shrink-0">
          <TvIcon size={18} />
        </div>

        {/* Title + episode count */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{event.title}</div>
          {episodeCount > 0 && (
            <div className="text-muted-foreground text-xs">
              {episodeCount} episode{episodeCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Status badge */}
        {/* <DayStatusBadge
          color={borderColor}
          label={
            isFuture
              ? 'Upcoming'
              : event.available === 'available'
                ? 'Available'
                : event.available === 'partial'
                  ? 'Partial'
                  : 'Unavailable'
          }
        /> */}
      </div>
    </Card>
  );
}

// interface DayStatusBadgeProps {
//   color: string;
//   label: string;
// }

// function DayStatusBadge({ color, label }: DayStatusBadgeProps) {
//   const variantClass = clsx('text-xs font-normal', {
//     'bg-green-500/10 text-green-600 border-green-500': color === BORDER_COLORS.available,
//     'bg-red-500/10 text-red-600 border-red-500': color === BORDER_COLORS.unavailable,
//     'bg-orange-500/10 text-orange-600 border-orange-500': color === BORDER_COLORS.partial,
//     'bg-blue-500/10 text-blue-600 border-blue-500': color === BORDER_COLORS.future,
//     'bg-gray-500/10 text-gray-600 border-gray-500': color === BORDER_COLORS.untracked
//   });

//   return (
//     <Badge variant="outline" className={clsx('shrink-0', variantClass)}>
//       {label}
//     </Badge>
//   );
// }
