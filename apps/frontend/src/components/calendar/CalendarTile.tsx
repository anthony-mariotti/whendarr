import type { CalendarEvent } from '@whendarr/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { MediaMovie } from '../media/MediaMovie';
import { MediaShow } from '../media/MediaShow';
import { Separator } from '../ui/separator';
import { ExpandableText } from '../expandableText';
import { MediaShowEpisode } from '../media/MediaShowEpisode';
import { MediaMovieDetail } from '../media/MediaMovieDetail';

interface CalendarTileProps {
  event: CalendarEvent;
}

function CalendarTile({ event }: CalendarTileProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {event.type === 'movie' ? <MediaMovie event={event} /> : <MediaShow event={event} />}
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

export { CalendarTile };
