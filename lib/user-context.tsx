"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { UserProfile } from "@/types";
import { supabase } from "@/lib/supabase";

interface UserContextValue {
  user: UserProfile | null;
  profiles: UserProfile[];
  isLoaded: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

function dbRowToProfile(r: Record<string, unknown>): UserProfile {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    createdAt: (r.created_at as string) ?? "",
    isAdmin: (r.is_admin as boolean) ?? false,
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all public profiles (identity screen + friend lookup — public read, no auth needed)
  useEffect(() => {
    supabase
      .from("user_profiles")
      .select("*")
      .order("created_at")
      .then(({ data }) => {
        if (data) setProfiles(data.map(dbRowToProfile));
      });
  }, []);

  async function resolveProfile(userId: string) {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setUser(data ? dbRowToProfile(data as Record<string, unknown>) : null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        resolveProfile(session.user.id).finally(() => setIsLoaded(true));
      } else {
        setIsLoaded(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        resolveProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(
    email: string,
    password: string,
    name: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, profiles, isLoaded, signIn, signUp, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export function getFriend(user: UserProfile, profiles: UserProfile[]): UserProfile | null {
  return profiles.find((p) => p.id !== user.id) ?? null;
}
