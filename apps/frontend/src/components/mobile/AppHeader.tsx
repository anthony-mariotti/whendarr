import { useRouteMeta } from '@/hooks/useRouteMeta';
import clsx from 'clsx';
import { createContext, useContext, useEffect, useState } from 'react';

const AppHeaderStateContext = createContext<React.ReactNode>(undefined);
const AppHeaderDispatchContext = createContext<(content: React.ReactNode) => void>(() => null);

function AppHeaderProvider({ children, ...props }: { children: React.ReactNode }) {
  const [content, setContent] = useState<React.ReactNode>(undefined);

  return (
    <AppHeaderDispatchContext.Provider value={setContent} {...props}>
      <AppHeaderStateContext.Provider value={content}>{children}</AppHeaderStateContext.Provider>
    </AppHeaderDispatchContext.Provider>
  );
}

function AppHeader() {
  const { title } = useRouteMeta();
  const content = useContext(AppHeaderStateContext);

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

function useAppHeaderContent(content: React.ReactNode) {
  const setContent = useContext(AppHeaderDispatchContext);

  useEffect(() => {
    setContent(content);
    return () => setContent(undefined);
  }, [content, setContent]);
}

export { AppHeader, AppHeaderProvider, useAppHeaderContent };
