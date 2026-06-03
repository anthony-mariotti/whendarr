import { createContext, useContext, useEffect, useState } from 'react';
import { SidebarProvider } from '../ui/sidebar';

const DesktopHeaderStateContext = createContext<React.ReactNode>(undefined);
const DesktopHeaderDispatchContext = createContext<(content: React.ReactNode) => void>(() => null);

function DesktopSidebarProvider({
  children,
  ...props
}: React.ComponentProps<typeof SidebarProvider>) {
  const [content, setContent] = useState<React.ReactNode>(undefined);

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 54)',
          '--header-height': 'calc(var(--spacing) * 14)'
        } as React.CSSProperties
      }
      {...props}
    >
      <DesktopHeaderDispatchContext.Provider value={setContent}>
        <DesktopHeaderStateContext.Provider value={content}>
          {children}
        </DesktopHeaderStateContext.Provider>
      </DesktopHeaderDispatchContext.Provider>
    </SidebarProvider>
  );
}

function useDesktopHeaderContext(content: React.ReactNode) {
  const setContent = useContext(DesktopHeaderDispatchContext);

  useEffect(() => {
    setContent(content);
    return () => setContent(undefined);
  }, [content, setContent]);
}

export { DesktopSidebarProvider, useDesktopHeaderContext };
