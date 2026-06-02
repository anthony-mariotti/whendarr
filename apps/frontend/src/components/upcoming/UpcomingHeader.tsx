import { t } from 'i18next';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import type { UpcomingFilter } from './UpcomingContext';

interface UpcomingHeaderProps {
  filter: UpcomingFilter;
  setFilter: (filter: UpcomingFilter) => void;
  showCount: number;
  movieCount: number;
}

export function UpcomingHeader({ filter, setFilter, showCount, movieCount }: UpcomingHeaderProps) {
  return (
    <div className="flex gap-1 px-3">
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && setFilter(v as UpcomingFilter)}
      >
        <ToggleGroupItem value="all" variant={'outline'} size={'lg'}>
          {t('common:actions.all')}
        </ToggleGroupItem>
        <ToggleGroupItem value="movie" variant={'outline'} size={'lg'} className="leading-snug">
          {t('common:media.movie')}{' '}
          <span className="text-muted-foreground text-xs">{movieCount}</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="show" variant={'outline'} size={'lg'} className="leading-snug">
          {t('common:media.show')}{' '}
          <span className="text-muted-foreground text-xs">{showCount}</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
