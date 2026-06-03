import { useRouteMeta } from '@/hooks/useRouteMeta';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { useSidebar } from '../ui/sidebar';
import { SidebarCloseIcon, SidebarOpenIcon } from 'lucide-react';

export function DesktopHeader() {
  const { title } = useRouteMeta();
  const { open, toggleSidebar } = useSidebar();
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center pr-3 lg:pr-4">
        <Button
          data-sidebar="trigger"
          data-slot="sidebar-trigger"
          variant="ghost"
          size="icon-lg"
          className="size-(--header-height) rounded-none"
          onClick={toggleSidebar}
        >
          {open && <SidebarCloseIcon />}
          {!open && <SidebarOpenIcon />}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Separator orientation="vertical" className="mr-3 lg:mr-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
