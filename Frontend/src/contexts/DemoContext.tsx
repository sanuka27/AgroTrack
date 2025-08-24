import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemoActive: boolean;
  setDemoActive: (active: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoActive, setIsDemoActive] = useState(false);

  const setDemoActive = (active: boolean) => {
    setIsDemoActive(active);
  };

  return (
    <DemoContext.Provider value={{ isDemoActive, setDemoActive }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
