import type { UserFragrance, FragranceStatus } from '@/types';
import type { BadgeVariant } from '@/components/ui/badge';
import { MONTHS } from '@/lib/frag-utils';

export type SortKey =
  | 'name_asc'
  | 'name_desc'
  | 'newest'
  | 'oldest'
  | 'rating_desc'
  | 'rating_asc'
  | 'compliments_desc';

export const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'newest', label: 'Date Added (newest)' },
  { value: 'oldest', label: 'Date Added (oldest)' },
  { value: 'rating_desc', label: 'Rating (high–low)' },
  { value: 'rating_asc', label: 'Rating (low–high)' },
  { value: 'compliments_desc', label: 'Compliments (most)' },
];

export const RATING_FILTER_OPTIONS = [
  { value: 'any', label: 'Any rating' },
  { value: '5', label: '5 stars' },
  { value: '4plus', label: '4+ stars' },
  { value: '3plus', label: '3+ stars' },
  { value: '1to2', label: '1–2 stars' },
  { value: 'unrated', label: 'Unrated' },
];

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'CURRENT', label: 'Current' },
  { value: 'PREVIOUSLY_OWNED', label: 'Previously Owned' },
  { value: 'WANT_TO_BUY', label: 'Want to Buy' },
  { value: 'WANT_TO_SMELL', label: 'Sample / Smell Only' },
  { value: 'DONT_LIKE', label: "Don't Like" },
  { value: 'WANT_TO_IDENTIFY', label: 'Identify Later' },
  { value: 'FINISHED', label: 'Finished' },
];

export function applySort(
  frags: UserFragrance[],
  sort: SortKey,
  compMap: Record<string, number>,
): UserFragrance[] {
  return [...frags].sort((a, b) => {
    switch (sort) {
      case 'name_desc': return b.name.localeCompare(a.name);
      case 'rating_desc': return (b.personalRating ?? 0) - (a.personalRating ?? 0);
      case 'rating_asc': return (a.personalRating ?? 0) - (b.personalRating ?? 0);
      case 'newest': return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      case 'oldest': return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
      case 'compliments_desc':
        return (compMap[b.fragranceId ?? b.id] ?? 0) - (compMap[a.fragranceId ?? a.id] ?? 0);
      default: return a.name.localeCompare(b.name);
    }
  });
}

export function addedStr(createdAt: string | null): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function statusVariant(status: FragranceStatus): BadgeVariant {
  switch (status) {
    case 'CURRENT': return 'collection';
    case 'WANT_TO_BUY': case 'WANT_TO_SMELL': return 'wishlist';
    case 'WANT_TO_IDENTIFY': return 'identify_later';
    case 'PREVIOUSLY_OWNED': return 'previously_owned';
    case 'DONT_LIKE': return 'dont_like';
    case 'FINISHED': return 'finished';
    default: return 'neutral';
  }
}
