"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Heart, SearchX } from "lucide-react";
import { PageContent } from "@/components/layout/PageContent";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { FragSearch } from "@/components/ui/frag-search";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FragranceCell } from "@/components/ui/fragrance-cell";
import { FragForm } from "@/components/ui/frag-form";
import { AddToWishlistModal } from "@/components/wishlist/add-to-wishlist-modal";
import { WishlistDetailPanel } from "@/components/wishlist/wishlist-detail-panel";
import { Pagination } from "@/components/ui/pagination";
import { useUser, getFriend } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { getAccords, MONTHS, shortFragType } from "@/lib/frag-utils";
import { WISHLIST_PRIORITY_LABELS, type WishlistPriority } from "@/types";
import type { UserFragrance, CommunityFrag, FragranceStatus } from "@/types";

// ── Constants ─────────────────────────────────────────────

const WISHLIST_STATUSES = new Set<FragranceStatus>([
  "WANT_TO_BUY",
  "WANT_TO_SMELL",
  "WANT_TO_IDENTIFY",
]);

type WishlistSortField = "fragrance" | "date_added" | "priority";

const SORT_FIELD_OPTIONS = [
  { value: "fragrance", label: "Fragrance" },
  { value: "date_added", label: "Date Added" },
  { value: "priority", label: "Priority" },
];

const PRIORITY_FILTER_OPTIONS = [
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

const PRIORITY_ORDER: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

const cellStyle = {
  fontSize: "var(--text-xs)",
  letterSpacing: "var(--tracking-md)",
  color: "var(--color-navy)",
} as const;

const WISHLIST_GRID_COLS = "max-content 100px 110px 200px 240px";
const WISHLIST_HEADERS = ["Fragrance", "Priority", "Date Added", "Accords", "Notes"];

// ── Helpers ───────────────────────────────────────────────

function addedStr(createdAt: string | null): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getCF(frag: UserFragrance, communityFrags: CommunityFrag[]): CommunityFrag | null {
  if (frag.fragranceId) {
    const hit = communityFrags.find((c) => c.fragranceId === frag.fragranceId);
    if (hit) return hit;
  }
  const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    communityFrags.find(
      (c) =>
        norm(c.fragranceName) === norm(frag.name) &&
        norm(c.fragranceHouse) === norm(frag.house),
    ) ?? null
  );
}

// ── Discover card ─────────────────────────────────────────

interface DiscoverCardProps {
  name: string;
  house: string;
  rating: string | null;
  priceRange: string | null;
  matchNote: string;
  onWishlist: boolean;
  onAdd: () => void;
}

function DiscoverCard({ name, house, rating, priceRange, matchNote, onWishlist, onAdd }: DiscoverCardProps) {
  const ratingNum = rating ? parseFloat(rating) : null;
  return (
    <div
      style={{
        width: "180px",
        flexShrink: 0,
        background: "var(--color-cream)",
        border: "1px solid var(--color-sand-light)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", letterSpacing: "var(--tracking-md)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
        {house}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "var(--text-note)",
          fontStyle: "italic",
          color: "var(--color-navy)",
          fontWeight: 400,
          lineHeight: 1.25,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        } as React.CSSProperties}
      >
        {name}
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)" }}>
        {ratingNum ? `${ratingNum.toFixed(1)} ★` : ""}
        {ratingNum && priceRange ? " · " : ""}
        {priceRange ?? ""}
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontStyle: "italic", color: "var(--color-meta-text)", flex: 1 }}>
        {matchNote}
      </div>
      {onWishlist ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-xs)",
            color: "var(--color-navy)",
          }}
        >
          ✓ On Wishlist
        </div>
      ) : (
        <Button variant="primary" size="sm" onClick={onAdd} style={{ width: "100%" }}>
          WISHLIST
        </Button>
      )}
    </div>
  );
}

// ── Discover row ──────────────────────────────────────────

function DiscoverRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "var(--space-8)" }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--font-weight-medium)",
          letterSpacing: "var(--tracking-md)",
          textTransform: "uppercase",
          color: "var(--color-meta-text)",
          marginBottom: "var(--space-3)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          overflowX: "auto",
          paddingBottom: "var(--space-2)",
        }}
        className="scrollbar-thin scrollbar-thumb-[var(--color-cream-dark)] scrollbar-track-transparent"
      >
        {children}
      </div>
    </div>
  );
}

// ── Priority badge ────────────────────────────────────────

function PriorityBadge({ priority }: { priority: WishlistPriority | null }) {
  if (!priority) return <span className="font-sans uppercase" style={cellStyle}>—</span>;
  const { label } = WISHLIST_PRIORITY_LABELS[priority];
  return <span className="font-sans uppercase" style={cellStyle}>{label}</span>;
}

// ── Notes cell ────────────────────────────────────────────

function NotesCell({ cf }: { cf: CommunityFrag | null }) {
  const noteStyle = { fontSize: "var(--text-xxs)", color: "var(--color-notes-text)" } as const;
  if (!cf) return <span className="font-sans" style={noteStyle}>—</span>;
  const rows = [
    { label: "TOP", notes: cf.topNotes },
    { label: "HEART", notes: cf.middleNotes },
    { label: "BASE", notes: cf.baseNotes },
  ].filter((r) => r.notes?.length);
  if (!rows.length) return <span className="font-sans" style={noteStyle}>—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      {rows.map(({ label, notes }) => (
        <div key={label} style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline" }}>
          <span className="font-sans uppercase" style={{ fontSize: "var(--text-xxs)", fontWeight: "var(--font-weight-medium)", letterSpacing: "var(--tracking-md)", color: "var(--color-meta-text)", flexShrink: 0, width: "36px" }}>
            {label}
          </span>
          <span className="font-sans" style={{ ...noteStyle, lineHeight: 1.4 }}>
            {notes!.join(", ")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Table row skeleton ────────────────────────────────────

const SKELETON_ROW_HEIGHT = "var(--size-row-min)";

function WishlistGridShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="hidden md:grid"
      style={{ gridTemplateColumns: WISHLIST_GRID_COLS, columnGap: "var(--space-10)" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          background: "var(--color-cream-dark)",
          borderBottom: "1px solid var(--color-row-divider)",
          height: "var(--space-10)",
          alignItems: "center",
        }}
      >
        {WISHLIST_HEADERS.map((h, i) => (
          <div
            key={i}
            className="font-sans uppercase"
            style={{
              padding: "0 var(--space-4)",
              fontSize: "var(--text-xxs)",
              fontWeight: "var(--font-weight-medium)",
              letterSpacing: "var(--tracking-md)",
              color: "var(--color-navy)",
            }}
          >
            {h}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "subgrid",
        gridColumn: "1 / -1",
        alignItems: "center",
        minHeight: SKELETON_ROW_HEIGHT,
        borderBottom: "1px solid var(--color-row-divider)",
        background: "var(--color-row-hover)",
      }}
    >
      <div style={{ padding: "0 var(--space-4)" }}>
        <Skeleton className="h-4 w-36 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div style={{ padding: "0 var(--space-4)" }}><Skeleton className="h-4 w-14" /></div>
      <div style={{ padding: "0 var(--space-4)" }}><Skeleton className="h-4 w-16" /></div>
      <div style={{ padding: "0 var(--space-4)" }}><Skeleton className="h-4 w-28" /></div>
      <div style={{ padding: "0 var(--space-4)" }}><Skeleton className="h-10 w-32" /></div>
    </div>
  );
}

// ── Row actions ───────────────────────────────────────────

// ── Mobile card ───────────────────────────────────────────

function WishlistMobileCard({
  frag,
  cf,
  onClick,
  onMoveToCollection,
  onRemove,
}: {
  frag: UserFragrance;
  cf: CommunityFrag | null;
  onClick: () => void;
  onMoveToCollection: (f: UserFragrance) => void;
  onRemove: (f: UserFragrance) => void;
}) {
  const accords = cf?.fragranceAccords?.slice(0, 4) ?? [];

  return (
    <div
      style={{
        background: "var(--color-cream)",
        border: "1px solid var(--color-sand-light)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        marginBottom: "var(--space-2)",
      }}
    >
      <Button
        variant="ghost"
        onClick={onClick}
        style={{ display: "block", width: "100%", textAlign: "left", padding: 0, minHeight: 0, height: "auto" }}
      >
        <div style={{ marginBottom: "var(--space-2)" }}>
          <FragranceCell name={frag.name} house={frag.house} type={frag.type ?? null} isDupe={frag.isDupe} dupeFor={frag.dupeFor || undefined} />
        </div>
        {frag.wishlistPriority && (
          <div style={{ marginTop: "var(--space-2)" }}>
            <PriorityBadge priority={frag.wishlistPriority} />
          </div>
        )}
        {accords.length > 0 && (
          <div style={{ marginTop: "var(--space-2)" }}>
            <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-navy)", lineHeight: "var(--leading-relaxed)" }}>
              {accords.join(", ")}
            </span>
          </div>
        )}
      </Button>
      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        <Button variant="primary" size="sm" onClick={() => onMoveToCollection(frag)} style={{ flex: 1 }}>
          Move to Collection
        </Button>
        <Button variant="destructive" size="sm" aria-label="Remove from wishlist" onClick={() => onRemove(frag)}>×</Button>
      </div>
    </div>
  );
}

// ── Inner page ────────────────────────────────────────────

function WishlistInner() {
  const { user, profiles } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded, removeFrag, editFrag, addFrag } = useData();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawSort = searchParams.get("sort");
  const lastUnderscore = (rawSort ?? "").lastIndexOf("_");
  const sortField = (lastUnderscore > -1 ? rawSort!.slice(0, lastUnderscore) : "fragrance") as WishlistSortField;
  const sortDir = (lastUnderscore > -1 ? rawSort!.slice(lastUnderscore + 1) : "asc") as "asc" | "desc";

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("any");
  const [wishlistStatusFilter, setWishlistStatusFilter] = useState("any");
  const [addOpen, setAddOpen] = useState(false);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [moveFormFrag, setMoveFormFrag] = useState<UserFragrance | null>(null);
  const [moveFormOpen, setMoveFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const pushSort = useCallback(
    (field: WishlistSortField, dir: "asc" | "desc") => {
      const key = `${field}_${dir}`;
      const params = new URLSearchParams(searchParams.toString());
      if (key !== "fragrance_asc") params.set("sort", key);
      else params.delete("sort");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const handleSortField = useCallback((v: string) => pushSort(v as WishlistSortField, sortDir), [pushSort, sortDir]);
  const handleToggleSortDir = useCallback(() => pushSort(sortField, sortDir === "asc" ? "desc" : "asc"), [pushSort, sortField, sortDir]);

  if (!user) return null;

  const MF = fragrances.filter((f) => f.userId === user.id);
  const wishlist = MF.filter((f) => WISHLIST_STATUSES.has(f.status));

  const ownedKeys = new Set(MF.map((f) => (f.fragranceId ?? f.name.toLowerCase())));

  const friend = getFriend(user, profiles);
  const friendName = friend?.name ?? "Friend";

  const cfMap = useMemo(() => {
    const m = new Map<string, CommunityFrag | null>();
    wishlist.forEach((f) => m.set(f.id, getCF(f, communityFrags)));
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrances, communityFrags, user.id]);

  const filtersActive = priorityFilter !== "any" || wishlistStatusFilter !== "any";

  function clearFilters() {
    setPriorityFilter("any");
    setWishlistStatusFilter("any");
  }

  const filtered = useMemo(() => {
    let list = wishlist;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q));
    }
    if (priorityFilter !== "any") list = list.filter((f) => f.wishlistPriority === priorityFilter);
    if (wishlistStatusFilter !== "any") list = list.filter((f) => f.status === wishlistStatusFilter);
    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "fragrance": cmp = a.name.localeCompare(b.name); break;
        case "date_added": cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? ""); break;
        case "priority":
          cmp = (PRIORITY_ORDER[a.wishlistPriority ?? ""] ?? 0) - (PRIORITY_ORDER[b.wishlistPriority ?? ""] ?? 0);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrances, search, sortField, sortDir, cfMap, priorityFilter, wishlistStatusFilter]);

  const topAccords = useMemo(() => {
    const counts: Record<string, number> = {};
    MF.filter((f) => f.status === "CURRENT").forEach((f) => {
      getAccords(f, communityFrags).forEach((a) => { counts[a] = (counts[a] ?? 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrances, communityFrags, user.id]);

  const friendDiscover = useMemo(() => {
    if (!friend) return [];
    const FF = fragrances.filter((f) => f.userId === friend.id && (f.status === "CURRENT" || f.status === "PREVIOUSLY_OWNED"));
    const friendCompCounts: Record<string, number> = {};
    compliments.filter((c) => c.userId === friend.id).forEach((c) => {
      if (c.primaryFragId) friendCompCounts[c.primaryFragId] = (friendCompCounts[c.primaryFragId] ?? 0) + 1;
    });
    return FF
      .filter((f) => !ownedKeys.has(f.fragranceId ?? f.name.toLowerCase()))
      .sort((a, b) => (friendCompCounts[b.fragranceId ?? b.id] ?? 0) - (friendCompCounts[a.fragranceId ?? a.id] ?? 0))
      .slice(0, 6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrances, compliments, friend?.id, ownedKeys]);

  const accordDiscover = useMemo(() => {
    if (topAccords.length === 0) return [];
    return communityFrags
      .filter((cf) => {
        const key = cf.fragranceId ?? cf.fragranceName.toLowerCase();
        if (ownedKeys.has(key)) return false;
        return topAccords.some((a) => cf.fragranceAccords?.includes(a));
      })
      .slice(0, 6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityFrags, topAccords, ownedKeys]);

  const qualityDiscover = useMemo(() => {
    return communityFrags
      .filter((cf) => {
        const key = cf.fragranceId ?? cf.fragranceName.toLowerCase();
        if (ownedKeys.has(key)) return false;
        return parseFloat(cf.communityRating ?? "0") >= 4.0;
      })
      .sort((a, b) => parseFloat(b.communityRating ?? "0") - parseFloat(a.communityRating ?? "0"))
      .slice(0, 6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityFrags, ownedKeys]);

  useEffect(() => { setPage(1); }, [search, sortField, sortDir, priorityFilter, wishlistStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const paginated = useMemo(
    () => pageSize === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  function wishlistKeySet(): Set<string> {
    return new Set(wishlist.map((f) => f.fragranceId ?? f.name.toLowerCase()));
  }

  async function handleAddToWishlistFromDiscover(name: string, house: string, fragranceId?: string) {
    if (!user) return;
    try {
      await addFrag({
        id: "w" + Date.now().toString(36),
        fragranceId: fragranceId ?? null,
        userId: user.id,
        name,
        house,
        status: "WANT_TO_BUY",
        sizes: [],
        type: null,
        personalRating: null,
        statusRating: null,
        whereBought: null,
        purchaseDate: null,
        purchaseMonth: null,
        purchaseYear: null,
        purchasePrice: null,
        isDupe: false,
        dupeFor: "",
        personalNotes: "",
        createdAt: new Date().toISOString(),
        wishlistPriority: null,
      });
      toast("Added to wishlist", "success");
    } catch {
      toast("Failed to add", "error");
    }
  }

  function openMoveToCollection(frag: UserFragrance) {
    setMoveFormFrag({ ...frag, status: "CURRENT" });
    setMoveFormOpen(true);
  }

  async function handleRemove(frag: UserFragrance) {
    await removeFrag(frag.id);
    toast("Removed from wishlist", "success");
  }

  const wKeys = wishlistKeySet();

  return (
    <>
      <WishlistDetailPanel
        frag={detailFrag}
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        communityFrags={communityFrags}
        onAddToCollection={openMoveToCollection}
        onRemove={handleRemove}
      />

      <AddToWishlistModal open={addOpen} onClose={() => setAddOpen(false)} />

      {moveFormFrag && (
        <FragForm
          open={moveFormOpen}
          onClose={() => { setMoveFormOpen(false); setMoveFormFrag(null); }}
          editing={moveFormFrag}
        />
      )}

      <Topbar title="Wishlist" actions={<FragSearch />} />
      <PageContent>
        <PageHeader
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Search your wishlist..."
          addLabel="Add to Wishlist"
          onAdd={() => setAddOpen(true)}
          sortFields={SORT_FIELD_OPTIONS}
          sortField={sortField}
          onSortField={handleSortField}
          sortDir={sortDir}
          onSortDir={handleToggleSortDir}
          filterDropdowns={[
            { value: priorityFilter, onChange: ((v: string | string[]) => setPriorityFilter(typeof v === 'string' ? v : 'any')) as (v: string | string[]) => void, options: PRIORITY_FILTER_OPTIONS },
            { value: wishlistStatusFilter, onChange: ((v: string | string[]) => setWishlistStatusFilter(typeof v === 'string' ? v : 'any')) as (v: string | string[]) => void, options: WISHLIST_STATUS_OPTIONS },
          ]}
          filtersActive={filtersActive}
          onClearFilters={clearFilters}
          perPage={pageSize}
          onPerPage={(v) => { setPageSize(v); setPage(1); }}
          count={isLoaded ? filtered.length : undefined}
          countLabel="Item"
          isLoaded={isLoaded}
        />

        {/* Content */}
        {!isLoaded ? (
          <WishlistGridShell>
            {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
          </WishlistGridShell>
        ) : wishlist.length === 0 ? (
          <EmptyState
            icon={<Heart size={48} />}
            title="Your wishlist is empty"
            description="Save fragrances you want to explore."
            action={
              <Button variant="primary" onClick={() => setAddOpen(true)}>
                Add to Wishlist
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<SearchX size={48} />}
            title="No matches"
            description="Try a different search."
            action={
              <Button variant="ghost" onClick={() => setSearch("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop grid */}
            <WishlistGridShell>
              {paginated.map((frag) => {
                const cf = cfMap.get(frag.id) ?? null;
                const accords = cf?.fragranceAccords?.slice(0, 4) ?? [];
                const extra = (cf?.fragranceAccords?.length ?? 0) > 4 ? (cf!.fragranceAccords.length - 4) : 0;
                const added = addedStr(frag.createdAt);
                return (
                  <div
                    key={frag.id}
                    onClick={() => setDetailFrag(frag)}
                    className="cursor-pointer hover-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "subgrid",
                      gridColumn: "1 / -1",
                      alignItems: "center",
                      minHeight: "var(--size-row-min)",
                      borderBottom: "1px solid var(--color-row-divider)",
                    }}
                  >
                    <div style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <FragranceCell name={frag.name} house={frag.house} type={frag.type} isDupe={frag.isDupe} dupeFor={frag.dupeFor || undefined} />
                    </div>
                    <div style={{ padding: "0 var(--space-4)" }}>
                      <PriorityBadge priority={frag.wishlistPriority} />
                    </div>
                    <div style={{ padding: "0 var(--space-4)" }}>
                      <span className="font-sans uppercase" style={{ ...cellStyle, whiteSpace: "nowrap" }}>{added || "—"}</span>
                    </div>
                    <div style={{ padding: "0 var(--space-4)" }}>
                      <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-navy)", lineHeight: "var(--leading-relaxed)" }}>
                        {accords.length ? accords.join(", ") + (extra > 0 ? `, +${extra} more` : "") : "—"}
                      </span>
                    </div>
                    <div style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <NotesCell cf={cf} />
                    </div>
                  </div>
                );
              })}
            </WishlistGridShell>

            {/* Pagination */}
            <Pagination
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPage={setPage}
            />

            {/* Mobile cards */}
            <div className="md:hidden">
              {paginated.map((frag) => (
                <WishlistMobileCard
                  key={frag.id}
                  frag={frag}
                  cf={cfMap.get(frag.id) ?? null}
                  onClick={() => setDetailFrag(frag)}
                  onMoveToCollection={openMoveToCollection}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </>
        )}

        {/* ── DISCOVER SECTION ── */}
        {isLoaded && (
          <div style={{ marginTop: "var(--space-12)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-empty-title)", fontStyle: "italic", fontWeight: 400, color: "var(--color-navy)", marginBottom: "var(--space-6)" }}>
              Discover
            </h2>

            {friendDiscover.length > 0 && (
              <DiscoverRow title={`From ${friendName}'s Collection`}>
                {friendDiscover.map((frag) => {
                  const key = frag.fragranceId ?? frag.name.toLowerCase();
                  const cf = getCF(frag, communityFrags);
                  return (
                    <DiscoverCard
                      key={frag.id}
                      name={frag.name}
                      house={frag.house}
                      rating={cf?.communityRating ?? null}
                      priceRange={cf?.avgPrice ?? null}
                      matchNote={`In ${friendName}'s collection`}
                      onWishlist={wKeys.has(key)}
                      onAdd={() => handleAddToWishlistFromDiscover(frag.name, frag.house, frag.fragranceId ?? undefined)}
                    />
                  );
                })}
              </DiscoverRow>
            )}

            {accordDiscover.length > 0 && (
              <DiscoverRow title="Matches Your Top Notes">
                {accordDiscover.map((cf) => {
                  const key = cf.fragranceId ?? cf.fragranceName.toLowerCase();
                  return (
                    <DiscoverCard
                      key={cf.fragranceId}
                      name={cf.fragranceName}
                      house={cf.fragranceHouse}
                      rating={cf.communityRating ?? null}
                      priceRange={cf.avgPrice ?? null}
                      matchNote="Matches your top notes"
                      onWishlist={wKeys.has(key)}
                      onAdd={() => handleAddToWishlistFromDiscover(cf.fragranceName, cf.fragranceHouse, cf.fragranceId)}
                    />
                  );
                })}
              </DiscoverRow>
            )}

            {qualityDiscover.length > 0 && (
              <DiscoverRow title="Quality Picks">
                {qualityDiscover.map((cf) => {
                  const key = cf.fragranceId ?? cf.fragranceName.toLowerCase();
                  return (
                    <DiscoverCard
                      key={cf.fragranceId}
                      name={cf.fragranceName}
                      house={cf.fragranceHouse}
                      rating={cf.communityRating ?? null}
                      priceRange={cf.avgPrice ?? null}
                      matchNote={`Community rating ${parseFloat(cf.communityRating ?? "0").toFixed(1)} ★`}
                      onWishlist={wKeys.has(key)}
                      onAdd={() => handleAddToWishlistFromDiscover(cf.fragranceName, cf.fragranceHouse, cf.fragranceId)}
                    />
                  );
                })}
              </DiscoverRow>
            )}
          </div>
        )}
      </PageContent>
    </>
  );
}

export default function WishlistPage() {
  return (
    <Suspense>
      <WishlistInner />
    </Suspense>
  );
}
