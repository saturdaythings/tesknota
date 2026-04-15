import type { UserFragrance, UserCompliment } from "@/types";
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
    purchase_month: f.purchaseMonth ?? null,
    purchase_year: f.purchaseYear ?? null,
    purchase_price: f.purchasePrice ?? null,
    personal_rating: f.personalRating ?? null,
    personal_notes: f.personalNotes ?? "",
    created_at: f.createdAt || new Date().toISOString(),
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
