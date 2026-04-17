"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Heart, SearchX } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContent } from "@/components/layout/PageContent";
import { Button } from "@/components/ui/button";
import { FragSearch } from "@/components/ui/frag-search";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
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
import type { UserFragrance, CommunityFrag, FragranceStatus } from "@/types";

// ── Constants ─────────────────────────────────────────────

const WISHLIST_STATUSES = new Set<FragranceStatus>([
  "WANT_TO_BUY",
  "WANT_TO_SMELL",
  "WANT_TO_IDENTIFY",
]);

type SortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc" | "newest";

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "price_asc", label: "Price (low-high)" },
  { value: "price_desc", label: "Price (high-low)" },
  { value: "newest", label: "Date Added (newest)" },
];

// ── Helpers ───────────────────────────────────────────────

function parsePrice(p: string | null): number {
  if (!p) return Infinity;
  const m = p.match(/\d+/);
  return m ? parseInt(m[0], 10) : Infinity;
}

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
      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", letterSpacing: "var(--tracking-md)", textTransform: "uppercase", color: "rgba(30,45,69,0.8)" }}>
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
      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "rgba(30,45,69,0.8)" }}>
        {ratingNum ? `${ratingNum.toFixed(1)} ★` : ""}
        {ratingNum && priceRange ? " · " : ""}
        {priceRange ?? ""}
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontStyle: "italic", color: "rgba(30,45,69,0.8)", flex: 1 }}>
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
        <Button variant="secondary" size="sm" onClick={onAdd} style={{ width: "100%" }}>
          + WISHLIST
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
          color: "rgba(30,45,69,0.8)",
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

// ── Table row skeleton ────────────────────────────────────

/* component-internal: skeleton row height */
const SKELETON_ROW_HEIGHT = "var(--size-row-min)";

function RowSkeleton() {
  return (
    <tr>
      <td style={{ padding: "0 var(--space-4)", height: SKELETON_ROW_HEIGHT }}>
        <Skeleton className="h-4 w-36 mb-1" />
        <Skeleton className="h-3 w-20" />
      </td>
      <td style={{ padding: "0 var(--space-4)" }}><Skeleton className="h-4 w-16" /></td>
      <td style={{ padding: "0 var(--space-4)" }}><Skeleton className="h-4 w-12" /></td>
      <td style={{ padding: "0 var(--space-4)" }}><Skeleton className="h-4 w-28" /></td>
      <td style={{ padding: "0 var(--space-4)", width: "180px" }} />
    </tr>
  );
}

// ── Row actions ───────────────────────────────────────────

