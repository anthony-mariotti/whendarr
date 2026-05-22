import { useAppHeaderContent } from '@/components/mobile/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import dayjs from 'dayjs';
import { FilmIcon, TvIcon } from 'lucide-react';

const data: TempFeedData = [
  {
    date: '2026-05-21',
    releases: [
      {
        type: 'show',
        title: 'The Last of Us',
        season: 2,
        status: 'partial',
        episodes: [
          {
            episode: 5,
            title: 'Cycle',
            status: 'available'
          },
          {
            episode: 6,
            title: 'The Price',
            status: 'missing'
          }
        ]
      },
      {
        type: 'movie',
        title: 'Mission Impossible: Dead Reckoning',
        release: 'Digital release',
        status: 'available'
      },
      {
        type: 'episode',
        title: 'Welcome to Kalani',
        season: 2,
        episode: 9,
        show: {
          title: 'Andor'
        },
        status: 'missing'
      }
    ]
  }
];

type TempFeedData = Array<{
  date: string;
  releases: Array<TempShowItem | TempEpisodeItem | TempMovieItem>;
}>;

type TempShowItem = {
  type: 'show';
  title: string;
  season: number;
  status: string;
  episodes: Array<TempShowEpisodeItem>;
};

type TempShowEpisodeItem = {
  episode: number;
  title: string;
  status: string;
};

type TempEpisodeItem = {
  type: 'episode';
  title: string;
  season: number;
  episode: number;
  show: {
    title: string;
  };
  status: string;
};

type TempMovieItem = {
  type: 'movie';
  title: string;
  release: string;
  status: string;
};

function Upcoming() {
  useAppHeaderContent(<UpcomingAppHeader />);

  return (
    <div className="flex flex-col gap-2 p-3">
      {data.map((d) => (
        <>
          <div>
            <span className="font-medium">
              {dayjs(d.date).format('ddd DD MMM').toLocaleUpperCase()}
            </span>
          </div>
          <div className="flex flex-col space-y-4">
            {d.releases.map((r, i) => {
              if (r.type === 'show') {
                return <TempShowGroup key={i} item={r} />;
              }

              if (r.type === 'episode') {
                return <TempEpisodeGroup key={i} item={r} />;
              }

              if (r.type === 'movie') {
                return <TempMovieGroup key={i} item={r} />;
              }

              return <></>;
            })}
          </div>
        </>
      ))}
    </div>
  );
}

function TempShowGroup({ item }: { item: TempShowItem }) {
  return (
    <Card className="p-0">
      <Collapsible className="" defaultOpen>
        <CollapsibleTrigger asChild>
          <div className="flex">
            <div className="bg-accent flex items-center justify-center p-4">
              <TvIcon />
            </div>
            <CardHeader className="grow rounded-none py-4">
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.season}</CardDescription>
            </CardHeader>
            <div className="flex items-center justify-center gap-1 p-4">
              <span className="text-purple-500">Partially Available</span>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t-2 px-0">
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-muted-foreground shrink-0">Episode 1</span>
              <span className="grow">Totally Normal</span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-green-500">Available</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-muted-foreground shrink-0">Episode 2</span>
              <span className="grow">Never Normal</span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-red-500">Missing</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function TempEpisodeGroup({ item }: { item: TempEpisodeItem }) {
  return (
    <Card className="p-0">
      <div className="flex">
        <div className="bg-accent flex items-center justify-center p-4">
          <TvIcon />
        </div>
        <CardHeader className="grow rounded-none py-4">
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>{item.season}</CardDescription>
        </CardHeader>
        <div className="flex items-center justify-center gap-1 p-4">
          <span className="text-blue-500">Upcoming</span>
        </div>
      </div>
    </Card>
  );
}

function TempMovieGroup({ item }: { item: TempMovieItem }) {
  return (
    <Card className="p-0">
      <div className="flex">
        <div className="bg-accent flex items-center justify-center p-4">
          <FilmIcon />
        </div>
        <CardHeader className="grow rounded-none py-4">
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>{item.release}</CardDescription>
        </CardHeader>
        <div className="flex items-center justify-center gap-1 p-4">
          <span className="text-green-500">Available</span>
        </div>
      </div>
    </Card>
  );
}

function UpcomingAppHeader() {
  return (
    <div className="flex gap-1">
      <ToggleGroup type="single" defaultValue="all">
        <ToggleGroupItem value="all" variant={'outline'} size={'lg'}>
          All
        </ToggleGroupItem>
        <ToggleGroupItem value="tv" variant={'outline'} size={'lg'}>
          TV <span className="text-muted-foreground text-xs">0</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="movie" variant={'outline'} size={'lg'}>
          Movie <span className="text-muted-foreground text-xs">0</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export { Upcoming };
