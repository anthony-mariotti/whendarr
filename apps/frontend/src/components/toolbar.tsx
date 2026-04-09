import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import dayjs from 'dayjs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { useTranslation } from 'react-i18next';

type Props = {
  selectedMonth: dayjs.Dayjs;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

function Toolbar({ selectedMonth, onPrevMonth, onNextMonth, onToday }: Props) {
  const { t } = useTranslation(['common']);

  return (
    <div className="flex items-center space-x-2 p-2">
      <Select defaultValue="movies">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="movies">{t('common:media.movie_plural')}</SelectItem>
            <SelectItem value="episodes">{t('common:media.tv_show_plural')}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button variant={'outline'} size={'lg'} onClick={onToday}>
        {t('common:time.today')}
      </Button>
      <div>
        <Button variant={'ghost'} size={'icon-lg'} onClick={onPrevMonth}>
          <ChevronLeft />
        </Button>
        <Button variant={'ghost'} size={'icon-lg'} onClick={onNextMonth}>
          <ChevronRight />
        </Button>
      </div>
      <div>
        <h1 className="text-xl font-bold">{selectedMonth.format('MMMM YYYY')}</h1>
      </div>
    </div>
  );
}

export { Toolbar };
