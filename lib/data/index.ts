import type { UserFragrance, UserCompliment, CommunityData, CommunityFrag } from "@/types";
import type { UserId } from "@/lib/user-context";
import {
  FRAGRANCES, COMPLIMENTS, COMMUNITY_FRAGS,
  setFragrances, setCompliments, setCommunityFrags,
} from "@/lib/state";
import { readSheet } from "@/lib/sheets";
import { MONTHS } from "@/lib/frag-utils";

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

// ── Row parsers ──────────────────────────────────────────

function resolveByFragId(fragId: string): { name: string; house: string } {
  const cf = COMMUNITY_FRAGS.find((f) => f.fragranceId === fragId);
  if (cf) return { name: cf.fragranceName ?? cf.name ?? "", house: cf.fragranceHouse ?? cf.house ?? "" };
  const sf = FRAGRANCES.find((f) => f.fragranceId === fragId || f.id === fragId);
  if (sf) return { name: sf.name, house: sf.house };
  return { name: "", house: "" };
}

let _rowCounter = 0;

function rowToFrag(row: Record<string, string>): UserFragrance {
  const fid = row.fragranceId ?? "";
  const { name, house } = resolveByFragId(fid);
  const pm = row.purchaseMonth ?? "";
  const py = row.purchaseYear ?? "";
  const purchaseDate = pm && py ? `${pm} ${py}` : py || null;

  return {
    id: `e${++_rowCounter}`,
    fragranceId: fid,
    userId: (row.userId as UserId) ?? "u1",
    name,
    house,
    status: (row.status as UserFragrance["status"]) ?? "CURRENT",
    sizes: row.bottleSize
      ? (row.bottleSize.split(",").map((s) => s.trim()).filter(Boolean) as UserFragrance["sizes"])
      : [],
    type: (row.type as UserFragrance["type"]) || null,
    personalRating: row.personalRating ? parseInt(row.personalRating) : null,
    statusRating: null,
    personalLong: row.personalLongevity || null,
    personalSill: row.personalSillage || null,
    whereBought: row.boughtFrom || null,
    purchaseDate,
    purchaseMonth: pm || null,
    purchaseYear: py || null,
    purchasePrice: row.purchasePrice || null,
    isDupe: false,
    dupeFor: "",
    personalNotes: (row.notes ?? "").replace(/^Purchased for \$[\d.]+\.?\s*/, "").trim(),
    createdAt: row.addedAt ?? "",
  };
}

function normalizeMonth(m: string): string {
  const n = parseInt(m);
  if (!isNaN(n) && n >= 1 && n <= 12) return MONTHS[n - 1];
  return m;
}

function rowToComp(row: Record<string, string>): UserCompliment {
  const pFid = row.primaryFragranceId ?? "";
  const sFid = row.secondaryFragranceId || null;
  const primary = resolveByFragId(pFid);
  const secondary = sFid ? resolveByFragId(sFid) : null;

  return {
    id: row.complimentId ?? `c${++_rowCounter}`,
    userId: (row.userId as UserId) ?? "u1",
    primaryFragId: pFid,
    primaryFrag: primary.name,
    secondaryFragId: sFid,
    secondaryFrag: secondary ? secondary.name : null,
    gender: (row.complimenterGender as UserCompliment["gender"]) || null,
    relation: (row.relation as UserCompliment["relation"]) ?? "Other",
    month: normalizeMonth(row.month ?? ""),
    year: row.year ?? "",
    location: row.locationName || null,
    city: row.city || null,
    state: row.state || null,
    country: row.country || "US",
    notes: row.notes || null,
    createdAt: row.createdAt ?? "",
  };
}

// ── loadAllData ──────────────────────────────────────────

export async function loadAllData(): Promise<boolean> {
  let ok = true;

  const [fragsRaw, compsRaw, communityRaw] = await Promise.all([
    readSheet("userFragrances").catch((e) => {
      console.error("[loadAllData] userFragrances error:", e);
      ok = false;
      return [] as Record<string, string>[];
    }),
    readSheet("userCompliments").catch((e) => {
      console.error("[loadAllData] userCompliments error:", e);
      ok = false;
      return [] as Record<string, string>[];
    }),
    readSheet("fragranceDB").catch(() => [] as Record<string, string>[]),
  ]);

  // Community frags must be set before row parsers run (resolveByFragId reads them)
  if (communityRaw.length) {
    setCommunityFrags(
      communityRaw.map((r) => ({
        ...r,
        fragranceName: r.fragranceName ?? r.name ?? "",
        fragranceHouse: r.fragranceHouse ?? r.house ?? "",
        name: r.fragranceName ?? r.name ?? "",
        house: r.fragranceHouse ?? r.house ?? "",
      })) as CommunityFrag[]
    );
  }

  _rowCounter = 0;

  if (fragsRaw.length) {
    const parsed = fragsRaw.map(rowToFrag).filter((f) => (f.name ?? "").trim());
    const seen = new Set<string>();
    setFragrances(
      parsed.filter((f) => {
        if (!f.id || seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      })
    );
  }

  if (compsRaw.length) {
    const parsed = compsRaw.map(rowToComp);
    const seen = new Set<string>();
    setCompliments(
      parsed.filter((c) => {
        if (!c.id || seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      })
    );
  }

  return ok;
}

// ── Query helpers ────────────────────────────────────────

export function getCommunityData(
  name: string,
  house: string
): CommunityData | null {
  const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cf = COMMUNITY_FRAGS.find(
    (f) => norm(f.fragranceName) === norm(name) && norm(f.fragranceHouse) === norm(house)
  );
  if (!cf) return null;
  return {
    avgPrice: cf.avgPrice ?? null,
    notes: "",
    accords: cf.fragranceAccords ?? "",
    topNotes: cf.topNotes ?? "",
    middleNotes: cf.middleNotes ?? "",
    baseNotes: cf.baseNotes ?? "",
    communityRating: cf.communityRating ?? "",
    parfumoRating: cf.parfumoRating ?? "",
    parfumoLongevity: cf.parfumoLongevity ?? "",
    parfumoSillage: cf.parfumoSillage ?? "",
    communityLongevityLabel: cf.communityLongevityLabel ?? "",
    communitySillageLabel: cf.communitySillageLabel ?? "",
    ratingVoteCount: cf.ratingVoteCount ?? "",
    dataSource: cf.dataSource ?? "fragranceDB",
    lastUpdated: cf.lastUpdated ?? "",
  };
}

export function resolveFragById(fragId: string): { name: string; house: string } {
  return resolveByFragId(fragId);
}
