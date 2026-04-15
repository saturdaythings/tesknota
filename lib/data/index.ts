import type { UserFragrance, UserCompliment, CommunityData } from "@/types";
import type { UserId } from "@/lib/user-context";
import { FRAGRANCES, COMPLIMENTS } from "@/lib/state";

export function myFragrances(userId: UserId): UserFragrance[] {
  return FRAGRANCES.filter((f) => f.userId === userId);
}

export function friendFragrances(userId: UserId): UserFragrance[] {
  return FRAGRANCES.filter((f) => f.userId !== userId);
}

export function myCompliments(userId: UserId): UserCompliment[] {
  return COMPLIMENTS.filter((c) => c.userId === userId);
}

export function friendCompliments(userId: UserId): UserCompliment[] {
  return COMPLIMENTS.filter((c) => c.userId !== userId);
}

// Stub — full implementation in Phase 5 when Google Sheets integration is wired
export async function loadAllData(): Promise<boolean> {
  return true;
}

// Stub — returns null until COMMUNITY_FRAGS is populated by loadAllData
export function getCommunityData(
  _name: string,
  _house: string,
  _type?: string
): CommunityData | null {
  return null;
}

// Stub — returns empty names until data is loaded
export function resolveFragById(_fragId: string): { name: string; house: string } {
  return { name: "", house: "" };
}
