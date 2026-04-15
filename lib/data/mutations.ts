import type { UserFragrance, UserCompliment } from "@/types";
import {
  FRAGRANCES, COMPLIMENTS,
  setFragrances, setCompliments,
  FRAG_HEADERS, COMP_HEADERS,
} from "@/lib/state";
import { appendRow, writeSheet } from "@/lib/sheets";

// ── Fragrance mutations ──────────────────────────────────

export async function appendFrag(frag: UserFragrance): Promise<void> {
  setFragrances([...FRAGRANCES, frag]);
  await appendRow("userFragrances", fragToRow(frag), [...FRAG_HEADERS]);
}

export async function updateFrag(frag: UserFragrance): Promise<void> {
  setFragrances(FRAGRANCES.map((f) => (f.id === frag.id ? frag : f)));
  await writeSheet(
    "userFragrances",
    FRAGRANCES.map(fragToRow),
    [...FRAG_HEADERS]
  );
}

// ── Compliment mutations ─────────────────────────────────

export async function appendComp(comp: UserCompliment): Promise<void> {
  setCompliments([comp, ...COMPLIMENTS]);
  await appendRow("userCompliments", compToRow(comp), [...COMP_HEADERS]);
}

export async function updateComp(comp: UserCompliment): Promise<void> {
  setCompliments(COMPLIMENTS.map((c) => (c.id === comp.id ? comp : c)));
  await writeSheet(
    "userCompliments",
    COMPLIMENTS.map(compToRow),
    [...COMP_HEADERS]
  );
}

// ── Row serialisers ──────────────────────────────────────

function fragToRow(f: UserFragrance): Record<string, string> {
  return {
    userId: f.userId,
    fragranceId: f.fragranceId,
    status: f.status,
    bottleSize: f.sizes.join(", "),
    type: f.type ?? "",
    boughtFrom: f.whereBought ?? "",
    purchaseMonth: f.purchaseMonth ?? "",
    purchaseYear: f.purchaseYear ?? "",
    purchasePrice: f.purchasePrice ?? "",
    personalRating: f.personalRating != null ? String(f.personalRating) : "",
    personalLongevity: f.personalLong ?? "",
    personalSillage: f.personalSill ?? "",
    notes: f.personalNotes ?? "",
    addedAt: f.createdAt,
  };
}

function compToRow(c: UserCompliment): Record<string, string> {
  return {
    complimentId: c.id,
    userId: c.userId,
    primaryFragranceId: c.primaryFragId,
    secondaryFragranceId: c.secondaryFragId ?? "",
    complimenterGender: c.gender ?? "",
    relation: c.relation,
    month: c.month,
    year: c.year,
    locationName: c.location ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    country: c.country,
    notes: c.notes ?? "",
    createdAt: c.createdAt,
  };
}
