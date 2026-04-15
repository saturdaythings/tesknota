import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";

// Mutable in-memory arrays — populated by loadAllData on app boot
export let FRAGRANCES: UserFragrance[] = [];
export let COMPLIMENTS: UserCompliment[] = [];
export let COMMUNITY_FRAGS: CommunityFrag[] = [];

export function setFragrances(data: UserFragrance[]): void { FRAGRANCES = data; }
export function setCompliments(data: UserCompliment[]): void { COMPLIMENTS = data; }
export function setCommunityFrags(data: CommunityFrag[]): void { COMMUNITY_FRAGS = data; }

// Sheet column headers — must match exactly what is written to Google Sheets
export const FRAG_HEADERS = [
  "userId", "fragranceId", "status", "bottleSize", "type",
  "boughtFrom", "purchaseMonth", "purchaseYear", "purchasePrice",
  "personalRating", "personalLongevity", "personalSillage", "notes", "addedAt",
] as const;

export const COMP_HEADERS = [
  "complimentId", "userId", "primaryFragranceId", "secondaryFragranceId",
  "complimenterGender", "relation", "month", "year",
  "locationName", "city", "state", "country", "notes", "createdAt",
] as const;

export const COMMUNITY_FRAG_HEADERS = [
  "fragranceId", "fragranceName", "fragranceHouse", "fragranceType",
  "fragranceAccords", "topNotes", "middleNotes", "baseNotes",
  "avgPrice", "isDupe", "dupeFor",
  "addedBy", "addedAt",
  "communityRating", "parfumoRating", "parfumoLongevity", "parfumoSillage",
  "communityLongevityLabel", "communitySillageLabel", "ratingVoteCount",
  "dataSource", "lastUpdated",
] as const;

export const PENDING_ENTRIES_HEADERS = [
  "id", "userId", "type", "status", "rawTranscript", "parsedJson",
  "missingFields", "createdAt", "updatedAt",
] as const;

export const API_LOG_HEADERS = [
  "id", "userId", "feature", "model", "tokensIn", "tokensOut", "costUsd", "timestamp",
] as const;

export const ACTIVITY_LOG_HEADERS = [
  "id", "userId", "actionType", "timestamp", "metadata",
] as const;

// Rating scale
export const RATING_WORD_TO_NUM: Record<string, number> = {
  Obsessed: 5,
  Love: 4,
  Like: 3,
  "Just OK": 2,
  "Don't Like": 1,
  WTF: 0,
};

// Longevity label normalisation
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

// Concentration label abbreviations
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
