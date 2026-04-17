"use client";

import { useState, useEffect, useMemo } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContent } from "@/components/layout/PageContent";
import { FragSearch } from "@/components/ui/frag-search";
import { FragranceCell } from "@/components/ui/fragrance-cell";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { TabPill } from "@/components/ui/tab-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { FlaskConical, MessageCircle, Star, Users } from "lucide-react";
import { FragDetail } from "@/components/ui/frag-detail";
import { AccordCloud } from "@/components/ui/accord-cloud";
import { Pagination } from "@/components/ui/pagination";
import { PageFilterBar } from "@/components/ui/page-filter-bar";
import { useUser, getFriend } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { loadAllData } from "@/lib/data";
import { MONTHS, getAccords, monthNum } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import { CompareView } from "@/components/analytics/comparative-view";
import {
  applySort,
  SORT_FIELD_OPTIONS,
  RATING_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type SortField,
  type SortDir,
} from "@/lib/collection-utils";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";

type FriendTab = "collection" | "compliments" | "wishlist" | "incommon" | "analytics";

const FRIEND_TABS: { label: string; value: FriendTab }[] = [
  { label: "Collection", value: "collection" },
  { label: "Compliments", value: "compliments" },
  { label: "Wishlist", value: "wishlist" },
  { label: "In Common", value: "incommon" },
  { label: "Analytics", value: "analytics" },
];

const COLLECTION_STATUS_OPTIONS = [
  { value: "any", label: "Any status" },
  ...STATUS_FILTER_OPTIONS.filter((o) => o.value !== "all"),
];

const WISHLIST_PRIORITY_OPTIONS = [
  { value: "any", label: "Any priority" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const WISHLIST_STATUS_OPTIONS = [
  { value: "any", label: "Any status" },
  { value: "WANT_TO_BUY", label: "Want to Buy" },
  { value: "WANT_TO_SMELL", label: "Want to Smell" },
  { value: "WANT_TO_IDENTIFY", label: "Identify Later" },
];

const COMP_SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "fragrance", label: "Fragrance" },
];

/* component-internal: skeleton row height */
const SKELETON_ROW_HEIGHT = 'var(--size-row-min)';

const cellStyle = {
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-md)',
  color: 'var(--color-navy)',
} as const;

const metaStyle = {
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-md)',
  color: 'var(--color-meta-text)',
} as const;

const headerCellStyle = {
  padding: '0 var(--space-4)',
  fontSize: 'var(--text-xxs)',
  fontWeight: 'var(--font-weight-medium)',
  letterSpacing: 'var(--tracking-md)',
  color: 'var(--color-navy)',
} as const;

const countLabel = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-weight-medium)',
  letterSpacing: 'var(--tracking-md)',
  color: 'var(--color-meta-text)',
  marginBottom: 'var(--space-4)',
} as const;

const headerRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'subgrid',
  gridColumn: '1 / -1',
  background: 'var(--color-cream-dark)',
  borderBottom: '1px solid var(--color-row-divider)',
  height: 'var(--space-10)',
  alignItems: 'center',
} as const;

const dataRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'subgrid',
  gridColumn: '1 / -1',
  alignItems: 'center',
  minHeight: 'var(--space-16)',
  borderBottom: '1px solid var(--color-row-divider)',
} as const;

