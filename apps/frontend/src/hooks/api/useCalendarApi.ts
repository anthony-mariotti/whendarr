import { api } from '@/lib/api';
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { getClientTimezone } from '@whendarr/shared';
import { useEffect } from 'react';
import { useCalendar } from '../useCalendar';
import dayjs from 'dayjs';

function calendarQueryOptions(month: string, tz: string) {
  return {
    queryKey: ['calendar', month, tz],
    queryFn: () => api.calendar.get({ month: month, tz }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  };
}

export function useCalendarApi() {
  const { selected } = useCalendar();
  const tz = getClientTimezone();
  const queryClient = useQueryClient();

  const normalized = selected.startOf('month');

  useEffect(() => {
    const prev = normalized.subtract(1, 'month').format('YYYY-MM-DD');
    const next = normalized.add(1, 'month').format('YYYY-MM-DD');
    queryClient.prefetchQuery(calendarQueryOptions(prev, tz));
    queryClient.prefetchQuery(calendarQueryOptions(next, tz));
  }, [normalized, queryClient]);

  return useQuery({
    ...calendarQueryOptions(normalized.format('YYYY-MM-DD'), tz),
    placeholderData: keepPreviousData
  });
}

export function useCalendarFeedApi() {
  const tz = getClientTimezone();
  const initialPage = dayjs().format('YYYY-MM-DD');

  return useInfiniteQuery({
    queryKey: ['feed', tz],
    staleTime: 1000 * 60 * 30,
    initialPageParam: initialPage,
    queryFn: ({ pageParam }) => api.calendar.feed.get({ cursor: pageParam, tz }),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined
  });
}
