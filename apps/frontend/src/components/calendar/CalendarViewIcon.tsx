import type { CalendarViewMode } from '@/hooks/useCalendar';
import { AlignVerticalSpaceAroundIcon, CalendarIcon, Columns3Icon } from 'lucide-react';

interface CalendarViewIconProps {
  view: CalendarViewMode;
  size?: string | number;
}

function CalendarViewIcon({ view, size }: CalendarViewIconProps) {
  switch (view) {
    case 'month':
      return <CalendarIcon size={size} />;
    case 'week':
      return <Columns3Icon size={size} />;
    case 'day':
      return <AlignVerticalSpaceAroundIcon size={size} />;
    default:
      return <></>;
  }
}

export { CalendarViewIcon };
