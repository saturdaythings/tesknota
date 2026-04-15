"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";
import { loadAllData } from "@/lib/data";
import { FRAGRANCES, COMPLIMENTS, COMMUNITY_FRAGS } from "@/lib/state";

interface DataContextValue {
  fragrances: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  isLoaded: boolean;
  loadError: boolean;
  reload: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [fragrances, setFrags] = useState<UserFragrance[]>([]);
  const [compliments, setComps] = useState<UserCompliment[]>([]);
  const [communityFrags, setCF] = useState<CommunityFrag[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setIsLoaded(false);
    setLoadError(false);
    const ok = await loadAllData();
    // loadAllData writes to the mutable state module arrays;
    // capture them here to trigger React renders
    setFrags([...FRAGRANCES]);
    setComps([...COMPLIMENTS]);
    setCF([...COMMUNITY_FRAGS]);
    setIsLoaded(true);
    if (!ok) setLoadError(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <DataContext.Provider
      value={{ fragrances, compliments, communityFrags, isLoaded, loadError, reload: load }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
