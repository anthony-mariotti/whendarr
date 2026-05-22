import dayjs from 'dayjs';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Film, Tv2 } from 'lucide-react';

const TODAY = dayjs().format('YYYY-MM-DD');

const DOT_CLASS = {
  available: 'bg-green-600 dark:bg-green-500',
  downloading: 'bg-amber-500',
  missing: 'bg-border',
  none: 'bg-transparent'
};

const PILL_CLASS = {
  available: 'bg-green-50   text-green-800   dark:bg-green-950  dark:text-green-300',
  downloading: 'bg-amber-50   text-amber-800   dark:bg-amber-950  dark:text-amber-300',
  missing: 'bg-muted      text-muted-foreground border border-border'
};

const TYPE_WELL = {
  show: 'bg-blue-50  dark:bg-blue-950',
  movie: 'bg-muted'
};

const TYPE_ICON_CLASS = {
  show: 'text-blue-600 dark:text-blue-400',
  movie: 'text-muted-foreground'
};

type Release = {
  date: string;
  items: {
    type: 'show' | 'movie';
  }[];
};

function UpcomingFeed({ releases }: { releases: Release[] }) {
  return (
    <ScrollArea className="flex-1">
      <div className="pb-2">
        {releases.map((r) => (
          <DaySection key={r.date} release={r} />
        ))}
      </div>
    </ScrollArea>
  );
}

function DaySection({ release }: { release: Release }) {
  const isToday = release.date === TODAY;
  return (
    <section>
      <SectionLabel date={release.date} isToday={isToday} />
      {release.items.map((item, i) =>
        item.type === 'show' ? <ShowCard key={i} item={item} /> : <MovieCard key={i} item={item} />
      )}
    </section>
  );
}

function SectionLabel({ date, isToday }: { date: string; isToday: boolean }) {
  const d = dayjs(date);
  const label = isToday
    ? `today · ${d.format('ddd MMM D').toUpperCase()}`
    : d.format('ddd MMM D').toUpperCase();

  return (
    <p
      className={cn(
        'px-3.5 pt-3 pb-1.5 text-[9px] font-medium tracking-[0.08em]',
        isToday ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      {label}
    </p>
  );
}

function MovieCard({ item }: { item: { title: string; subtitle: string; status: string } }) {
  return (
    <div className="border-border bg-card mx-2.5 mb-2 overflow-hidden rounded-xl border">
      <CardHeader type="movie" title={item.title} subtitle={item.subtitle} status={item.status} />
    </div>
  );
}

function ShowCard({
  item
}: {
  item: { title: string; subtitle: string; status: string; episodes: { code: string }[] };
}) {
  return (
    <div className="border-border bg-card mx-2.5 mb-2 overflow-hidden rounded-xl border">
      <CardHeader type="show" title={item.title} subtitle={item.subtitle} status={item.status} />
      {item.episodes?.length > 0 && (
        <div>
          {item.episodes.map((ep) => (
            <EpisodeRow key={ep.code} episode={ep} />
          ))}
        </div>
      )}
    </div>
  );
}

function CardHeader({ type, title, subtitle, status }) {
  const Icon = type === 'show' ? Tv2 : Film;
  return (
    <div className="flex items-center gap-2.5 p-2.5">
      <div
        className={cn(
          'flex size-[30px] shrink-0 items-center justify-center rounded-md',
          TYPE_WELL[type]
        )}
      >
        <Icon size={15} strokeWidth={1.75} className={TYPE_ICON_CLASS[type]} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-xs font-medium">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-[10px]">{subtitle}</p>
      </div>
      <StatusPill status={status} />
    </div>
  );
}

function EpisodeRow({ episode }) {
  return (
    <div className="border-border/50 flex items-center gap-2 border-t py-1.5 pr-3 pl-[46px]">
      <span className="text-muted-foreground w-10 shrink-0 font-mono text-[10px] tabular-nums">
        {episode.code}
      </span>
      <span className="text-foreground min-w-0 flex-1 truncate text-[10px]">{episode.title}</span>
      <StatusDot status={episode.status} className="size-1.5" />
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium',
        PILL_CLASS[status] ?? PILL_CLASS.missing
      )}
    >
      {status}
    </span>
  );
}

function StatusDot({ status, className }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full',
        DOT_CLASS[status] ?? DOT_CLASS.none,
        className
      )}
    />
  );
}

export { UpcomingFeed };
