import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { VesrionInfo } from '@whendarr/shared';

export function useVersionApi() {
  return useQuery<VesrionInfo>({
    queryKey: ['version'],
    queryFn: api.version.get,
    staleTime: 1000 * 60 * 60 * 6,
    refetchOnWindowFocus: true,
    retry: 3
  });
}
