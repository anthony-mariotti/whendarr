import { ChevronLeft, ChevronRight, FunnelIcon, InfoIcon } from 'lucide-react';
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
import { useCalendar } from './calendar/calendar';
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

function Toolbar() {
  const { t } = useTranslation(['common']);
  const { month, filter, nextMonth, prevMonth, today, setFilter } = useCalendar();
  const { isLoading } = useCalendarApi();
  const { data } = useVersionApi();
  const { desktop } = useMediaQuery();

  return (
    <div className="bg-background fixed bottom-0 z-10 flex min-h-16 w-full items-center space-x-2 border-t-2 px-4 py-2 sm:relative sm:bottom-auto sm:border-t-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={'outline'} size={desktop ? 'icon-lg' : 'icon'}>
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
              checked={filter.show}
              onCheckedChange={(value) => setFilter({ show: value })}
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
        <Button variant={'outline'} size={desktop ? 'icon-lg' : 'icon'} onClick={prevMonth}>
          <ChevronLeft />
          <span className="sr-only">{t('common:actions.previousMonth')}</span>
        </Button>
        <Button variant={'outline'} size={desktop ? 'icon-lg' : 'icon'} onClick={nextMonth}>
          <ChevronRight />
          <span className="sr-only">{t('common:actions.nextMonth')}</span>
        </Button>
      </ButtonGroup>
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold">
          {desktop && month.format('MMMM YYYY')}
          {!desktop && month.format('MMM YYYY')}
        </h1>
        {isLoading && <Spinner className="size-6" />}
      </div>
      <div className="flex-1" />
      <ModeToggle />
      <Button variant={'ghost'} className="hidden sm:flex" asChild>
        <a href="https://github.com/anthony-mariotti/whendarr" target="_blank" rel="noreferrer">
          <svg
            width="98"
            height="96"
            viewBox="0 0 98 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z"
                fill="currentcolor"
              />
            </g>
          </svg>
          <span className="sr-only">{t('common:actions.viewOnGitHub')}</span>
        </a>
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant={'ghost'} size={desktop ? 'icon-lg' : 'icon'}>
            <InfoIcon />
            <span className="sr-only">{t('common:actions.openInformation')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common:labels.whendarr')}</DialogTitle>
            <DialogDescription>{t('common:descriptions.whendarr')}</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex">
            <div className="grow">
              <h3>{t('common:labels.version')}</h3>
              <p className="text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3">
                {data?.current.version} {data?.current.commit && `(${data.current.commit})`}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { Toolbar };
