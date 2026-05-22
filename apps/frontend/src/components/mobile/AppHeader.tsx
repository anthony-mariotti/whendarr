import { useRouteMeta } from '@/hooks/useRouteMeta';
import clsx from 'clsx';
import { createContext, useContext, useEffect, useState } from 'react';

function AppHeader() {
  const { title } = useRouteMeta();
  const { content } = useAppHeader();

  return (
    <header
      className={clsx('border-border grid gap-y-1 border-b px-3.5 pt-2.5 pb-2.5', {
        'grid-rows-2': content
      })}
    >
      <div className="col-span-2 flex">
        <h1 className="text-foreground text-2xl font-medium tracking-[0.08em]">{title}</h1>
      </div>
      {content && content}
    </header>
  );
}

interface AppHeaderState {
  content: React.ReactNode;
  setContent: (content: React.ReactNode) => void;
}

const initState: AppHeaderState = {
  content: undefined,
  setContent: () => null
};

const AppHeaderContext = createContext<AppHeaderState>(initState);

interface AppHeaderProviderProps {
  children: React.ReactNode;
}

function AppHeaderProvider({ children, ...props }: AppHeaderProviderProps) {
  const [content, setContent] = useState<React.ReactNode>(initState.content);

  const value: AppHeaderState = {
    content,
    setContent
  };

  return (
    <AppHeaderContext.Provider {...props} value={value}>
      {children}
    </AppHeaderContext.Provider>
  );
}

function useAppHeader(): AppHeaderState {
  const context = useContext(AppHeaderContext);
  if (!context) throw new Error('useAppHeader must be used within a <AppHeaderProvider>');
  return context;
}

function useAppHeaderContent(content: React.ReactNode) {
  const { setContent } = useAppHeader();
  useEffect(() => {
    setContent(content);
    return () => setContent(undefined);
  }, [content, setContent]);
}

export { AppHeader, AppHeaderProvider, useAppHeader, useAppHeaderContent };
