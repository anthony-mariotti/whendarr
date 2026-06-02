import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Outlet } from 'react-router';
import { AppHeader, AppHeaderProvider } from '../mobile/AppHeader';
import { AppBar } from '../mobile/AppBar';
import { CalendarIcon, ListIcon, SettingsIcon } from 'lucide-react';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { useState } from 'react';
// import { ScrollAreaContext } from './ScrollAreaContext';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function Layout() {
  const { desktop } = useMediaQuery();
  return desktop ? <DesktopLayout /> : <MobileLayout />;
}

function MobileLayout() {
  // const [viewportRef, setViewportRef] = useState<HTMLDivElement | null>(null);

  return (
    <AppHeaderProvider>
      {/* <ScrollAreaContext.Provider value={viewportRef}> */}
      <div className="grid h-full grid-cols-1 grid-rows-[min-content_1fr_min-content]">
        <AppHeader />
        <main className="flex overflow-hidden">
          {/* <ScrollArea className="flex-1" viewportRef={setViewportRef}> */}
          <Outlet />
          {/* </ScrollArea> */}
        </main>
        <AppBar>
          <AppBar.Button text={'Upcoming'} icon={<ListIcon />} to={'/'} />
          <AppBar.Button text={'Calendar'} icon={<CalendarIcon />} to={'/calendar'} />
          <AppBar.Button text={'Settings'} icon={<SettingsIcon />} to={'/settings'} />
        </AppBar>
      </div>
      {/* <ReactQueryDevtools buttonPosition="top-right" /> */}
      {/* </ScrollAreaContext.Provider> */}
    </AppHeaderProvider>
  );
}

function DesktopLayout() {
  return (
    <main>
      <Outlet />
    </main>
  );
}

export { Layout };
