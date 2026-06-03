import clsx from 'clsx';
import { type LucideIcon } from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router';

interface AppBarButtonProps {
  text: string;
  icon: LucideIcon;
  to: string;
}

interface AppBarProps {
  children: React.ReactNode;
}

interface AppBarComposition extends React.FC<AppBarProps> {
  Button: React.FC<AppBarButtonProps>;
}

const AppBarButton: React.FC<AppBarButtonProps> = ({ text, icon: Icon, to }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'text-muted-foreground relative flex flex-1 flex-col items-center justify-center gap-1',
          isActive ? 'text-primary' : ''
        )
      }
      aria-label={text}
    >
      <span className="" aria-hidden="true">
        <Icon />
      </span>
      <span className="">{text}</span>
    </NavLink>
  );
};

const AppBar: AppBarComposition = ({ children }: AppBarProps) => {
  return (
    <nav
      id="mobile-navigation"
      aria-label="Main navigation"
      className="border-border flex h-16 items-stretch border-t px-1"
    >
      {children}
    </nav>
  );
};

AppBar.Button = AppBarButton;

export { AppBar };
