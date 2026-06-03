import { useEffect, useState } from 'react';

export function useMediaQuery() {
  const [desktop, setDesktop] = useState<boolean>(window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');

    function changed(e: MediaQueryListEvent) {
      setDesktop(e.matches);
    }

    media.addEventListener('change', changed);

    return () => {
      media.removeEventListener('change', changed);
    };
  });

  return {
    desktop
  };
}
