"use client";

import React from "react";

interface DemoContextType {
  currentSearch: string;
  isSearching: boolean;
  setCurrentSearch: (search: string) => void;
  setIsSearching: (searching: boolean) => void;
  activeDemo: string | null;
  setActiveDemo: (demo: string | null) => void;
}

const DemoContext = React.createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [currentSearch, setCurrentSearch] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [activeDemo, setActiveDemo] = React.useState<string | null>(null);

  return (
    <DemoContext.Provider
      value={{
        currentSearch,
        isSearching,
        setCurrentSearch,
        setIsSearching,
        activeDemo,
        setActiveDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = React.useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}