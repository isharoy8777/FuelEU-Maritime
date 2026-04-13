import { createContext, useContext, useState, ReactNode } from 'react';

interface BaselineContextType {
  baselineRouteId: string | null;
  setBaselineRouteId: (id: string | null) => void;
}

const BaselineContext = createContext<BaselineContextType | undefined>(undefined);

export function BaselineProvider({ children }: { children: ReactNode }) {
  // Using RTR-002 as the default mock baseline
  const [baselineRouteId, setBaselineRouteId] = useState<string | null>('RTR-002');

  return (
    <BaselineContext.Provider value={{ baselineRouteId, setBaselineRouteId }}>
      {children}
    </BaselineContext.Provider>
  );
}

export function useBaseline() {
  const context = useContext(BaselineContext);
  if (context === undefined) {
    throw new Error('useBaseline must be used within a BaselineProvider');
  }
  return context;
}
