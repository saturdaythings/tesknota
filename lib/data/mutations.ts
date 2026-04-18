import type {
  UserFragrance, UserCompliment,
  Profile, DiscountCode, Follow, FollowStatus, PendingTaskStatus, PendingTaskType,
} from "@/types";
import { supabase } from "@/lib/supabase";

// ── Community fragrance dedup ─────────────────────────────────
// Upserts a minimal community row by name+house+type (the unique key).
// Returns the UUID so user_fragrances can link to it.
// Both users adding the same fragrance resolve to the same community row.

function isUUID(s: string | null | undefined): boolean {
  return !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function findOrCreateFragId(
  fragranceId: string | null | undefined,
  name: string,
  house: string,
  type: string | null
): Promise<string | null> {
  if (isUUID(fragranceId)) return fragranceId!;
  if (!name || !house) return null;

  const { data, error } = await supabase
    .from("fragrances")
    .upsert(
      { name, house, type: type || null, source: "user" },
      { onConflict: "name_normalized,house_normalized,lower(coalesce(type,''))" }
    )
    .select("id")
    .single();

  if (error || !data) {
    // Conflict means it already exists — look it up directly
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const q = supabase
      .from("fragrances")
      .select("id")
      .eq("name_normalized", norm(name))
      .eq("house_normalized", norm(house));
    const { data: existing } = await (type ? q.eq("type", type) : q.is("type", null)).maybeSingle();
    return existing?.id ?? null;
  }
  return data.id;
}

// ── Row serialisers (TS → DB) ─────────────────────────────────

function fragToDb(f: UserFragrance, resolvedFragId: string | null): Record<string, unknown> {
  return {
    user_id: f.userId,
    fragrance_id: resolvedFragId,
    name: f.name,
    house: f.house,
    status: f.status,
    sizes: f.sizes,
    type: f.type ?? null,
    where_bought: f.whereBought ?? null,
    purchase_date: f.purchaseDate ?? null,
    purchase_month: f.purchaseMonth ?? null,
    purchase_year: f.purchaseYear ?? null,
    purchase_price: f.purchasePrice ?? null,
    personal_rating: f.personalRating ?? null,
    personal_notes: f.personalNotes ?? "",
    is_dupe: f.isDupe ?? false,
    dupe_for: f.dupeFor ?? "",
    created_at: f.createdAt || new Date().toISOString(),
    wishlist_priority: f.wishlistPriority ?? null,
  };
}

function compToDb(c: UserCompliment): Record<string, unknown> {
  return {
    user_id: c.userId,
    primary_frag_id: c.primaryFragId ?? null,
    primary_frag_name: c.primaryFrag,
    secondary_frag_id: c.secondaryFragId ?? null,
    secondary_frag_name: c.secondaryFrag ?? null,
    gender: c.gender ?? null,
    relation: c.relation,
    month: c.month,
    year: c.year,
    location: c.location ?? null,
    city: c.city ?? null,
    state: c.state ?? null,
    country: c.country,
    notes: c.notes ?? null,
    created_at: c.createdAt || new Date().toISOString(),
  };
}

// ── Fragrance mutations ───────────────────────────────────────

// Returns { id, fragranceId } assigned by DB so local state can be updated with real UUIDs.
export async function appendFrag(frag: UserFragrance): Promise<{ id: string; fragranceId: string | null }> {
  const fragId = await findOrCreateFragId(frag.fragranceId, frag.name, frag.house, frag.type ?? null);
  const { data, error } = await supabase
    .from("user_fragrances")
    .insert(fragToDb(frag, fragId))
    .select("id, fragrance_id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, fragranceId: data.fragrance_id ?? null };
}

export async function updateFrag(frag: UserFragrance): Promise<void> {
  const fragId = await findOrCreateFragId(frag.fragranceId, frag.name, frag.house, frag.type ?? null);
  const { error } = await supabase
    .from("user_fragrances")
    .update(fragToDb(frag, fragId))
    .eq("id", frag.id);
  if (error) throw new Error(error.message);
}

export async function deleteFrag(id: string): Promise<void> {
  const { error } = await supabase.from("user_fragrances").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Compliment mutations ──────────────────────────────────────

export async function appendComp(comp: UserCompliment): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("user_compliments")
    .insert(compToDb(comp))
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function updateComp(comp: UserCompliment): Promise<void> {
  const { error } = await supabase
    .from("user_compliments")
    .update(compToDb(comp))
    .eq("id", comp.id);
  if (error) throw new Error(error.message);
}

export async function deleteComp(id: string): Promise<void> {
  const { error } = await supabase.from("user_compliments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Community data enrichment ─────────────────────────────────
// Called after import when the user supplies community fields (notes, accords, etc.).
// Only updates non-null fields so we don't wipe existing data.

export interface CommunityImportFields {
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
  accords?: string[];
  avgPrice?: string;
  communityRating?: string;
  parfumoRating?: string;
  communityLongevityLabel?: string;
  communitySillageLabel?: string;
}

export async function enrichFragranceCommunityData(
  fragranceId: string,
  fields: CommunityImportFields
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (fields.topNotes?.length) patch.top_notes = fields.topNotes;
  if (fields.middleNotes?.length) patch.middle_notes = fields.middleNotes;
  if (fields.baseNotes?.length) patch.base_notes = fields.baseNotes;
  if (fields.accords?.length) patch.accords = fields.accords;
  if (fields.avgPrice) patch.avg_price = fields.avgPrice;
  if (fields.communityRating) patch.community_rating = fields.communityRating;
  if (fields.parfumoRating) patch.parfumo_rating = fields.parfumoRating;
  if (fields.communityLongevityLabel) patch.community_longevity_label = fields.communityLongevityLabel;
  if (fields.communitySillageLabel) patch.community_sillage_label = fields.communitySillageLabel;
  if (Object.keys(patch).length === 0) return;
  await supabase.from("fragrances").update(patch).eq("id", fragranceId);
}

// ── Profile mutations ─────────────────────────────────────────

function profileToDb(p: Profile): Record<string, unknown> {
  return {
    id: p.id,
    first_name: p.firstName ?? null,
    last_name: p.lastName ?? null,
    username: p.username ?? null,
    email: p.email ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    country: p.country ?? null,
    instagram_handle: p.instagramHandle ?? null,
    tiktok_handle: p.tiktokHandle ?? null,
    youtube_handle: p.youtubeHandle ?? null,
    show_collection: p.showCollection,
    show_followers: p.showFollowers,
    show_following: p.showFollowing,
    show_social_handles: p.showSocialHandles,
    show_discount_codes: p.showDiscountCodes,
  };
}

export async function upsertProfile(profile: Profile): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(profileToDb(profile));
  if (error) throw new Error(error.message);
}

// ── Discount code mutations ───────────────────────────────────

export async function addDiscountCode(code: DiscountCode): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("discount_codes")
    .insert({ user_id: code.userId, place: code.place, code: code.code, notes: code.notes })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function updateDiscountCode(code: DiscountCode): Promise<void> {
  const { error } = await supabase
    .from("discount_codes")
    .update({ place: code.place, code: code.code, notes: code.notes })
    .eq("id", code.id);
  if (error) throw new Error(error.message);
}

export async function deleteDiscountCode(id: string): Promise<void> {
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Follow mutations ──────────────────────────────────────────

export async function sendFollowRequest(
  followerId: string,
  followingId: string,
  message?: string
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId, request_message: message ?? null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function updateFollowStatus(id: string, status: FollowStatus): Promise<void> {
  const { error } = await supabase.from("follows").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setFollowStarred(id: string, starred: boolean): Promise<void> {
  const { error } = await supabase.from("follows").update({ starred }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteFollow(id: string): Promise<void> {
  const { error } = await supabase.from("follows").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Notification mutations ────────────────────────────────────

export async function createNotification(
  userId: string,
  type: string,
  title: string | null,
  body: string | null,
  actionUrl: string | null = null,
): Promise<void> {
  await supabase
    .from("notifications")
    .insert({ user_id: userId, type, title, body, action_url: actionUrl, read: false });
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw new Error(error.message);
}

// ── Pending task mutations ────────────────────────────────────

export async function updatePendingTaskStatus(id: string, status: PendingTaskStatus): Promise<void> {
  const { error } = await supabase.from("pending_tasks").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createPendingTask(
  userId: string,
  type: PendingTaskType,
  prompt: string,
  dueAt?: string,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("pending_tasks")
    .insert({ user_id: userId, type, status: "open", prompt, due_at: dueAt ?? null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: (data as { id: string }).id };
}

export async function createPendingEntry(fragranceName: string, house: string | null, userId: string): Promise<void> {
  await supabase.from("pending_entries").insert({
    fragrance_name: fragranceName,
    house: house ?? null,
    requested_by: userId,
    status: "pending",
  });
}

// ── Community flagging ────────────────────────────────────────

export async function submitCommunityFlag(flag: {
  userId: string;
  fragranceId: string | null;
  fragranceName: string;
  fragranceHouse: string;
  fieldFlagged: string;
  userNote: string;
}): Promise<void> {
  const { error } = await supabase.from("community_flags").insert({
    user_id: flag.userId,
    fragrance_id: flag.fragranceId || null,
    fragrance_name: flag.fragranceName,
    fragrance_house: flag.fragranceHouse,
    field_flagged: flag.fieldFlagged,
    user_note: flag.userNote || null,
  });
  if (error) throw new Error(error.message);
}
