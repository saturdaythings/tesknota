import type { UserFragrance } from '@/types';
import { MONTHS } from '@/lib/frag-utils';
import { STATUS_LABELS } from '@/types';

export type SortField = 'fragrance' | 'date_added' | 'rating' | 'size' | 'compliments' | 'status';
export type SortDir = 'asc' | 'desc';
export type SortKey = `${SortField}_${SortDir}`;

/** Field options shown in the sort dropdown — match column header labels exactly. Accords exempt. */
export const SORT_FIELD_OPTIONS = [
  { value: 'fragrance', label: 'Fragrance' },
  { value: 'date_added', label: 'Date Added' },
  { value: 'rating', label: 'Rating' },
  { value: 'size', label: 'Size' },
  { value: 'compliments', label: 'Compliments' },
  { value: 'status', label: 'Status' },
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

/** Parse a URL-safe sort key into field + direction. Defaults to fragrance/asc. */
export function parseSortKey(raw: string | null): { field: SortField; dir: SortDir } {
  if (!raw) return { field: 'fragrance', dir: 'asc' };
  const lastUnderscore = raw.lastIndexOf('_');
  if (lastUnderscore === -1) return { field: 'fragrance', dir: 'asc' };
  const maybeDir = raw.slice(lastUnderscore + 1);
  const maybeField = raw.slice(0, lastUnderscore) as SortField;
  if (maybeDir !== 'asc' && maybeDir !== 'desc') return { field: 'fragrance', dir: 'asc' };
  return { field: maybeField, dir: maybeDir };
}

function sizeNum(frag: UserFragrance): number {
  const n = parseInt(frag.sizes?.[0] ?? '');
  return isNaN(n) ? 0 : n;
}

export function applySort(
  frags: UserFragrance[],
  field: SortField,
  dir: SortDir,
  compMap: Record<string, number>,
): UserFragrance[] {
  return [...frags].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'fragrance':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'date_added':
        cmp = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
        break;
      case 'rating':
        cmp = (a.personalRating ?? 0) - (b.personalRating ?? 0);
        break;
      case 'size':
        cmp = sizeNum(a) - sizeNum(b);
        break;
      case 'compliments':
        cmp = (compMap[a.fragranceId ?? a.id] ?? 0) - (compMap[b.fragranceId ?? b.id] ?? 0);
        break;
      case 'status':
        cmp = (STATUS_LABELS[a.status] ?? '').localeCompare(STATUS_LABELS[b.status] ?? '');
        break;
      default:
        cmp = a.name.localeCompare(b.name);
    }
    return dir === 'desc' ? -cmp : cmp;
  });
}

export function addedStr(createdAt: string | null): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
