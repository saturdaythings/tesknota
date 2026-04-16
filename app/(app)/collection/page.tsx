"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Plus, X, FlaskConical, SearchX, SlidersHorizontal } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { FragForm } from "@/components/ui/frag-form";
import { AddFragranceModal } from "@/components/collection/add-fragrance-modal";
import { FragranceCard } from "@/components/collection/fragrance-card";
import { FragranceDetailModal } from "@/components/collection/fragrance-detail-modal";
import { Pagination } from "@/components/ui/pagination";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { getAccords, MONTHS } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import type { UserFragrance, FragranceStatus } from "@/types";

// ── Sort / filter constants ───────────────────────────────

type SortKey =
  | "name_asc"
  | "name_desc"
  | "newest"
  | "oldest"
  | "rating_desc"
  | "rating_asc"
  | "compliments_desc";

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "newest", label: "Date Added (newest)" },
  { value: "oldest", label: "Date Added (oldest)" },
  { value: "rating_desc", label: "Rating (high-low)" },
  { value: "rating_asc", label: "Rating (low-high)" },
  { value: "compliments_desc", label: "Compliments (most)" },
];

const RATING_FILTER_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "5", label: "5 stars" },
  { value: "4plus", label: "4+ stars" },
  { value: "3plus", label: "3+ stars" },
  { value: "1to2", label: "1-2 stars" },
  { value: "unrated", label: "Unrated" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "CURRENT", label: "Current" },
  { value: "PREVIOUSLY_OWNED", label: "Previously Owned" },
  { value: "WANT_TO_BUY", label: "Want to Buy" },
  { value: "WANT_TO_SMELL", label: "Sample/Smell Only" },
  { value: "DONT_LIKE", label: "Don't Like" },
  { value: "WANT_TO_IDENTIFY", label: "Identify Later" },
  { value: "FINISHED", label: "Finished" },
];

// ── Helpers ───────────────────────────────────────────────

