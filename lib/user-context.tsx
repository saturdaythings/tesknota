"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserId = "u1" | "u2";

export interface User {
  id: UserId;
  name: string;
}

export const USERS: User[] = [
  { id: "u1", name: "Kiana" },
  { id: "u2", name: "Sylvia" },
];

export function getFriend(user: User): User {
  return USERS.find((u) => u.id !== user.id)!;
}

const USER_KEY = "currentUser";

interface UserContextValue {
  user: User | null;
  isLoaded: boolean;
  selectUser: (u: User) => void;
  signOut: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const selectUser = useCallback((u: User) => {
    setUser(u);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      // ignore
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoaded, selectUser, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
