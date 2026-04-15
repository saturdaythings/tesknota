import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function starsStr(n: number): string {
  if (!n) return "\u2014";
  let s = "";
  for (let i = 1; i <= 5; i++) s += i <= n ? "\u2605" : "\u2606";
  return s;
}

export function parseRating(val: string | number | null | undefined): number {
  if (!val) return 0;
  const n = parseInt(String(val));
  return isNaN(n) ? 0 : n;
}

export function avgRatingStr(frags: UserFragrance[]): string {
  const rated = frags.filter((f) => f.personalRating);
  if (!rated.length) return "\u2014";
  const avg = rated.reduce((a, f) => a + (f.personalRating ?? 0), 0) / rated.length;
  return avg.toFixed(1);
}

export function getAccords(f: UserFragrance, communityFrags: CommunityFrag[]): string[] {
  const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cf = communityFrags.find(
    (c) => norm(c.fragranceName) === norm(f.name) && norm(c.fragranceHouse) === norm(f.house)
  );
  const raw = cf?.fragranceAccords ?? "";
  if (!raw) return [];
  return raw.split(",").map((a) => a.trim()).filter(Boolean);
}

export function getCompCount(
  fragId: string,
  compliments: UserCompliment[],
  userId?: string
): number {
  return compliments.filter(
    (c) =>
      (c.primaryFragId === fragId || c.secondaryFragId === fragId) &&
      (!userId || c.userId === userId)
  ).length;
}

export function monthNum(m: string): number {
  const n = parseInt(m);
  return isNaN(n) ? MONTHS.indexOf(m) + 1 : n;
}

export function addedThisMonth(
  arr: (UserFragrance | UserCompliment)[],
  curMonth: number,
  curYear: number
): number {
  return arr.filter((x) => {
    const d = (x as UserFragrance).createdAt ?? "";
    if (!d) return false;
    const dt = new Date(d);
    return dt.getMonth() + 1 === curMonth && dt.getFullYear() === curYear;
  }).length;
}
