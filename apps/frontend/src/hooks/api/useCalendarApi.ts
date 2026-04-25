import { useCalendar } from '@/components/calendar/calendar';
import { api } from '@/lib/api';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { getClientTimezone } from '@whendarr/shared';
import { useEffect } from 'react';

function calendarQueryOptions(month: string, tz: string) {
  return {
    queryKey: ['calendar', month, tz],
    queryFn: () => api.calendar.get({ month: month, tz }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  };
}

export function useCalendarApi() {
  const { month } = useCalendar();
  const tz = getClientTimezone();
  const queryClient = useQueryClient();

  const monthKey = month.format('YYYY-MM-DD');

  useEffect(() => {
    const prev = month.subtract(1, 'month').format('YYYY-MM-DD');
    const next = month.add(1, 'month').format('YYYY-MM-DD');
    queryClient.prefetchQuery(calendarQueryOptions(prev, tz));
    queryClient.prefetchQuery(calendarQueryOptions(next, tz));
  }, [monthKey, queryClient]);

  return useQuery({
    ...calendarQueryOptions(monthKey, tz),
    placeholderData: keepPreviousData
  });
}
