import { NavLink, useLocation } from 'react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '../ui/sidebar';
import {
  BookTextIcon,
  CalendarIcon,
  ListIcon,
  MessageSquareIcon,
  SettingsIcon,
  type LucideIcon
} from 'lucide-react';
import { GitHubIcon } from '../icons/GitHubIcon';
import { Separator } from '../ui/separator';
import { useTranslation } from 'react-i18next';

export function DesktopSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation(['common']);
  const items: DesktopNavItem[] = [
    {
      name: t('common:navigation.upcoming'),
      icon: ListIcon,
      url: '/'
    },
    {
      name: t('common:navigation.calendar'),
      icon: CalendarIcon,
      url: '/calendar'
    },
    {
      name: t('common:navigation.preferences'),
      icon: SettingsIcon,
      url: '/preferences'
    }
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to={'/'}>
                <CalendarIcon className="size-5" />
                <span className="text-base font-semibold">Whendarr</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <DesktopNav items={items} />
      </SidebarContent>
      <SidebarFooter>
        <Separator />
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="https://github.com/anthony-mariotti/whendarr"
                target="_blank"
                rel="noreferrer"
              >
                <GitHubIcon className="size-5" />
                <span>{t('common:labels.github')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="https://discord.gg/your-invite" target="_blank" rel="noreferrer">
                <MessageSquareIcon size={20} />
                <span>Discord</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="https://docs.whendarr.com" target="_blank" rel="noreferrer">
                <BookTextIcon size={20} />
                <span>{t('common:labels.docs')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

interface DesktopNavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface DesktopNavProps {
  label?: string;
  items: DesktopNavItem[];
}

export function DesktopNav({ label, items }: DesktopNavProps) {
  const location = useLocation();
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu className="gap-1">
        {items.map((item, i) => (
          <SidebarMenuItem key={`${i}-${item.name}`}>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === item.url}
              tooltip={item.name}
            >
              <NavLink to={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
