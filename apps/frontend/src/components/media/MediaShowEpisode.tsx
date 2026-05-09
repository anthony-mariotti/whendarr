import type { EpisodeItem } from '@whendarr/shared';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
import dayjs from 'dayjs';

interface MediaShowEpisodeProps {
  episode: EpisodeItem;
}

export function MediaShowEpisode({ episode }: MediaShowEpisodeProps) {
  return (
    <Card>
      <div className="flex">
        <CardHeader className="grow">
          <CardTitle>{episode.title}</CardTitle>
          <CardDescription>
            S{String(episode.season).padStart(2, '0')} E{String(episode.number).padStart(2, '0')}
          </CardDescription>
        </CardHeader>
        {episode.date && (
          <div className="flex items-center justify-center px-4">
            <div>{dayjs(episode.date).format('hh:mm A')}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
