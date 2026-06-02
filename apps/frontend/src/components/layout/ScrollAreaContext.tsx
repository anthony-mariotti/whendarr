import { createContext, useContext } from 'react';

export const ScrollAreaContext = createContext<HTMLDivElement | null>(null);
export function useScrollAreaContext() {
  return useContext(ScrollAreaContext);
}
