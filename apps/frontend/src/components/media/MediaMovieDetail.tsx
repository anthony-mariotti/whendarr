import type { MovieItem } from '@whendarr/shared';

interface MediaMovieDetailProps {
  event: MovieItem;
}

export function MediaMovieDetail({ event }: MediaMovieDetailProps) {
  return <div>{event.certification}</div>;
}
