import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useCalendar() {
  return useQuery({
    queryKey: [],
    queryFn: () => api.calendar.get(),
    staleTime: 1000 * 60 * 30 // 30 minutes
  });
}
