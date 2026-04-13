import { createContext, useContext, useState, ReactNode } from 'react';
import type { BankEntry, Pool } from '../../shared/types';
import { mockBankHistory, mockPools } from '../../api/mock';

interface AppContextType {
  bankedCredits: number;
  setBankedCredits: (val: number | ((prev: number) => number)) => void;
  bankHistory: BankEntry[];
  addBankHistory: (entry: BankEntry) => void;
  pools: Pool[];
  addPool: (pool: Pool) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [bankedCredits, setBankedCredits] = useState<number>(180000); // initial mock available
  const [bankHistory, setBankHistory] = useState<BankEntry[]>(mockBankHistory);
  const [pools, setPools] = useState<Pool[]>(mockPools);

  const addBankHistory = (entry: BankEntry) => setBankHistory(prev => [entry, ...prev]);
  const addPool = (pool: Pool) => setPools(prev => [pool, ...prev]);

  return (
    <AppContext.Provider value={{
      bankedCredits, setBankedCredits,
      bankHistory, addBankHistory,
      pools, addPool
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