function RowActions({
  frag,
  onMoveToCollection,
  onRemove,
}: {
  frag: UserFragrance;
  onMoveToCollection: (f: UserFragrance) => void;
  onRemove: (f: UserFragrance) => void;
}) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "rgba(30,45,69,0.8)" }}>Remove?</span>
        <Button variant="destructive" size="sm" onClick={() => onRemove(frag)}>
          Yes
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }}
      onClick={(e) => e.stopPropagation()}
    >
      <Button variant="ghost" size="sm" onClick={() => onMoveToCollection(frag)}>
        MOVE TO COLLECTION
      </Button>
      <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>
        REMOVE
      </Button>
    </div>
  );
}

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
  const concLabel = shortFragType(frag.type ?? null);

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
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)", marginBottom: "2px" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-note)", fontStyle: "italic", color: "var(--color-navy)", fontWeight: 400, flex: 1 }}>
            {frag.name}
          </span>
          {concLabel && (
            <Badge variant="neutral" style={{ flexShrink: 0 }}>
              {concLabel}
            </Badge>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "var(--tracking-md)", marginBottom: "var(--space-2)" }}>
          {frag.house}
        </div>
        {cf?.avgPrice && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-ui)", fontWeight: "var(--font-weight-medium)", color: "var(--color-navy)", marginBottom: "var(--space-2)" }}>
            {cf.avgPrice}
          </div>
        )}
        {accords.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginBottom: "var(--space-3)" }}>
            {accords.map((a) => (
              <span key={a} style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: "100px", background: "var(--color-sand-light)", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)" }}>
                {a}
              </span>
            ))}
          </div>
        )}
      </Button>
      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        <Button variant="primary" size="sm" onClick={() => onMoveToCollection(frag)} style={{ flex: 1 }}>
          Add to Collection
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onRemove(frag)}>
          Remove
        </Button>
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

  const sort = (searchParams.get("sort") as SortKey) || "name_asc";

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [moveFormFrag, setMoveFormFrag] = useState<UserFragrance | null>(null);
  const [moveFormOpen, setMoveFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const setSort = useCallback(
    (v: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (v && v !== "name_asc") { params.set("sort", v); } else { params.delete("sort"); }
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  if (!user) return null;

  const MF = fragrances.filter((f) => f.userId === user.id);
  const wishlist = MF.filter((f) => WISHLIST_STATUSES.has(f.status));

  // Keys already owned or on wishlist (for discover section)
  const ownedKeys = new Set(MF.map((f) => (f.fragranceId ?? f.name.toLowerCase())));

  const friend = getFriend(user, profiles);
  const friendName = friend?.name ?? "Friend";

  // Community frag map
  const cfMap = useMemo(() => {
    const m = new Map<string, CommunityFrag | null>();
    wishlist.forEach((f) => m.set(f.id, getCF(f, communityFrags)));
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrances, communityFrags, user.id]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = wishlist;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case "name_desc": return b.name.localeCompare(a.name);
        case "price_asc": return parsePrice(cfMap.get(a.id)?.avgPrice ?? null) - parsePrice(cfMap.get(b.id)?.avgPrice ?? null);
        case "price_desc": return parsePrice(cfMap.get(b.id)?.avgPrice ?? null) - parsePrice(cfMap.get(a.id)?.avgPrice ?? null);
        case "newest": return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        default: return a.name.localeCompare(b.name);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrances, search, sort, cfMap]);

  // ── Discover: user's top accords ──────────────────────────
  const topAccords = useMemo(() => {
    const counts: Record<string, number> = {};
    MF.filter((f) => f.status === "CURRENT").forEach((f) => {
      getAccords(f, communityFrags).forEach((a) => { counts[a] = (counts[a] ?? 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrances, communityFrags, user.id]);

  // ── Discover: friend's collection ─────────────────────────
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

  // ── Discover: top accord matches ─────────────────────────
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

  // ── Discover: quality picks ───────────────────────────────
  const qualityDiscover = useMemo(() => {
    return communityFrags
      .filter((cf) => {
        const key = cf.fragranceId ?? cf.fragranceName.toLowerCase();
        if (ownedKeys.has(key)) return false;
        const r = parseFloat(cf.communityRating ?? "0");
        return r >= 4.0;
      })
      .sort((a, b) => parseFloat(b.communityRating ?? "0") - parseFloat(a.communityRating ?? "0"))
      .slice(0, 6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityFrags, ownedKeys]);

  // Reset to page 1 when search/sort changes
  useEffect(() => { setPage(1); }, [search, sort]);

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
      });
      toast("Added to wishlist");
    } catch {
      toast("Failed to add");
    }
  }

  function openMoveToCollection(frag: UserFragrance) {
    setMoveFormFrag({ ...frag, status: "CURRENT" });
    setMoveFormOpen(true);
  }

  async function handleRemove(frag: UserFragrance) {
    await removeFrag(frag.id);
    toast("Removed from wishlist");
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

      {/* Move to Collection: open FragForm with frag prefilled as CURRENT */}
      {moveFormFrag && (
        <FragForm
          open={moveFormOpen}
          onClose={() => { setMoveFormOpen(false); setMoveFormFrag(null); }}
          editing={moveFormFrag}
        />
      )}

      <Topbar title="Wishlist" actions={<FragSearch />} />

      <PageContent>

          {/* Filter + sort bar */}
          <div style={{ marginBottom: "var(--space-6)" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap max-sm:flex-col" style={{ marginBottom: "var(--space-3)" }}>
              <div style={{ width: "280px" }} className="max-sm:w-full">
                <SearchInput value={search} onChange={setSearch} placeholder="Search wishlist..." />
              </div>
              <Select options={SORT_OPTIONS} value={sort} onChange={setSort} placeholder="Sort by" size="auto" />
            </div>
          </div>

          {/* Result count */}
          {isLoaded && (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", letterSpacing: "var(--tracking-md)", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "var(--space-4)" }}>
              {filtered.length} Items
            </div>
          )}

          {/* Content */}
          {!isLoaded ? (
            <div className="hidden md:block">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--color-cream-dark)", height: "40px" }}>
                    {["FRAGRANCE", "ADDED", "AVG PRICE", "ACCORDS", ""].map((h) => (
                      <th key={h} style={{ padding: "0 var(--space-4)", fontFamily: "var(--font-sans)", fontSize: "var(--text-xxs)", fontWeight: "var(--font-weight-medium)", color: "var(--color-navy)", letterSpacing: "var(--tracking-md)", textTransform: "uppercase", textAlign: "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</tbody>
              </table>
            </div>
          ) : wishlist.length === 0 ? (
            <EmptyState
              icon={<Heart size={48} />}
              title="Your wishlist is empty"
              description="Save fragrances you want to explore."
              action={
                <Button variant="primary" onClick={() => setAddOpen(true)}>
                  <Plus size={15} />
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
              {/* Desktop table */}
              <div className="hidden md:block">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--color-cream-dark)", height: "40px", borderBottom: "1px solid var(--color-row-divider)" }}>
                      {[
                        { label: "FRAGRANCE", flex: true },
                        { label: "ADDED", w: 100 },
                        { label: "AVG PRICE", w: 110 },
                        { label: "ACCORDS", w: 220 },
                        { label: "", w: 260 },
                      ].map(({ label, flex, w }) => (
                        <th
                          key={label}
                          style={{
                            padding: "0 var(--space-4)",
                            fontFamily: "var(--font-sans)",
                            fontSize: "var(--text-xxs)",
                            fontWeight: "var(--font-weight-medium)",
                            color: "var(--color-navy)",
                            letterSpacing: "var(--tracking-md)",
                            textTransform: "uppercase",
                            textAlign: "left",
                            width: flex ? undefined : `${w}px`,
                            minWidth: flex ? "240px" : undefined,
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((frag) => {
                      const cf = cfMap.get(frag.id) ?? null;
                      const accords = cf?.fragranceAccords?.slice(0, 4) ?? [];
                      const extra = (cf?.fragranceAccords?.length ?? 0) > 4 ? (cf!.fragranceAccords.length - 4) : 0;
                      const added = addedStr(frag.createdAt);

                      return (
                        <tr
                          key={frag.id}
                          onClick={() => setDetailFrag(frag)}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--color-row-hover)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                          style={{
                            minHeight: "var(--size-row-min)",
                            background: "transparent",
                            borderBottom: "1px solid var(--color-row-divider)",
                            cursor: "pointer",
                          }}
                        >
                          {/* FRAGRANCE */}
                          <td style={{ padding: "0 var(--space-4)", minWidth: "240px" }}>
                            <FragranceCell name={frag.name} house={frag.house} type={frag.type} />
                          </td>

                          {/* ADDED */}
                          <td style={{ padding: "0 var(--space-4)", width: "100px" }}>
                            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-ui)", color: "var(--color-navy)" }}>{added || "—"}</span>
                          </td>

                          {/* AVG PRICE */}
                          <td style={{ padding: "0 var(--space-4)", width: "110px" }}>
                            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-ui)", fontWeight: "var(--font-weight-medium)", color: "var(--color-navy)" }}>
                              {cf?.avgPrice ?? "—"}
                            </span>
                          </td>

                          {/* ACCORDS */}
                          <td style={{ padding: "0 var(--space-4)", width: "220px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                              {accords.map((a) => (
                                <span key={a} style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: "100px", background: "var(--color-sand-light)", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
                                  {a}
                                </span>
                              ))}
                              {extra > 0 && (
                                <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: "100px", background: "var(--color-sand-light)", color: "rgba(30,45,69,0.8)", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)" }}>
                                  +{extra} more
                                </span>
                              )}
                            </div>
                          </td>

                          {/* ACTIONS */}
                          <td style={{ padding: "0 var(--space-2)", width: "260px" }}>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ display: "flex", justifyContent: "flex-end" }}>
                              <RowActions frag={frag} onMoveToCollection={openMoveToCollection} onRemove={handleRemove} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                total={filtered.length}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={setPageSize}
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

              {/* FROM FRIEND'S COLLECTION */}
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

              {/* MATCHES YOUR TOP NOTES */}
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

              {/* QUALITY PICKS */}
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
