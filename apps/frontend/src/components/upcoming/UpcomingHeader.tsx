import { useTranslation } from 'react-i18next';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import type { UpcomingFilter } from './UpcomingContext';
import { useRouteMeta } from '@/hooks/useRouteMeta';

interface UpcomingHeaderProps {
  filter: UpcomingFilter;
  setFilter: (filter: UpcomingFilter) => void;
  showCount: number;
  movieCount: number;
}

export function UpcomingHeader({ filter, setFilter, showCount, movieCount }: UpcomingHeaderProps) {
  const { t } = useTranslation(['common', 'media']);
  const { title } = useRouteMeta();
  return (
    <div className="flex min-w-0 gap-1 px-3">
      <div className="flex min-w-0 flex-1 items-center">
        <h1 className="truncate text-xl font-semibold">{title}</h1>
      </div>
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && setFilter(v as UpcomingFilter)}
      >
        <ToggleGroupItem value="all" variant={'outline'} size={'lg'}>
          {t('common:actions.all')}
        </ToggleGroupItem>
        <ToggleGroupItem value="movie" variant={'outline'} size={'lg'} className="leading-snug">
          {t('media:movie_one')} <span className="text-muted-foreground text-xs">{movieCount}</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="show" variant={'outline'} size={'lg'} className="leading-snug">
          {t('media:show_one')} <span className="text-muted-foreground text-xs">{showCount}</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
