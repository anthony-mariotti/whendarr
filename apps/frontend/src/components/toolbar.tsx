import { BookOpenIcon, ChevronLeft, ChevronRight, FunnelIcon, InfoIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { ModeToggle } from './mode-toggle';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { ButtonGroup } from './ui/button-group';
import { useCalendarApi } from '@/hooks/api/useCalendarApi';
import { Spinner } from './ui/spinner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { useVersionApi } from '@/hooks/api/useVesrionApi';
import { Separator } from './ui/separator';
import { CALENDAR_VIEWS, useCalendar, type CalendarViewMode } from '@/hooks/useCalendar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { CalendarViewIcon } from './calendar/CalendarViewIcon';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GitHubIcon } from './icons/GitHubIcon';
import { cn } from '@/lib/utils';

function Toolbar() {
  const { t } = useTranslation(['common']);
  const { month, view, filter, nextPeriod, prevPeriod, today, setFilter, setView } = useCalendar();
  const { isLoading, isFetching } = useCalendarApi();
  const { data } = useVersionApi();
  const { desktop } = useMediaQuery();

  const LEGEND_ITEMS = [
    { colorClass: 'bg-green-500', label: t('common:legend.available') },
    { colorClass: 'bg-blue-500', label: t('common:legend.future') },
    { colorClass: 'bg-red-500', label: t('common:legend.missing') },
    { colorClass: 'bg-gray-500', label: t('common:legend.untracked') }
  ] as const;

  return (
    <div className="bg-background fixed bottom-0 z-10 flex min-h-16 w-full items-center space-x-2 border-t-2 px-4 py-2 sm:relative sm:bottom-auto sm:border-t-0">
      <Select
        value={view}
        defaultValue={view}
        onValueChange={(view: CalendarViewMode) => setView(view)}
      >
        {/* @ts-expect-error shadcn doesn't provide lg, but works as intended :) */}
        <SelectTrigger size="lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {CALENDAR_VIEWS.map((view) => {
              return (
                <SelectItem key={view} value={view}>
                  <CalendarViewIcon view={view} size={16} />
                  {t(`common:time.${view}`)}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={'outline'} size={'icon-lg'}>
            <FunnelIcon />
            <span className="sr-only">{t('common:actions.filterCalendar')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Media</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filter.movies}
              onCheckedChange={(value) => setFilter({ movies: value })}
            >
              {t('common:media.movie_plural')}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filter.shows}
              onCheckedChange={(value) => setFilter({ shows: value })}
            >
              {t('common:media.tv_show_plural')}
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant={'outline'} onClick={today} size={'lg'} className="hidden sm:flex">
        {t('common:time.today')}
      </Button>
      <ButtonGroup>
        <Button variant={'outline'} size={'icon-lg'} onClick={prevPeriod}>
          <ChevronLeft />
          <span className="sr-only">{t('common:actions.previousMonth')}</span>
        </Button>
        <Button variant={'outline'} size={'icon-lg'} onClick={nextPeriod}>
          <ChevronRight />
          <span className="sr-only">{t('common:actions.nextMonth')}</span>
        </Button>
      </ButtonGroup>
      <div className="hidden items-center space-x-2 sm:flex">
        <h1 className="text-xl font-bold">
          {desktop && month.format('MMMM YYYY')}
          {!desktop && month.format('MMM YYYY')}
        </h1>
        {isLoading || (isFetching && <Spinner className="size-6" />)}
      </div>
      <div className="flex-1" />
      <ModeToggle />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={'ghost'} size={'icon-lg'}>
            <InfoIcon />
            <span className="sr-only">{t('common:actions.openInformation')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">{t('common:labels.whendarr')}</DialogTitle>
            <DialogDescription className="">{t('common:descriptions.whendarr')}</DialogDescription>
          </DialogHeader>

          <Separator />
          <div>
            <h3 className="text-muted-foreground mb-2.5 font-medium tracking-widest uppercase">
              {t('common:labels.legend')}
            </h3>
            <div className="flex flex-col gap-1.5">
              {LEGEND_ITEMS.map(({ colorClass, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="flex shrink-0 gap-1">
                    <div className={cn('h-5 w-7 rounded', colorClass)} />
                  </div>
                  <p className="text-muted-foreground text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-muted-foreground font-medium uppercase">
                {t('common:labels.version')}
              </h3>
              <p className="text-muted-foreground *:[a]:hover:text-foreground font-mono text-sm *:[a]:underline *:[a]:underline-offset-3">
                {data?.current.version}{' '}
                {data?.current.commit &&
                  `(${data.current.commit.length > 6 ? data.current.commit.slice(0, 7) : data.current.commit})`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant={'outline'} size={'sm'} asChild>
                <a
                  href="https://github.com/anthony-mariotti/whendarr"
                  target="_blank"
                  rel="noreferrer"
                  className="space-x-1"
                >
                  <GitHubIcon />
                  <span>{t('common:labels.github')}</span>
                </a>
              </Button>
              <Button variant={'outline'} size={'sm'} asChild>
                <a href="https://docs.whendarr.com" target="_blank" rel="noreferrer">
                  <BookOpenIcon />
                  <span>{t('common:labels.docs')}</span>
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="relative" />
    </div>
  );
}

export { Toolbar };
