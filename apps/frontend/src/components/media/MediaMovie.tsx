import { movieBorderColor } from '@/lib/calendar';
import type { MovieItem } from '@whendarr/shared';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { MediaMovieReleaseIcon } from './MediaMovieReleaseIcon';

interface MediaMovieProps {
  event: MovieItem;
}

export function MediaMovie({ event, ...props }: MediaMovieProps) {
  const { t } = useTranslation(['media']);
  const release = event.release;

  return (
    <div
      className={clsx(
        'bg-accent flex items-center space-x-1 border-l-4 p-1 text-sm',
        movieBorderColor(event)
      )}
      {...props}
    >
      <Tooltip>
        <TooltipTrigger>
          <MediaMovieReleaseIcon release={release} />
        </TooltipTrigger>
        <TooltipContent side="left">{t(`media:${release}`)}</TooltipContent>
      </Tooltip>
      <h3 className="cursor-pointer truncate">{event.title}</h3>
    </div>
  );
}
