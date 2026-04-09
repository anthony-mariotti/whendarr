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

type Props = {
  selectedMonth: dayjs.Dayjs;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

function Toolbar({ selectedMonth, onPrevMonth, onNextMonth, onToday }: Props) {
  return (
    <div className="flex items-center space-x-2 p-2">
      <Select defaultValue="movies">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="movies">Movies</SelectItem>
            <SelectItem value="episodes">Series</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button variant={'outline'} size={'lg'} onClick={onToday}>
        Today
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
