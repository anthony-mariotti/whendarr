import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Outlet } from 'react-router';
import { AppHeader, AppHeaderProvider } from '../mobile/AppHeader';
import { AppBar } from '../mobile/AppBar';
import { CalendarIcon, ListIcon, SettingsIcon } from 'lucide-react';
import { SidebarInset } from '../ui/sidebar';
import { DesktopSidebar } from '../desktop/DesktopSidebar';
import { DesktopHeader } from '../desktop/DesktopHeader';
import { DesktopSidebarProvider } from '../desktop/DesktopSidebarProvider';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { useState } from 'react';
// import { ScrollAreaContext } from './ScrollAreaContext';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { t } from 'i18next';

function Layout() {
  const { desktop } = useMediaQuery();
  return (
    <>
      {desktop ? <DesktopLayout /> : <MobileLayout />}
      <ReactQueryDevtools buttonPosition={desktop ? 'bottom-right' : 'top-right'} />
    </>
  );
}

function MobileLayout() {
  // const [viewportRef, setViewportRef] = useState<HTMLDivElement | null>(null);

  return (
    <AppHeaderProvider>
      <div className="grid h-full grid-cols-1 grid-rows-[min-content_1fr_min-content]">
        <AppHeader />
        <main className="flex overflow-hidden">
          <Outlet />
        </main>
        <AppBar>
          <AppBar.Button text={t('common:navigation.upcoming')} icon={ListIcon} to={'/'} />
          <AppBar.Button
            text={t('common:navigation.calendar')}
            icon={CalendarIcon}
            to={'/calendar'}
          />
          <AppBar.Button
            text={t('common:navigation.preferences')}
            icon={SettingsIcon}
            to={'/preferences'}
          />
        </AppBar>
      </div>
    </AppHeaderProvider>
  );
}

function DesktopLayout() {
  return (
    <DesktopSidebarProvider className="max-h-svh">
      <DesktopSidebar />
      <SidebarInset>
        <DesktopHeader />
        <div className="flex flex-1 overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </DesktopSidebarProvider>
  );
}

export { Layout };
