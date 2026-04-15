export type UserId = "u1" | "u2";

export type FragranceStatus =
  | "CURRENT"
  | "PREVIOUSLY_OWNED"
  | "WANT_TO_BUY"
  | "WANT_TO_SMELL"
  | "DONT_LIKE"
  | "WANT_TO_IDENTIFY"
  | "FINISHED";

export type FragranceType =
  | "Extrait de Parfum"
  | "Eau de Parfum"
  | "Eau de Toilette"
  | "Cologne"
  | "Perfume Concentré"
  | "Body Spray"
  | "Perfume Oil"
  | "Other";

export type BottleSize = "Sample" | "Travel" | "Full Bottle" | "Decant";

export type ComplimenterGender = "Female" | "Male";

export type Relation =
  | "Stranger"
  | "Friend"
  | "Colleague / Client"
  | "Family"
  | "Significant Other"
  | "Other";

export interface UserFragrance {
  id: string;
  fragranceId: string;
  userId: UserId;
  name: string;
  house: string;
  status: FragranceStatus;
  sizes: BottleSize[];
  type: FragranceType | null;
  personalRating: number | null;
  statusRating: null;
  personalLong: string | null;
  personalSill: string | null;
  whereBought: string | null;
  purchaseDate: string | null;
  purchaseMonth: string | null;
  purchaseYear: string | null;
  purchasePrice: string | null;
  isDupe: boolean;
  dupeFor: string;
  personalNotes: string;
  createdAt: string;
}

export interface UserCompliment {
  id: string;
  userId: UserId;
  primaryFragId: string;
  primaryFrag: string;
  secondaryFragId: string | null;
  secondaryFrag: string | null;
  gender: ComplimenterGender | null;
  relation: Relation;
  month: string;
  year: string;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string;
  notes: string | null;
  createdAt: string;
}

export interface CommunityFrag {
  fragranceId: string;
  name: string;
  house: string;
  fragranceName: string;
  fragranceHouse: string;
  fragranceType: string;
  fragranceAccords: string;
  topNotes: string;
  middleNotes: string;
  baseNotes: string;
  avgPrice: string | null;
  isDupe: string;
  dupeFor: string;
  addedBy: string;
  addedAt: string;
  communityRating: string;
  parfumoRating: string;
  parfumoLongevity: string;
  parfumoSillage: string;
  communityLongevityLabel: string;
  communitySillageLabel: string;
  ratingVoteCount: string;
  dataSource: string;
  lastUpdated: string;
}

export interface CommunityData {
  avgPrice: string | null;
  notes: string;
  accords: string;
  topNotes: string;
  middleNotes: string;
  baseNotes: string;
  communityRating: string;
  parfumoRating: string;
  parfumoLongevity: string;
  parfumoSillage: string;
  communityLongevityLabel: string;
  communitySillageLabel: string;
  ratingVoteCount: string;
  dataSource: string;
  lastUpdated: string;
}

export const STATUS_LABELS: Record<FragranceStatus, string> = {
  CURRENT: "Current",
  PREVIOUSLY_OWNED: "Prev. Owned",
  WANT_TO_BUY: "Want to Buy",
  WANT_TO_SMELL: "Want to Smell",
  DONT_LIKE: "Don't Like",
  WANT_TO_IDENTIFY: "Identify Later",
  FINISHED: "Finished",
};

export const STATUS_CSS: Record<FragranceStatus, string> = {
  CURRENT: "s-cur",
  PREVIOUSLY_OWNED: "s-prv",
  WANT_TO_BUY: "s-wnt",
  WANT_TO_SMELL: "s-wnt",
  DONT_LIKE: "s-no",
  WANT_TO_IDENTIFY: "s-unk",
  FINISHED: "s-fin",
};
