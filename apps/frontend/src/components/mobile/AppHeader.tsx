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
    <header className={clsx('border-border grid min-h-16 gap-y-1 border-b pt-2 pb-2')}>
      <span className="sr-only">{title}</span>
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
