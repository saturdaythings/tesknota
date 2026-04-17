import type {
  UserFragrance, UserCompliment, CommunityFrag, CommunityData,
  Profile, DiscountCode, Follow, Notification, PendingTask,
  FollowStatus, NotificationType, PendingTaskType, PendingTaskStatus,
} from "@/types";
import { supabase } from "@/lib/supabase";

// ── Row mappers ───────────────────────────────────────────────

function dbRowToProfile(r: Record<string, unknown>): Profile {
  return {
    id: r.id as string,
    firstName: (r.first_name as string) ?? null,
    lastName: (r.last_name as string) ?? null,
    username: (r.username as string) ?? null,
    email: (r.email as string) ?? null,
    city: (r.city as string) ?? null,
    state: (r.state as string) ?? null,
    country: (r.country as string) ?? null,
    instagramHandle: (r.instagram_handle as string) ?? null,
    tiktokHandle: (r.tiktok_handle as string) ?? null,
    youtubeHandle: (r.youtube_handle as string) ?? null,
    showCollection: (r.show_collection as boolean) ?? true,
    showFollowers: (r.show_followers as boolean) ?? true,
    showFollowing: (r.show_following as boolean) ?? true,
    showSocialHandles: (r.show_social_handles as boolean) ?? true,
    showDiscountCodes: (r.show_discount_codes as boolean) ?? true,
    createdAt: (r.created_at as string) ?? "",
    updatedAt: (r.updated_at as string) ?? "",
  };
}

function dbRowToDiscountCode(r: Record<string, unknown>): DiscountCode {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    place: (r.place as string) ?? null,
    code: (r.code as string) ?? null,
    notes: (r.notes as string) ?? null,
    createdAt: (r.created_at as string) ?? "",
  };
}

function dbRowToFollow(r: Record<string, unknown>): Follow {
  return {
    id: r.id as string,
    followerId: r.follower_id as string,
    followingId: r.following_id as string,
    status: (r.status as FollowStatus) ?? "pending",
    starred: (r.starred as boolean) ?? false,
    requestMessage: (r.request_message as string) ?? null,
    createdAt: (r.created_at as string) ?? "",
  };
}

function dbRowToNotification(r: Record<string, unknown>): Notification {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as NotificationType,
    title: (r.title as string) ?? null,
    body: (r.body as string) ?? null,
    read: (r.read as boolean) ?? false,
    actionUrl: (r.action_url as string) ?? null,
    createdAt: (r.created_at as string) ?? "",
  };
}

function dbRowToPendingTask(r: Record<string, unknown>): PendingTask {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as PendingTaskType,
    referenceId: (r.reference_id as string) ?? null,
    referenceTable: (r.reference_table as string) ?? null,
    prompt: (r.prompt as string) ?? null,
    status: (r.status as PendingTaskStatus) ?? "open",
    createdAt: (r.created_at as string) ?? "",
    dueAt: (r.due_at as string) ?? null,
  };
}

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

// ── Profile queries ───────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data ? dbRowToProfile(data as Record<string, unknown>) : null;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  return data ? dbRowToProfile(data as Record<string, unknown>) : null;
}

// ── Follows queries ───────────────────────────────────────────

export async function fetchFollows(userId: string): Promise<Follow[]> {
  const { data } = await supabase
    .from("follows")
    .select("*")
    .or(`follower_id.eq.${userId},following_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => dbRowToFollow(r as Record<string, unknown>));
}

// ── Notification queries ──────────────────────────────────────

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => dbRowToNotification(r as Record<string, unknown>));
}

// ── Discount code queries ─────────────────────────────────────

export async function fetchDiscountCodes(userId: string): Promise<DiscountCode[]> {
  const { data } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => dbRowToDiscountCode(r as Record<string, unknown>));
}

// ── Pending task queries ──────────────────────────────────────

export async function fetchPendingTasks(userId: string): Promise<PendingTask[]> {
  const { data } = await supabase
    .from("pending_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => dbRowToPendingTask(r as Record<string, unknown>));
}

// ── Community data lookup ─────────────────────────────────────

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

