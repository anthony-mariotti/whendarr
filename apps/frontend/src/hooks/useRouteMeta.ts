import { useLocation } from 'react-router';

export interface RouteMeta {
  title: string;
}

const routeMeta: Record<string, RouteMeta> = {
  '/': { title: 'Upcoming' },
  '/calendar': { title: 'Calendar' },
  '/settings': { title: 'Settings' }
};

const fallback: RouteMeta = { title: 'Whendarr' };

export function useRouteMeta(): RouteMeta {
  const { pathname } = useLocation();
  return routeMeta[pathname] ?? fallback;
}
