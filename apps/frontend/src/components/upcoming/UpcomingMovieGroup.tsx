import { FilmIcon } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { t } from 'i18next';
import type { MovieItem } from '@whendarr/shared';
import { movieBackgroundColor } from '@/lib/calendar';
import clsx from 'clsx';

export function UpcomingMovieGroup({ item }: { item: MovieItem }) {
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
