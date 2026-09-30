import { createContext, useContext, type ReactNode } from 'react';

const Motion = createContext(false);
export function WorkshopMotion({ value, children }: { value: boolean; children: ReactNode }) {
  return <Motion.Provider value={value}>{children}</Motion.Provider>;
}
export function useWorkshopMotion() { return useContext(Motion); }