function applySort(
  frags: UserFragrance[],
  sort: SortKey,
  compMap: Record<string, number>,
): UserFragrance[] {
  return [...frags].sort((a, b) => {
    switch (sort) {
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "rating_desc":
        return (b.personalRating ?? 0) - (a.personalRating ?? 0);
      case "rating_asc":
        return (a.personalRating ?? 0) - (b.personalRating ?? 0);
      case "newest":
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      case "oldest":
        return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      case "compliments_desc":
        return (
          (compMap[b.fragranceId ?? b.id] ?? 0) -
          (compMap[a.fragranceId ?? a.id] ?? 0)
        );
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

function addedStr(createdAt: string | null): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function concentrationLabel(type: string | null): string | null {
  if (!type) return null;
  const map: Record<string, string> = {
    "Extrait de Parfum": "EXTRAIT DE PARFUM",
    "Eau de Parfum": "EAU DE PARFUM",
    "Eau de Toilette": "EAU DE TOILETTE",
    "Perfume Oil": "OIL",
    "Cologne": "COLOGNE",
    "Body Spray": "BODY SPRAY",
    "Perfume Concentré": "CONCENTRÉ",
    "Other": "OTHER",
  };
  return map[type] ?? type.toUpperCase();
}

function statusVariant(status: FragranceStatus): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "CURRENT": return "collection";
    case "WANT_TO_BUY": case "WANT_TO_SMELL": return "wishlist";
    case "WANT_TO_IDENTIFY": return "identify_later";
    case "PREVIOUSLY_OWNED": return "previously_owned";
    case "DONT_LIKE": return "dont_like";
    case "FINISHED": return "finished";
    default: return "neutral";
  }
}

// ── Inline star row (table, non-interactive visual only) ──

function StarRow({ value, size = 14 }: { value: number | null; size?: number }) {
  const filled = value ?? 0;
  return (
    <div style={{ display: "flex", gap: "1px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{
            fontSize: `${size}px`,
            lineHeight: 1,
            color: filled >= s ? "var(--color-accent)" : "var(--color-cream-dark)",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ── Interactive star row for table ────────────────────────

function InteractiveStarRow({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const filled = hover ?? value ?? 0;
  return (
    <div
      role="group"
      aria-label="Rating"
      style={{ display: "flex", gap: "1px" }}
      onClick={(e) => e.stopPropagation()}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(s); }}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(null)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontSize: "16px",
            lineHeight: 1,
            color: filled >= s ? "var(--color-accent)" : "var(--color-cream-dark)",
            transition: "color 100ms",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Global search input (header) ──────────────────────────

function GlobalSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Search
        size={14}
        style={{
          position: "absolute",
          left: "10px",
          color: "var(--color-sand)",
          pointerEvents: "none",
        }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
        style={{
          width: "200px",
          height: "34px",
          paddingLeft: "30px",
          paddingRight: "10px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "3px",
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          color: "var(--color-cream)",
          outline: "none",
        }}
        className="placeholder:text-[rgba(245,240,232,0.5)] focus:border-[rgba(255,255,255,0.4)]"
      />
    </div>
  );
}

// ── Table row skeleton ────────────────────────────────────

function RowSkeleton() {
  return (
    <tr>
      <td style={{ padding: "0 16px", height: "64px" }}>
        <Skeleton className="h-4 w-40 mb-1" />
        <Skeleton className="h-3 w-24" />
      </td>
      {[100, 100, 100, 200, 100, 100].map((w, i) => (
        <td key={i} style={{ padding: "0 16px" }}>
          <Skeleton className={`h-4 w-[${w}px]`} />
        </td>
      ))}
    </tr>
  );
}

// ── Inner page ────────────────────────────────────────────

function CollectionInner() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded, removeFrag, editFrag } = useData();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = (searchParams.get("sort") as SortKey) || "name_asc";

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [accordFilter, setAccordFilter] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState("any");
  const [statusFilter, setStatusFilter] = useState("all");
  const [houseFilter, setHouseFilter] = useState<string[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFrag, setEditingFrag] = useState<UserFragrance | null>(null);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const setSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "name_asc") {
        params.set("sort", value);
      } else {
        params.delete("sort");
      }
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  if (!user) return null;

  const MF = fragrances.filter((f) => f.userId === user.id);
  const MC = compliments.filter((c) => c.userId === user.id);

  const compMap: Record<string, number> = {};
  MC.forEach((c) => {
    if (c.primaryFragId) compMap[c.primaryFragId] = (compMap[c.primaryFragId] ?? 0) + 1;
  });

  // Derive unique accords and houses for filter dropdowns
  const allAccords = useMemo(() => {
    const s = new Set<string>();
    MF.forEach((f) => {
      const a = getAccords(f, communityFrags);
      a.forEach((x) => s.add(x));
    });
    return Array.from(s).sort();
  }, [fragrances, communityFrags, user.id]);

  const allHouses = useMemo(() => {
    const s = new Set<string>();
    MF.forEach((f) => { if (f.house) s.add(f.house); });
    return Array.from(s).sort();
  }, [fragrances, user.id]);

  const accordOptions = allAccords.map((a) => ({ value: a, label: a }));
  const houseOptions = allHouses.map((h) => ({ value: h, label: h }));

  // Filter + sort
  const filtered = useMemo(() => {
    let list = MF;

    // text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.house.toLowerCase().includes(q),
      );
    }

    // status filter
    if (statusFilter !== "all") {
      list = list.filter((f) => f.status === statusFilter);
    }

    // rating filter
    if (ratingFilter !== "any") {
      list = list.filter((f) => {
        const r = f.personalRating ?? 0;
        switch (ratingFilter) {
          case "5": return r === 5;
          case "4plus": return r >= 4;
          case "3plus": return r >= 3;
          case "1to2": return r >= 1 && r <= 2;
          case "unrated": return !r;
          default: return true;
        }
      });
    }

    // accords filter (multi)
    if (accordFilter.length > 0) {
      list = list.filter((f) => {
        const fa = getAccords(f, communityFrags);
        return accordFilter.some((a) => fa.includes(a));
      });
    }

    // house filter (multi)
    if (houseFilter.length > 0) {
      list = list.filter((f) => houseFilter.includes(f.house));
    }

    return applySort(list, sort, compMap);
  }, [fragrances, search, sort, statusFilter, ratingFilter, accordFilter, houseFilter, compliments, communityFrags, user.id]);

  const filtersActive =
    search.trim() !== "" ||
    sort !== "name_asc" ||
    accordFilter.length > 0 ||
    ratingFilter !== "any" ||
    statusFilter !== "all" ||
    houseFilter.length > 0;

  // Reset to page 1 whenever filters/sort change
  useEffect(() => { setPage(1); }, [search, sort, statusFilter, ratingFilter, accordFilter, houseFilter]);

  const paginated = useMemo(
    () => pageSize === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  function clearFilters() {
    setSearch("");
    setAccordFilter([]);
    setRatingFilter("any");
    setStatusFilter("all");
    setHouseFilter([]);
    router.push(window.location.pathname);
  }

  async function handleDelete(frag: UserFragrance) {
    await removeFrag(frag.id);
    setDetailFrag(null);
    toast("Fragrance removed.");
  }

  async function handleRatingUpdate(frag: UserFragrance, rating: number) {
    await editFrag({ ...frag, personalRating: rating });
  }

  return (
    <>
      <FragranceDetailModal
        frag={detailFrag}
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        communityFrags={communityFrags}
        compliments={MC}
        userId={user.id}
        onEdit={(frag) => {
          setDetailFrag(null);
          setEditingFrag(frag);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />
      <AddFragranceModal open={addOpen} onClose={() => setAddOpen(false)} />
      <FragForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingFrag(null); }}
        editing={editingFrag}
      />

      {/* Topbar with global search */}
      <Topbar
        title="My Collection"
        search={
          <GlobalSearch value={search} onChange={setSearch} />
        }
      />

      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "var(--space-6) var(--space-8)" }}
          className="max-sm:px-[var(--space-4)] max-sm:py-[var(--space-4)]"
        >
          {/* Add button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-5)", position: "relative", zIndex: 10 }}>
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              ADD TO COLLECTION
            </Button>
          </div>

          {/* Sticky filter + sort bar */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              background: "#FFFFFF",
              paddingBottom: "var(--space-3)",
            }}
          >
            {/* Row 1 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                flexWrap: "wrap",
              }}
            >
              {/* Search input */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", width: "320px" }}
                className="max-sm:w-full"
              >
                <Search
                  size={14}
                  style={{ position: "absolute", left: "10px", color: "var(--color-sand)", pointerEvents: "none" }}
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search fragrances..."
                  style={{
                    width: "100%",
                    height: "40px",
                    paddingLeft: "30px",
                    paddingRight: "10px",
                    background: "#FFFFFF",
                    border: "1px solid var(--color-sand-light)",
                    borderRadius: "3px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    color: "var(--color-navy)",
                    outline: "none",
                  }}
                  className="focus:border-[var(--color-accent)] placeholder:text-[var(--color-navy-mid)]"
                />
              </div>

              {/* Sort */}
              <div style={{ width: "200px" }} className="max-sm:flex-1">
                <Select
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={setSort}
                  placeholder="Sort by"
                />
              </div>

              {/* +/- FILTERS toggle */}
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-sand-light)",
                  borderRadius: "3px",
                  padding: "0 14px",
                  height: "40px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: filtersOpen ? "var(--color-navy)" : "var(--color-navy)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginLeft: "auto",
                  transition: "border-color 150ms, color 150ms",
                  borderColor: filtersOpen ? "var(--color-navy)" : "var(--color-sand-light)",
                }}
              >
                <SlidersHorizontal size={13} />
                {filtersOpen ? "- FILTERS" : "+ FILTERS"}
              </button>

              {filtersActive && (
                <button
                  onClick={clearFilters}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    fontSize: "12px",
                    color: "var(--color-sand)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: 0,
                  }}
                >
                  <X size={13} />
                  Clear
                </button>
              )}
            </div>

            {/* Row 2: expandable filters */}
            {filtersOpen && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "var(--space-3)",
                  paddingTop: "var(--space-3)",
                  borderTop: "1px solid var(--color-sand-light)",
                }}
              >
                <div style={{ width: "160px" }}>
                  <MultiSelect
                    options={accordOptions}
                    value={accordFilter}
                    onChange={setAccordFilter}
                    placeholder="Accords"
                  />
                </div>
                <div style={{ width: "160px" }}>
                  <Select
                    options={RATING_FILTER_OPTIONS}
                    value={ratingFilter}
                    onChange={setRatingFilter}
                    placeholder="Rating"
                  />
                </div>
                <div style={{ width: "160px" }}>
                  <Select
                    options={STATUS_FILTER_OPTIONS}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Status"
                  />
                </div>
                <div style={{ width: "160px" }}>
                  <MultiSelect
                    options={houseOptions}
                    value={houseFilter}
                    onChange={setHouseFilter}
                    placeholder="Houses"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Result count */}
          {isLoaded && (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-sand)",
                marginBottom: "var(--space-4)",
              }}
            >
              {filtered.length} Fragrances
            </div>
          )}

          {/* Content */}
          {!isLoaded ? (
            /* Loading skeleton */
            <div className="hidden md:block">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(237,232,223,0.5)", height: "40px" }}>
                    {["FRAGRANCE", "SIZE", "RATING", "ADDED", "ACCORDS", "COMPLIMENTS", "STATUS"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0 16px",
                          fontFamily: "var(--font-sans)",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--color-sand)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          textAlign: "left",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}
                </tbody>
              </table>
            </div>
          ) : MF.length === 0 ? (
            <EmptyState
              icon={<FlaskConical size={48} />}
              title="Your collection is empty"
              description="Start tracking your fragrances."
              action={
                <Button variant="primary" onClick={() => setAddOpen(true)}>
                  Add Fragrance
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<SearchX size={48} />}
              title="No matches"
              description="Try adjusting your filters."
              action={
                <Button variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        background: "var(--color-cream-dark)",
                        height: "40px",
                        borderBottom: "1px solid var(--color-sand-light)",
                      }}
                    >
                      {[
                        { label: "FRAGRANCE", flex: true },
                        { label: "SIZE", w: 100 },
                        { label: "RATING", w: 120 },
                        { label: "ADDED", w: 100 },
                        { label: "ACCORDS", w: 200 },
                        { label: "COMPLIMENTS", w: 110 },
                        { label: "STATUS", w: 120 },
                      ].map(({ label, flex, w }) => (
                        <th
                          key={label}
                          style={{
                            padding: "0 16px",
                            fontFamily: "var(--font-sans)",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "var(--color-navy)",
                            letterSpacing: "0.1em",
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
                    {paginated.map((frag, i) => {
                      const accords = getAccords(frag, communityFrags);
                      const visibleAccords = accords.slice(0, 4);
                      const extraAccords = accords.length > 4 ? accords.length - 4 : 0;
                      const concLabel = concentrationLabel(frag.type ?? null);
                      const added = addedStr(frag.createdAt);
                      const compCount = compMap[frag.fragranceId ?? frag.id] ?? 0;
                      const isEven = i % 2 === 0;

                      return (
                        <tr
                          key={frag.id}
                          onClick={() => setDetailFrag(frag)}
                          style={{
                            height: "64px",
                            background: isEven ? "#FFFFFF" : "var(--color-cream)",
                            borderBottom: "1px solid var(--color-sand-light)",
                            cursor: "pointer",
                            transition: "background 100ms",
                          }}
                          className="hover:bg-[rgba(232,224,208,0.4)]!"
                        >
                          {/* FRAGRANCE */}
                          <td style={{ padding: "0 16px", minWidth: "240px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontFamily: "var(--font-serif)",
                                  fontSize: "17px",
                                  fontStyle: "italic",
                                  fontWeight: 400,
                                  color: "var(--color-navy)",
                                }}
                              >
                                {frag.name}
                              </span>
                              {concLabel && (
                                <span
                                  style={{
                                    border: "1px solid var(--color-sand)",
                                    color: "var(--color-sand)",
                                    fontFamily: "var(--font-sans)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    padding: "2px 6px",
                                    borderRadius: "2px",
                                    textTransform: "uppercase",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {concLabel}
                                </span>
                              )}
                              {frag.isDupe && (
                                <span
                                  style={{
                                    background: "var(--color-sand-light)",
                                    color: "var(--color-navy)",
                                    fontFamily: "var(--font-sans)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    padding: "2px 6px",
                                    borderRadius: "2px",
                                    textTransform: "uppercase",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  DUPE
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-sans)",
                                fontSize: "12px",
                                fontWeight: 400,
                                color: "var(--color-sand)",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginTop: "2px",
                              }}
                            >
                              {frag.house}
                            </div>
                          </td>

                          {/* SIZE */}
                          <td style={{ padding: "0 16px", width: "100px" }}>
                            <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 400, color: "var(--color-navy)" }}>
                              {frag.sizes?.length ? frag.sizes[0] : "—"}
                            </span>
                          </td>

                          {/* RATING */}
                          <td style={{ padding: "0 16px", width: "120px" }}>
                            <InteractiveStarRow
                              value={frag.personalRating}
                              onChange={(r) => handleRatingUpdate(frag, r)}
                            />
                          </td>

                          {/* ADDED */}
                          <td style={{ padding: "0 16px", width: "100px" }}>
                            <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 400, color: "var(--color-navy)" }}>
                              {added || "—"}
                            </span>
                          </td>

                          {/* ACCORDS */}
                          <td style={{ padding: "0 16px", width: "200px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                              {visibleAccords.map((a) => (
                                <span
                                  key={a}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "2px 7px",
                                    borderRadius: "100px",
                                    background: "var(--color-sand-light)",
                                    color: "var(--color-navy)",
                                    fontFamily: "var(--font-sans)",
                                    fontSize: "12px",
                                    fontWeight: 400,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {a}
                                </span>
                              ))}
                              {extraAccords > 0 && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "2px 7px",
                                    borderRadius: "100px",
                                    background: "var(--color-sand-light)",
                                    color: "var(--color-sand)",
                                    fontFamily: "var(--font-sans)",
                                    fontSize: "12px",
                                  }}
                                >
                                  +{extraAccords} more
                                </span>
                              )}
                            </div>
                          </td>

                          {/* COMPLIMENTS */}
                          <td style={{ padding: "0 16px", width: "110px" }}>
                            <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 400, color: compCount > 0 ? "var(--color-navy)" : "var(--color-sand)" }}>
                              {compCount > 0 ? compCount : "—"}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td style={{ padding: "0 16px", width: "120px" }}>
                            <Badge variant={statusVariant(frag.status)}>
                              {STATUS_LABELS[frag.status]}
                            </Badge>
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

              {/* Mobile card list */}
              <div className="md:hidden">
                {paginated.map((frag) => {
                  const accords = getAccords(frag, communityFrags);
                  const compCount = compMap[frag.fragranceId ?? frag.id] ?? 0;
                  const added = addedStr(frag.createdAt);
                  return (
                    <FragranceCard
                      key={frag.id}
                      frag={frag}
                      compCount={compCount}
                      accords={accords}
                      addedDate={added || null}
                      onClick={() => setDetailFrag(frag)}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function CollectionPage() {
  return (
    <Suspense>
      <CollectionInner />
    </Suspense>
  );
}
