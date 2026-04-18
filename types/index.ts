export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
}

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

export type WishlistPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export const WISHLIST_PRIORITY_LABELS: Record<WishlistPriority, { label: string; subtitle: string }> = {
  HIGH: { label: 'High', subtitle: 'Obsessed and I need to own this' },
  MEDIUM: { label: 'Medium', subtitle: 'This is so good' },
  LOW: { label: 'Low', subtitle: "I don't want to forget about this" },
};

export interface UserFragrance {
  id: string;
  fragranceId: string | null;
  userId: string;
  name: string;
  house: string;
  status: FragranceStatus;
  sizes: BottleSize[];
  type: FragranceType | null;
  personalRating: number | null;
  statusRating: null;
  whereBought: string | null;
  purchaseDate: string | null;
  purchaseMonth: string | null;
  purchaseYear: string | null;
  purchasePrice: string | null;
  isDupe: boolean;
  dupeFor: string;
  personalNotes: string;
  createdAt: string;
  wishlistPriority: WishlistPriority | null;
}

export interface UserCompliment {
  id: string;
  userId: string;
  primaryFragId: string | null;
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
  fragranceAccords: string[];
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  avgPrice: string | null;
  isDupe: string;
  dupeFor: string;
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
  accords: string[];
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
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

// ── Social / profile types ────────────────────────────────────

export type FollowStatus = 'pending' | 'accepted' | 'declined' | 'archived';

export type NotificationType =
  | 'follow_request'
  | 'follow_accepted'
  | 'pending_task'
  | 'pending_entry'
  | 'community_flag';

export type PendingTaskType = 'fill_compliment' | 'fill_rating' | 'voice_add' | 'receipt_add';

export type PendingTaskStatus = 'open' | 'completed' | 'dismissed';

export interface Profile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  showCollection: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
  showSocialHandles: boolean;
  showDiscountCodes: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCode {
  id: string;
  userId: string;
  place: string | null;
  code: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  status: FollowStatus;
  starred: boolean;
  requestMessage: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string | null;
  body: string | null;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface PendingTask {
  id: string;
  userId: string;
  type: PendingTaskType;
  referenceId: string | null;
  referenceTable: string | null;
  prompt: string | null;
  status: PendingTaskStatus;
  createdAt: string;
  dueAt: string | null;
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

export const MOBILE_STATUS_LABELS: Record<FragranceStatus, string> = {
  CURRENT: "Current",
  PREVIOUSLY_OWNED: "Prev. Owned",
  WANT_TO_BUY: "Want to Buy",
  WANT_TO_SMELL: "Smell",
  DONT_LIKE: "Don't Like",
  WANT_TO_IDENTIFY: "Identify",
  FINISHED: "Finished",
};
