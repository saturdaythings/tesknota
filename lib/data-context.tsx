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
import {
  appendFrag,
  updateFrag,
  appendComp,
  updateComp,
  deleteFrag,
  deleteComp,
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
  removeFrag: (id: string) => Promise<void>;
  addComp: (comp: UserCompliment) => Promise<void>;
  editComp: (comp: UserCompliment) => Promise<void>;
  removeComp: (id: string) => Promise<void>;
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
    const { data, ok } = await loadAllData();
    setFrags(data.fragrances);
    setComps(data.compliments);
    setCF(data.communityFrags);
    setIsLoaded(true);
    if (!ok) setLoadError(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addFragCb = useCallback(async (frag: UserFragrance) => {
    const { id, fragranceId } = await appendFrag(frag);
    setFrags((prev) => [{ ...frag, id, fragranceId: fragranceId ?? frag.fragranceId }, ...prev]);
  }, []);

  const editFragCb = useCallback(async (frag: UserFragrance) => {
    await updateFrag(frag);
    setFrags((prev) => prev.map((f) => (f.id === frag.id ? frag : f)));
  }, []);

  const addCompCb = useCallback(async (comp: UserCompliment) => {
    const { id } = await appendComp(comp);
    setComps((prev) => [{ ...comp, id }, ...prev]);
  }, []);

  const editCompCb = useCallback(async (comp: UserCompliment) => {
    await updateComp(comp);
    setComps((prev) => prev.map((c) => (c.id === comp.id ? comp : c)));
  }, []);

  const removeFragCb = useCallback(async (id: string) => {
    await deleteFrag(id);
    setFrags((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const removeCompCb = useCallback(async (id: string) => {
    await deleteComp(id);
    setComps((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <DataContext.Provider
      value={{
        fragrances, compliments, communityFrags, isLoaded, loadError, reload: load,
        addFrag: addFragCb, editFrag: editFragCb, removeFrag: removeFragCb,
        addComp: addCompCb, editComp: editCompCb, removeComp: removeCompCb,
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
