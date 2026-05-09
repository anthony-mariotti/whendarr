import type { ReleaseType } from '@whendarr/shared';
import { Disc3Icon, FilmIcon, LaptopIcon } from 'lucide-react';

interface MediaMovieReleaseIconProps {
  release: ReleaseType;
}

export function MediaMovieReleaseIcon({ release }: MediaMovieReleaseIconProps) {
  switch (release) {
    case 'cinema':
      return <FilmIcon size={16} />;
    case 'digital':
      return <LaptopIcon size={16} />;
    case 'physical':
      return <Disc3Icon size={16} />;
    default:
      return <></>;
  }
}
