import type { ShowItem } from '@whendarr/shared';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { TvIcon } from 'lucide-react';
import { showBorderColor } from '@/lib/calendar';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface MediaShowProps {
  event: ShowItem;
}

export function MediaShow({ event, ...props }: MediaShowProps) {
  const { t } = useTranslation(['common']);

  return (
    <div
      className={clsx(
        'bg-accent flex items-center space-x-1 border-l-4 p-1 text-sm',
        showBorderColor(event)
      )}
      {...props}
    >
      <Tooltip>
        <TooltipTrigger>
          <TvIcon size={16} />
        </TooltipTrigger>
        <TooltipContent side="left">{t(`common:media:tv_show`)}</TooltipContent>
      </Tooltip>
      <h3 className="cursor-pointer truncate">{event.title}</h3>
    </div>
  );
}
