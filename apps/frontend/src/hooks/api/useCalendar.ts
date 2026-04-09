import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { getClientTimezone } from '@whendarr/shared';
import type dayjs from 'dayjs';

export function useCalendar(params?: { month?: dayjs.Dayjs }) {
  const tz = getClientTimezone();
  const month = params?.month?.format('YYYY-MM-DD');
  return useQuery({
    queryKey: ['calendar', month, tz],
    queryFn: () => api.calendar.get({ month, tz }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  });
}
