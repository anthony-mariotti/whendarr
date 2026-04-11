import { useCalendar } from '@/components/calendar/calendar';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { getClientTimezone } from '@whendarr/shared';

export function useCalendarApi() {
  const { month } = useCalendar();
  const tz = getClientTimezone();

  return useQuery({
    queryKey: ['calendar', month.format('YYYY-MM-DD'), tz],
    queryFn: () => api.calendar.get({ month: month.format('YYYY-MM-DD'), tz }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  });
}
