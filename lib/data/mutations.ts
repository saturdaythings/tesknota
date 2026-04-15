import type { UserFragrance, UserCompliment } from "@/types";
import { supabase } from "@/lib/supabase";

// ── Row serialisers (TS → DB) ─────────────────────────────────

function fragToDb(f: UserFragrance): Record<string, unknown> {
  return {
    user_id: f.userId,
    fragrance_id: f.fragranceId ?? null,
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

export async function appendFrag(frag: UserFragrance): Promise<void> {
  const { error } = await supabase.from("user_fragrances").insert(fragToDb(frag));
  if (error) throw new Error(error.message);
}

export async function updateFrag(frag: UserFragrance): Promise<void> {
  const { error } = await supabase
    .from("user_fragrances")
    .update(fragToDb(frag))
    .eq("id", frag.id);
  if (error) throw new Error(error.message);
}

export async function deleteFrag(id: string): Promise<void> {
  const { error } = await supabase.from("user_fragrances").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Compliment mutations ──────────────────────────────────────

export async function appendComp(comp: UserCompliment): Promise<void> {
  const { error } = await supabase.from("user_compliments").insert(compToDb(comp));
  if (error) throw new Error(error.message);
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
