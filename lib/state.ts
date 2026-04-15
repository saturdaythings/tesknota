// UI constants — rating scales, longevity/sillage maps, badge text.
// Sheets headers and mutable data arrays removed — data lives in Supabase.

export const RATING_WORD_TO_NUM: Record<string, number> = {
  Obsessed: 5,
  Love: 4,
  Like: 3,
  "Just OK": 2,
  "Don't Like": 1,
  WTF: 0,
};

export const LONG_MAP: Record<string, string> = {
  "2-4h": "Very weak",
  "4-6h": "Weak",
  "6-8h": "Weak",
  "8-12h": "Moderate",
  "0-6h": "Very weak",
  "6-12h": "Moderate",
  "12-24h": "Long lasting",
  ">24h": "Eternal",
  "Very weak": "Very weak",
  Weak: "Weak",
  Moderate: "Moderate",
  "Long lasting": "Long lasting",
  Eternal: "Eternal",
};

export const LONG_HOURS: Record<string, string> = {
  "Very weak": "0-4h",
  Weak: "4-8h",
  Moderate: "8-12h",
  "Long lasting": "12-24h",
  Eternal: ">24h",
};

export const TYPE_BADGE_TEXT: Record<string, string> = {
  "Extrait de Parfum": "Extrait de Parfum",
  "Eau de Parfum": "Eau de Parfum",
  "Eau de Toilette": "Eau de Toilette",
  Cologne: "Cologne",
  "Perfume Concentré": "Concentré",
  "Body Spray": "Body Spray",
  "Perfume Oil": "Oil",
  Other: "Other",
};