export default function FriendPage() {
  const { user, profiles } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded } = useData();
  const [tab, setTab] = useState<FriendTab>("collection");
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [friendFragrances, setFriendFragrances] = useState<UserFragrance[]>([]);
  const [friendCompliments, setFriendCompliments] = useState<UserCompliment[]>([]);

  const friend = user ? getFriend(user, profiles) : null;

  useEffect(() => {
    if (!friend) return;
    loadAllData(friend.id).then(({ data }) => {
      setFriendFragrances(data.fragrances);
      setFriendCompliments(data.compliments);
    });
  }, [friend?.id]);

  if (!user) return null;
  if (!friend) return null;

  const friendName = friend.name;

  const MF = fragrances.filter((f) => f.userId === user.id);
  const FF = friendFragrances;
  const FC = friendCompliments;

  const FFOwned = FF.filter(
    (f) => f.status === "CURRENT" || f.status === "PREVIOUSLY_OWNED" || f.status === "FINISHED"
  );
  const FFWish = FF.filter(
    (f) => f.status === "WANT_TO_BUY" || f.status === "WANT_TO_SMELL"
  );

  const myCurrentNames = new Set(
    MF.filter((f) => f.status === "CURRENT").map((f) => f.name.toLowerCase())
  );
  const inCommon = FF.filter(
    (f) => f.status === "CURRENT" && myCurrentNames.has(f.name.toLowerCase())
  );

  const friendAccordCounts: [string, number][] = (() => {
    const counts: Record<string, number> = {};
    FFOwned.forEach((f) => {
      getAccords(f, communityFrags).forEach((a) => {
        counts[a] = (counts[a] ?? 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  })();

  return (
    <>
      <FragDetail
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        frag={detailFrag}
        communityFrags={communityFrags}
        compliments={FC}
        userId={friend.id}
        readOnly
      />
      <Topbar title={`${friendName}'s Profile`} actions={<FragSearch />} />
      <PageContent>
        {!isLoaded ? (
          <FriendSkeleton />
        ) : (
          <>
            <StatsGrid className="mb-6">
              <StatBox value={FFOwned.length} label="Collection" />
              <StatBox value={FC.length} label="Compliments" />
              <StatBox value={FFWish.length} label="Wishlist" />
              <StatBox value={inCommon.length} label="In Common" />
            </StatsGrid>

            {friendAccordCounts.length > 0 && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div className="font-sans uppercase" style={countLabel}>
                  Scent Signature — {friendName}'s Accords
                </div>
                <AccordCloud accords={friendAccordCounts} />
              </div>
            )}

            <div className="flex flex-wrap gap-2" style={{ marginBottom: 'var(--space-6)' }}>
              {FRIEND_TABS.map((t) => (
                <TabPill
                  key={t.value}
                  label={t.label}
                  active={tab === t.value}
                  onClick={() => setTab(t.value)}
                />
              ))}
            </div>

            {tab === "collection" && (
              <FriendCollectionTab
                frags={FFOwned}
                compliments={FC}
                communityFrags={communityFrags}
                onFragClick={setDetailFrag}
              />
            )}
            {tab === "compliments" && (
              <FriendComplimentsTab compliments={FC} frags={FF} />
            )}
            {tab === "wishlist" && (
              <FriendWishlistTab frags={FFWish} communityFrags={communityFrags} />
            )}
            {tab === "incommon" && (
              <InCommonTab
                frags={inCommon}
                myFrags={MF}
                compliments={[...compliments, ...friendCompliments]}
                communityFrags={communityFrags}
                userId={user.id}
                friendId={friend.id}
                friendName={friendName}
              />
            )}
            {tab === "analytics" && (
              <CompareView
                myFrags={MF}
                myComps={compliments.filter((c) => c.userId === user.id)}
                friendFrags={FF}
                friendComps={FC}
                myName={user.name ?? "Me"}
                friendName={friendName}
              />
            )}
          </>
        )}
      </PageContent>
    </>
  );
}

function FriendCollectionTab({
  frags,
  compliments,
  communityFrags,
  onFragClick,
}: {
  frags: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  onFragClick: (frag: UserFragrance) => void;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("fragrance");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [accordFilter, setAccordFilter] = useState("any");
  const [ratingFilter, setRatingFilter] = useState("any");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const compMap = useMemo(() => {
    const map: Record<string, number> = {};
    compliments.forEach((c) => {
      if (c.primaryFragId) map[c.primaryFragId] = (map[c.primaryFragId] ?? 0) + 1;
    });
    return map;
  }, [compliments]);

  const accordOptions = useMemo(() => {
    const s = new Set<string>();
    frags.forEach((f) => getAccords(f, communityFrags).forEach((a) => s.add(a)));
    return [{ value: "any", label: "Any accord" }, ...Array.from(s).sort().map((a) => ({ value: a, label: a }))];
  }, [frags, communityFrags]);

  const filtered = useMemo(() => {
    let list = frags;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q));
    }
    if (accordFilter !== "any") {
      list = list.filter((f) => getAccords(f, communityFrags).includes(accordFilter));
    }
    if (ratingFilter !== "any") {
      list = list.filter((f) => {
        const r = f.personalRating ?? 0;
        if (ratingFilter === "5") return r === 5;
        if (ratingFilter === "4plus") return r >= 4;
        if (ratingFilter === "3plus") return r >= 3;
        if (ratingFilter === "1to2") return r >= 1 && r <= 2;
        if (ratingFilter === "unrated") return !r;
        return true;
      });
    }
    if (statusFilter.length > 0) {
      list = list.filter((f) => statusFilter.includes(f.status));
    }
    return applySort(list, sortField, sortDir, compMap);
  }, [frags, search, accordFilter, ratingFilter, statusFilter, sortField, sortDir, compMap, communityFrags]);

  const filtersActive = accordFilter !== "any" || ratingFilter !== "any" || statusFilter.length > 0;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageFrags = filtered.slice((page - 1) * perPage, page * perPage);
  const gridCols = 'minmax(200px,1fr) max-content max-content 180px max-content';

  function clearFilters() {
    setAccordFilter("any");
    setRatingFilter("any");
    setStatusFilter([]);
  }

  if (frags.length === 0) {
    return <EmptyState icon={<FlaskConical size={48} />} title="No fragrances" />;
  }

  return (
    <>
      <PageFilterBar
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search collection..."
        sortFields={SORT_FIELD_OPTIONS}
        sortField={sortField}
        onSortField={(v) => { setSortField(v as SortField); setPage(1); }}
        sortDir={sortDir}
        onSortDir={() => { setSortDir((d) => d === "asc" ? "desc" : "asc"); setPage(1); }}
        filters={[
          { value: accordFilter, onChange: (v) => { setAccordFilter(v); setPage(1); }, options: accordOptions },
          { value: ratingFilter, onChange: (v) => { setRatingFilter(v); setPage(1); }, options: RATING_FILTER_OPTIONS },
        ]}
        filtersActive={filtersActive}
        onClearFilters={clearFilters}
        perPage={perPage}
        onPerPage={(v) => { setPerPage(v); setPage(1); }}
        count={filtered.length}
        countLabel="Fragrance"
        isLoaded
      />

      <div className="hidden md:grid" style={{ gridTemplateColumns: gridCols, columnGap: 'var(--space-10)' }}>
        <div style={headerRowStyle}>
          {['Fragrance', 'Rating', 'Status', 'Accords', 'Compliments'].map((label) => (
            <div key={label} className="font-sans uppercase" style={headerCellStyle}>{label}</div>
          ))}
        </div>
        {pageFrags.map((f) => {
          const comps = compliments.filter((c) => c.primaryFragId === (f.fragranceId || f.id)).length;
          const accords = getAccords(f, communityFrags).slice(0, 4).join(', ') || '—';
          return (
            <div
              key={f.id}
              onClick={() => onFragClick(f)}
              className="cursor-pointer transition-colors duration-100"
              style={dataRowStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-row-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ padding: '0 var(--space-4)', minWidth: 0 }}>
                <FragranceCell name={f.name} house={f.house} type={f.type ?? null} />
              </div>
              <div style={{ padding: '0 var(--space-4)' }}>
                <span className="font-sans uppercase" style={cellStyle}>
                  {f.personalRating ? '★'.repeat(f.personalRating) : '—'}
                </span>
              </div>
              <div style={{ padding: '0 var(--space-4)' }}>
                <span className="font-sans uppercase" style={cellStyle}>
                  {STATUS_LABELS[f.status as keyof typeof STATUS_LABELS] ?? f.status}
                </span>
              </div>
              <div style={{ padding: '0 var(--space-4)', minWidth: 0 }}>
                <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', lineHeight: 'var(--leading-relaxed)' }}>
                  {accords}
                </span>
              </div>
              <div style={{ padding: '0 var(--space-4)' }}>
                <span className="font-sans uppercase" style={{ ...cellStyle, color: comps > 0 ? 'var(--color-navy)' : 'var(--color-meta-text)' }}>
                  {comps > 0 ? comps : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="md:hidden">
        {pageFrags.map((f) => {
          const comps = compliments.filter((c) => c.primaryFragId === (f.fragranceId || f.id)).length;
          const accords = getAccords(f, communityFrags).slice(0, 3).join(', ');
          return (
            <div
              key={f.id}
              onClick={() => onFragClick(f)}
              className="cursor-pointer"
              style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-row-divider)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-row-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FragranceCell name={f.name} house={f.house} type={f.type ?? null} />
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {f.personalRating ? (
                  <span className="font-sans uppercase" style={metaStyle}>{'★'.repeat(f.personalRating)}</span>
                ) : null}
                <span className="font-sans uppercase" style={metaStyle}>
                  {STATUS_LABELS[f.status as keyof typeof STATUS_LABELS] ?? f.status}
                </span>
                {comps > 0 ? (
                  <span className="font-sans uppercase" style={{ ...metaStyle, color: 'var(--color-accent)' }}>
                    {comps} comp{comps !== 1 ? 's' : ''}
                  </span>
                ) : null}
                {accords ? (
                  <span className="font-sans" style={metaStyle}>{accords}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </>
  );
}

function FriendComplimentsTab({
  compliments,
  frags,
}: {
  compliments: UserCompliment[];
  frags: UserFragrance[];
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let list = compliments;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => {
        const frag = frags.find((f) => (f.fragranceId || f.id) === c.primaryFragId);
        const name = frag?.name ?? c.primaryFrag ?? "";
        return name.toLowerCase().includes(q) || (c.notes ?? "").toLowerCase().includes(q);
      });
    }
    return list.slice().sort((a, b) => {
      if (sortField === "date") {
        const aVal = parseInt(a.year) * 100 + monthNum(a.month);
        const bVal = parseInt(b.year) * 100 + monthNum(b.month);
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
      }
      // fragrance
      const aFrag = frags.find((f) => (f.fragranceId || f.id) === a.primaryFragId);
      const bFrag = frags.find((f) => (f.fragranceId || f.id) === b.primaryFragId);
      const aName = aFrag?.name ?? a.primaryFrag ?? "";
      const bName = bFrag?.name ?? b.primaryFrag ?? "";
      const cmp = aName.localeCompare(bName);
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [compliments, frags, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);
  const gridCols = 'minmax(180px,1fr) max-content max-content max-content';

  if (compliments.length === 0) {
    return <EmptyState icon={<MessageCircle size={48} />} title="No compliments yet" />;
  }

  return (
    <>
      <PageFilterBar
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search compliments..."
        sortFields={COMP_SORT_OPTIONS}
        sortField={sortField}
        onSortField={(v) => { setSortField(v); setPage(1); }}
        sortDir={sortDir}
        onSortDir={() => { setSortDir((d) => d === "asc" ? "desc" : "asc"); setPage(1); }}
        filtersActive={false}
        perPage={perPage}
        onPerPage={(v) => { setPerPage(v); setPage(1); }}
        count={filtered.length}
        countLabel="Compliment"
        isLoaded
      />

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, columnGap: 'var(--space-10)' }}>
        <div style={headerRowStyle}>
          {['Fragrance', 'Relation', 'When', 'Location'].map((label) => (
            <div key={label} className="font-sans uppercase" style={headerCellStyle}>{label}</div>
          ))}
        </div>
        {pageItems.map((c) => {
          const frag = frags.find((f) => (f.fragranceId || f.id) === c.primaryFragId);
          const fragName = frag?.name ?? c.primaryFrag ?? '\u2014';
          const fragHouse = frag?.house ?? '';
          const mn = monthNum(c.month);
          const mLabel = mn >= 1 && mn <= 12 ? MONTHS[mn - 1] : c.month;
          const when = c.year ? `${mLabel} ${c.year}` : mLabel;
          const location = [c.city, c.country].filter(Boolean).join(', ') || '\u2014';
          return (
            <div key={c.id} style={dataRowStyle}>
              <div style={{ padding: '0 var(--space-4)', minWidth: 0 }}>
                <FragranceCell name={fragName} house={fragHouse || undefined} />
              </div>
              <div style={{ padding: '0 var(--space-4)' }}>
                <span className="font-sans uppercase" style={cellStyle}>{c.relation}</span>
              </div>
              <div style={{ padding: '0 var(--space-4)' }}>
                <span className="font-sans uppercase" style={cellStyle}>{when}</span>
              </div>
              <div style={{ padding: '0 var(--space-4)' }}>
                <span className="font-sans uppercase" style={cellStyle}>{location}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </>
  );
}

function FriendWishlistTab({
  frags,
  communityFrags,
}: {
  frags: UserFragrance[];
  communityFrags: CommunityFrag[];
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("fragrance");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [priorityFilter, setPriorityFilter] = useState("any");
  const [wishlistStatusFilter, setWishlistStatusFilter] = useState("any");

  const PRIORITY_ORDER: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  const filtered = useMemo(() => {
    let list = frags;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q));
    }
    if (priorityFilter !== "any") {
      list = list.filter((f) => (f as UserFragrance & { priority?: string }).priority === priorityFilter);
    }
    if (wishlistStatusFilter !== "any") {
      list = list.filter((f) => f.status === wishlistStatusFilter);
    }
    return list.slice().sort((a, b) => {
      let cmp = 0;
      if (sortField === "fragrance") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "date_added") {
        cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      } else if (sortField === "priority") {
        const ap = PRIORITY_ORDER[(a as UserFragrance & { priority?: string }).priority ?? ""] ?? 0;
        const bp = PRIORITY_ORDER[(b as UserFragrance & { priority?: string }).priority ?? ""] ?? 0;
        cmp = ap - bp;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [frags, search, priorityFilter, wishlistStatusFilter, sortField, sortDir]);

  const filtersActive = priorityFilter !== "any" || wishlistStatusFilter !== "any";
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageFrags = filtered.slice((page - 1) * perPage, page * perPage);
  const gridCols = 'minmax(200px,1fr) max-content 180px';

  const WISHLIST_SORT_OPTIONS = [
    { value: "fragrance", label: "Fragrance" },
    { value: "date_added", label: "Date Added" },
    { value: "priority", label: "Priority" },
  ];

  function clearFilters() {
    setPriorityFilter("any");
    setWishlistStatusFilter("any");
  }

  if (frags.length === 0) {
    return <EmptyState icon={<Star size={48} />} title="No wishlist items" />;
  }

  return (
    <>
      <PageFilterBar
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search wishlist..."
        sortFields={WISHLIST_SORT_OPTIONS}
        sortField={sortField}
        onSortField={(v) => { setSortField(v); setPage(1); }}
        sortDir={sortDir}
        onSortDir={() => { setSortDir((d) => d === "asc" ? "desc" : "asc"); setPage(1); }}
        filters={[
          { value: priorityFilter, onChange: (v) => { setPriorityFilter(v); setPage(1); }, options: WISHLIST_PRIORITY_OPTIONS },
          { value: wishlistStatusFilter, onChange: (v) => { setWishlistStatusFilter(v); setPage(1); }, options: WISHLIST_STATUS_OPTIONS },
        ]}
        filtersActive={filtersActive}
        onClearFilters={clearFilters}
        perPage={perPage}
        onPerPage={(v) => { setPerPage(v); setPage(1); }}
        count={filtered.length}
        countLabel="Item"
        isLoaded
      />

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, columnGap: 'var(--space-10)' }}>
        <div style={headerRowStyle}>
          {['Fragrance', 'Avg Price', 'Accords'].map((label) => (
            <div key={label} className="font-sans uppercase" style={headerCellStyle}>{label}</div>
          ))}
        </div>
        {pageFrags.map((f) => {
          const accords = getAccords(f, communityFrags).slice(0, 3).join(', ') || '\u2014';
          const norm = (s: string) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const cf = communityFrags.find(
            (c) => norm(c.fragranceName) === norm(f.name) && norm(c.fragranceHouse) === norm(f.house)
          );
          const price = (cf?.avgPrice ?? '').replace(/~/g, '') || '\u2014';
          return (
            <div key={f.id} style={dataRowStyle}>
              <div style={{ padding: '0 var(--space-4)', minWidth: 0 }}>
                <FragranceCell name={f.name} house={f.house} type={f.type ?? null} />
              </div>
              <div style={{ padding: '0 var(--space-4)' }}>
                <span className="font-sans uppercase" style={cellStyle}>{price}</span>
              </div>
              <div style={{ padding: '0 var(--space-4)', minWidth: 0 }}>
                <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', lineHeight: 'var(--leading-relaxed)' }}>
                  {accords}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </>
  );
}

function InCommonTab({
  frags,
  myFrags,
  compliments,
  communityFrags,
  userId,
  friendId,
  friendName,
}: {
  frags: UserFragrance[];
  myFrags: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  userId: string;
  friendId: string;
  friendName: string;
}) {
  const [page, setPage] = useState(1);
  const sorted = frags.slice().sort((a, b) => a.name.localeCompare(b.name));
  const totalPages = Math.max(1, Math.ceil(sorted.length / 25));
  const pageFrags = sorted.slice((page - 1) * 25, page * 25);
  const gridCols = 'minmax(200px,1fr) 180px max-content';

  if (sorted.length === 0) {
    return <EmptyState icon={<Users size={48} />} title="No fragrances in common yet" />;
  }

  return (
    <>
      <div className="font-sans uppercase" style={countLabel}>
        Both own {sorted.length} {sorted.length === 1 ? 'fragrance' : 'fragrances'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, columnGap: 'var(--space-10)' }}>
        <div style={headerRowStyle}>
          {['Fragrance', 'Accords', 'Compliments'].map((label) => (
            <div key={label} className="font-sans uppercase" style={headerCellStyle}>{label}</div>
          ))}
        </div>
        {pageFrags.map((f) => {
          const myFrag = myFrags.find((mf) => mf.name.toLowerCase() === f.name.toLowerCase());
          const accords = getAccords(f, communityFrags).slice(0, 3).join(', ') || '\u2014';
          const myComps = compliments.filter(
            (c) => c.userId === userId && c.primaryFragId === (myFrag?.fragranceId || myFrag?.id)
          ).length;
          const friendComps = compliments.filter(
            (c) => c.userId === friendId && c.primaryFragId === (f.fragranceId || f.id)
          ).length;
          const compParts: string[] = [];
          if (myComps > 0) compParts.push(`You: ${myComps}`);
          if (friendComps > 0) compParts.push(`${friendName}: ${friendComps}`);
          const compDisplay = compParts.join(' · ') || '\u2014';
          return (
            <div key={f.id} style={dataRowStyle}>
              <div style={{ padding: '0 var(--space-4)', minWidth: 0 }}>
                <FragranceCell name={f.name} house={f.house} type={f.type ?? null} />
              </div>
              <div style={{ padding: '0 var(--space-4)', minWidth: 0 }}>
                <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', lineHeight: 'var(--leading-relaxed)' }}>
                  {accords}
                </span>
              </div>
              <div style={{ padding: '0 var(--space-4)' }}>
                <span className="font-sans uppercase" style={{ ...cellStyle, color: (myComps > 0 || friendComps > 0) ? 'var(--color-accent)' : 'var(--color-meta-text)' }}>
                  {compDisplay}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </>
  );
}

function FriendSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: SKELETON_ROW_HEIGHT,
            borderBottom: '1px solid var(--color-row-divider)',
            background: 'var(--color-row-hover)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-1)',
          }}
        />
      ))}
    </div>
  );
}
