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
import {
  appendFrag,
  updateFrag,
  appendComp,
  updateComp,
} from "@/lib/data/mutations";

interface DataContextValue {
  fragrances: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  isLoaded: boolean;
  loadError: boolean;
  reload: () => void;
  addFrag: (frag: UserFragrance) => Promise<void>;
  editFrag: (frag: UserFragrance) => Promise<void>;
  addComp: (comp: UserCompliment) => Promise<void>;
  editComp: (comp: UserCompliment) => Promise<void>;
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

  const addFragCb = useCallback(async (frag: UserFragrance) => {
    await appendFrag(frag);
    setFrags([...FRAGRANCES]);
  }, []);

  const editFragCb = useCallback(async (frag: UserFragrance) => {
    await updateFrag(frag);
    setFrags([...FRAGRANCES]);
  }, []);

  const addCompCb = useCallback(async (comp: UserCompliment) => {
    await appendComp(comp);
    setComps([...COMPLIMENTS]);
  }, []);

  const editCompCb = useCallback(async (comp: UserCompliment) => {
    await updateComp(comp);
    setComps([...COMPLIMENTS]);
  }, []);

  return (
    <DataContext.Provider
      value={{
        fragrances, compliments, communityFrags, isLoaded, loadError, reload: load,
        addFrag: addFragCb, editFrag: editFragCb,
        addComp: addCompCb, editComp: editCompCb,
      }}
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
