import type { UserFragrance, UserCompliment, CommunityFrag, CommunityData } from "@/types";
import { supabase } from "@/lib/supabase";

// ── Row mappers ───────────────────────────────────────────────

function dbRowToFrag(r: Record<string, unknown>): UserFragrance {
  const pm = (r.purchase_month as string) ?? "";
  const py = (r.purchase_year as string) ?? "";
  return {
    id: r.id as string,
    fragranceId: (r.fragrance_id as string) ?? null,
    userId: r.user_id as string,
    name: r.name as string,
    house: r.house as string,
    status: (r.status as UserFragrance["status"]) ?? "CURRENT",
    sizes: (r.sizes as UserFragrance["sizes"]) ?? [],
    type: (r.type as UserFragrance["type"]) ?? null,
    personalRating: (r.personal_rating as number) ?? null,
    statusRating: null,
    whereBought: (r.where_bought as string) ?? null,
    purchaseDate: pm && py ? `${pm} ${py}` : py || null,
    purchaseMonth: pm || null,
    purchaseYear: py || null,
    purchasePrice: (r.purchase_price as string) ?? null,
    isDupe: (r.is_dupe as boolean) ?? false,
    dupeFor: (r.dupe_for as string) ?? "",
    personalNotes: (r.personal_notes as string) ?? "",
    createdAt: (r.created_at as string) ?? "",
    wishlistPriority: (r.wishlist_priority as UserFragrance["wishlistPriority"]) ?? null,
  };
}

function dbRowToComp(r: Record<string, unknown>): UserCompliment {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    primaryFragId: (r.primary_frag_id as string) ?? null,
    primaryFrag: (r.primary_frag_name as string) ?? "",
    secondaryFragId: (r.secondary_frag_id as string) ?? null,
    secondaryFrag: (r.secondary_frag_name as string) ?? null,
    gender: (r.gender as UserCompliment["gender"]) ?? null,
    relation: (r.relation as UserCompliment["relation"]) ?? "Other",
    month: (r.month as string) ?? "",
    year: (r.year as string) ?? "",
    location: (r.location as string) ?? null,
    city: (r.city as string) ?? null,
    state: (r.state as string) ?? null,
    country: (r.country as string) ?? "US",
    notes: (r.notes as string) ?? null,
    createdAt: (r.created_at as string) ?? "",
  };
}

function dbRowToCommunityFrag(r: Record<string, unknown>): CommunityFrag {
  return {
    fragranceId: r.id as string,
    name: r.name as string,
    house: r.house as string,
    fragranceName: r.name as string,
    fragranceHouse: r.house as string,
    fragranceType: (r.type as string) ?? "",
    fragranceAccords: (r.accords as string[]) ?? [],
    topNotes: (r.top_notes as string[]) ?? [],
    middleNotes: (r.middle_notes as string[]) ?? [],
    baseNotes: (r.base_notes as string[]) ?? [],
    avgPrice: (r.avg_price as string) ?? null,
    isDupe: r.is_dupe ? "true" : "false",
    dupeFor: (r.dupe_for as string) ?? "",
    communityRating: (r.community_rating as string) ?? "",
    parfumoRating: (r.parfumo_rating as string) ?? "",
    parfumoLongevity: (r.parfumo_longevity as string) ?? "",
    parfumoSillage: (r.parfumo_sillage as string) ?? "",
    communityLongevityLabel: (r.community_longevity_label as string) ?? "",
    communitySillageLabel: (r.community_sillage_label as string) ?? "",
    ratingVoteCount: (r.rating_vote_count as string) ?? "",
    dataSource: (r.source as string) ?? "",
    lastUpdated: (r.last_fetched_at as string) ?? "",
  };
}

// ── loadAllData ───────────────────────────────────────────────

export interface AllData {
  fragrances: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
}

export async function loadAllData(userId: string): Promise<{ data: AllData; ok: boolean }> {
  const [fragsRes, compsRes, communityRes] = await Promise.all([
    supabase.from("user_fragrances").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("user_compliments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("fragrances").select("*"),
  ]);

  const ok = !fragsRes.error && !compsRes.error;

  if (fragsRes.error) console.error("[loadAllData] user_fragrances:", fragsRes.error.message);
  if (compsRes.error) console.error("[loadAllData] user_compliments:", compsRes.error.message);
  if (communityRes.error) console.error("[loadAllData] fragrances:", communityRes.error.message);

  return {
    data: {
      fragrances: (fragsRes.data ?? []).map(dbRowToFrag),
      compliments: (compsRes.data ?? []).map(dbRowToComp),
      communityFrags: (communityRes.data ?? []).map(dbRowToCommunityFrag),
    },
    ok,
  };
}

// ── Community data lookup ─────────────────────────────────────

function norm(s: string): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getCommunityData(
  name: string,
  house: string,
  communityFrags: CommunityFrag[]
): CommunityData | null {
  const cf = communityFrags.find(
    (f) => norm(f.fragranceName) === norm(name) && norm(f.fragranceHouse) === norm(house)
  );
  if (!cf) return null;
  return {
    avgPrice: cf.avgPrice ?? null,
    notes: "",
    accords: cf.fragranceAccords ?? [],
    topNotes: cf.topNotes ?? [],
    middleNotes: cf.middleNotes ?? [],
    baseNotes: cf.baseNotes ?? [],
    communityRating: cf.communityRating ?? "",
    parfumoRating: cf.parfumoRating ?? "",
    parfumoLongevity: cf.parfumoLongevity ?? "",
    parfumoSillage: cf.parfumoSillage ?? "",
    communityLongevityLabel: cf.communityLongevityLabel ?? "",
    communitySillageLabel: cf.communitySillageLabel ?? "",
    ratingVoteCount: cf.ratingVoteCount ?? "",
    dataSource: cf.dataSource ?? "",
    lastUpdated: cf.lastUpdated ?? "",
  };
}

