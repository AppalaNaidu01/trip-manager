"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  query: string;
  setQuery: (q: string) => void;
};

const DashboardSearchContext = createContext<Ctx | null>(null);

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return (
    <DashboardSearchContext.Provider value={value}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

/** Safe outside provider (no-op setQuery). */
export function useDashboardSearch(): Ctx {
  const ctx = useContext(DashboardSearchContext);
  return (
    ctx ?? {
      query: "",
      setQuery: () => {},
    }
  );
}
