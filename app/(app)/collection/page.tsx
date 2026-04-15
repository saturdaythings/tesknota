"use client";

import { useState, useMemo } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { FragRow } from "@/components/ui/frag-row";
import { FragForm } from "@/components/ui/frag-form";
import { FragDetail } from "@/components/ui/frag-detail";
import { Pagination } from "@/components/ui/pagination";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { useFilterSync } from "@/lib/hooks/useFilterSync";
import { avgRatingStr } from "@/lib/frag-utils";
import type { UserFragrance, FragranceStatus } from "@/types";

type StatusFilter = "all" | "wish" | FragranceStatus;
type SortKey = "nameAZ" | "nameZA" | "houseAZ" | "ratingHL" | "ratingLH" | "added" | "comps";

const WISHLIST_STATUSES = new Set<FragranceStatus>(["WANT_TO_BUY", "WANT_TO_SMELL", "WANT_TO_IDENTIFY"]);

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Current", value: "CURRENT" },
  { label: "Wishlist", value: "wish" },
  { label: "Prev. Owned", value: "PREVIOUSLY_OWNED" },
  { label: "Finished", value: "FINISHED" },
  { label: "Don't Like", value: "DONT_LIKE" },
];

export default function CollectionPage() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded, removeFrag } = useData();
  const { toast } = useToast();

  // URL-synced filter state
  const [filters, setFilters, clearAllFilters] = useFilterSync({
    q: "",
    status: "all" as StatusFilter,
    sort: "nameAZ" as SortKey,
    accord: "",
    rating: null as number | null,
    house: "",
  });

  // Local UI state (not in URL)
  const [formOpen, setFormOpen] = useState(false);
  const [editingFrag, setEditingFrag] = useState<UserFragrance | null>(null);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [accordSearch, setAccordSearch] = useState("");
  const [accordDDOpen, setAccordDDOpen] = useState(false);
  const [ratingDDOpen, setRatingDDOpen] = useState(false);
  const [houseDDOpen, setHouseDDOpen] = useState(false);

  if (!user) return null;

  const MF = fragrances.filter((f) => f.userId === user.id);
  const MC = compliments.filter((c) => c.userId === user.id);
  const current = MF.filter((f) => f.status === "CURRENT");

  const normStr = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const getCf = (f: UserFragrance) =>
    communityFrags.find(
      (c) => (f.fragranceId && c.fragranceId === f.fragranceId) ||
             (normStr(c.fragranceName) === normStr(f.name) && normStr(c.fragranceHouse) === normStr(f.house ?? ""))
    );

  const allAccords = useMemo(
    () => Array.from(new Set(MF.flatMap((f) => getCf(f)?.fragranceAccords ?? []))).sort(),
    [MF, getCf],
  );
  const allHouses = useMemo(
    () => Array.from(new Set(MF.map((f) => f.house).filter(Boolean) as string[])).sort(),
    [MF],
  );

  const compMap: Record<string, number> = {};
  MC.forEach((c) => {
    if (c.primaryFragId) compMap[c.primaryFragId] = (compMap[c.primaryFragId] ?? 0) + 1;
  });

  let filtered = MF;
  if (filters.status === "wish") {
    filtered = filtered.filter((f) => WISHLIST_STATUSES.has(f.status));
  } else if (filters.status !== "all") {
    filtered = filtered.filter((f) => f.status === filters.status);
  }
  if (filters.q.trim().length >= 2) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.house ?? "").toLowerCase().includes(q)
    );
  }
  if (filters.accord) filtered = filtered.filter((f) => getCf(f)?.fragranceAccords?.includes(filters.accord) ?? false);
  if (filters.rating !== null && filters.rating !== undefined) {
    const minRating = filters.rating;
    filtered = filtered.filter((f) => (f.personalRating ?? 0) >= minRating);
  }
  if (filters.house) filtered = filtered.filter((f) => f.house === filters.house);
  filtered = filtered.slice().sort((a, b) => {
    if (filters.sort === "nameZA") return b.name.localeCompare(a.name);
    if (filters.sort === "houseAZ") return (a.house ?? "").localeCompare(b.house ?? "");
    if (filters.sort === "ratingHL") return (b.personalRating ?? 0) - (a.personalRating ?? 0);
    if (filters.sort === "ratingLH") return (a.personalRating ?? 0) - (b.personalRating ?? 0);
    if (filters.sort === "added") return (b.createdAt ?? "") > (a.createdAt ?? "") ? 1 : -1;
    if (filters.sort === "comps")
      return (compMap[b.fragranceId || b.id] ?? 0) - (compMap[a.fragranceId || a.id] ?? 0);
    return a.name.localeCompare(b.name);
  });

  async function handleDeleteFrag(frag: UserFragrance) {
    await removeFrag(frag.id);
    setDetailFrag(null);
    toast("Fragrance deleted.");
  }

  return (
    <>
      <FragDetail
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        frag={detailFrag}
        communityFrags={communityFrags}
        compliments={MC}
        userId={user.id}
        onEdit={(frag) => { setEditingFrag(frag); setFormOpen(true); }}
        onDelete={handleDeleteFrag}
      />
      <FragForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editingFrag}
      />
      <Topbar title="My Collection" />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:p-[26px]">
        {!isLoaded && (
          <div className="text-[var(--ink3)] font-[var(--mono)] text-xs tracking-[0.12em] py-6">
            Loading...
          </div>
        )}

        {isLoaded && (
          <>
            <StatsGrid className="mb-6">
              <StatBox value={MF.length} label="Total" />
              <StatBox value={current.length} label="Current" />
              <StatBox value={avgRatingStr(MF)} label="Avg Rating" />
            </StatsGrid>

            {/* Search + sort + filter toggle row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="Search name or house..."
                value={filters.q}
                onChange={(e) => { setFilters({ q: e.target.value }); setPage(1); }}
                className="flex-1 min-w-[160px] max-w-[280px] px-3 py-[8px] border border-[var(--b3)] bg-[var(--off)] font-[var(--mono)] text-sm text-[var(--ink)] placeholder:text-[var(--ink3)] focus:outline-none focus:border-[var(--blue)]"
              />
              <select
                value={filters.sort}
                onChange={(e) => { setFilters({ sort: e.target.value as SortKey }); setPage(1); }}
                className="px-3 py-[6px] border border-[var(--b3)] bg-[var(--off)] font-[var(--mono)] text-xs text-[var(--ink3)] focus:outline-none cursor-pointer"
              >
                <option value="nameAZ">Name A–Z</option>
                <option value="nameZA">Name Z–A</option>
                <option value="houseAZ">House A–Z</option>
                <option value="ratingHL">Rating High–Low</option>
                <option value="ratingLH">Rating Low–High</option>
                <option value="added">Recently Added</option>
                <option value="comps">Most Compliments</option>
              </select>
              <button
                onClick={() => setFiltersOpen((o) => !o)}
                className={`font-[var(--mono)] text-xs tracking-[0.08em] px-3 py-[7px] border transition-colors ${filtersOpen ? "border-[var(--blue)] text-[var(--blue)]" : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"}`}
              >
                {filtersOpen ? "– FILTERS" : "+ FILTERS"}
              </button>
              {filters.accord && (
                <span className="flex items-center gap-1 font-[var(--mono)] text-xs px-2 py-1 border border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-tint)]">
                  {filters.accord} <button onClick={() => { setFilters({ accord: "" }); setPage(1); }} className="hover:opacity-70 leading-none">×</button>
                </span>
              )}
              {filters.rating !== null && (
                <span className="flex items-center gap-1 font-[var(--mono)] text-xs px-2 py-1 border border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-tint)]">
                  {filters.rating}+ stars <button onClick={() => { setFilters({ rating: null }); setPage(1); }} className="hover:opacity-70 leading-none">×</button>
                </span>
              )}
              {filters.house && (
                <span className="flex items-center gap-1 font-[var(--mono)] text-xs px-2 py-1 border border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-tint)]">
                  {filters.house} <button onClick={() => { setFilters({ house: "" }); setPage(1); }} className="hover:opacity-70 leading-none">×</button>
                </span>
              )}
            </div>

            {/* Collapsible filter panel */}
            {filtersOpen && (
              <div className="flex flex-wrap items-start gap-2 mb-4 py-3 border border-[var(--b2)] px-3">
                {/* Accords dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setAccordDDOpen((o) => !o); setRatingDDOpen(false); setHouseDDOpen(false); }}
                    className={`font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors ${filters.accord ? "border-[var(--blue)] text-[var(--blue)]" : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"}`}
                  >
                    {filters.accord || "Accords"} &#9662;
                  </button>
                  {accordDDOpen && (
                    <div className="absolute top-full left-0 z-50 bg-[var(--off)] border border-[var(--b3)] shadow-sm mt-1 w-[200px]">
                      <div className="p-2 border-b border-[var(--b2)]">
                        <input
                          value={accordSearch}
                          onChange={(e) => setAccordSearch(e.target.value)}
                          placeholder="Search accords..."
                          className="w-full px-2 py-1 text-xs font-[var(--mono)] border border-[var(--b3)] bg-[var(--off)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
                        />
                      </div>
                      <div className="overflow-y-auto max-h-[220px]">
                        {allAccords.filter((a) => !accordSearch || a.toLowerCase().includes(accordSearch.toLowerCase())).map((a) => (
                          <button key={a} onClick={() => { setFilters({ accord: a }); setAccordDDOpen(false); setAccordSearch(""); setPage(1); }} className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${filters.accord === a ? "text-[var(--blue)] bg-[var(--blue-tint)]" : "text-[var(--ink2)] hover:bg-[var(--b1)]"}`}>{a}</button>
                        ))}
                      </div>
                      <button onClick={() => { setFilters({ accord: "" }); setAccordDDOpen(false); setAccordSearch(""); setPage(1); }} className="w-full font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink4)] hover:text-[var(--blue)] px-3 py-2 border-t border-[var(--b2)] text-left">CLEAR</button>
                    </div>
                  )}
                </div>

                {/* Rating dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setRatingDDOpen((o) => !o); setAccordDDOpen(false); setHouseDDOpen(false); }}
                    className={`font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors ${filters.rating !== null ? "border-[var(--blue)] text-[var(--blue)]" : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"}`}
                  >
                    {filters.rating !== null ? `${filters.rating}+ stars` : "Rating"} &#9662;
                  </button>
                  {ratingDDOpen && (
                    <div className="absolute top-full left-0 z-50 bg-[var(--off)] border border-[var(--b3)] shadow-sm mt-1 w-[160px]">
                      {[5, 4, 3, 2, 1].map((r) => (
                        <button key={r} onClick={() => { setFilters({ rating: r }); setRatingDDOpen(false); setPage(1); }} className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${filters.rating === r ? "text-[var(--blue)] bg-[var(--blue-tint)]" : "text-[var(--ink2)] hover:bg-[var(--b1)]"}`}>{r}+ stars</button>
                      ))}
                      <button onClick={() => { setFilters({ rating: null }); setRatingDDOpen(false); setPage(1); }} className="w-full font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink4)] hover:text-[var(--blue)] px-3 py-2 border-t border-[var(--b2)] text-left">CLEAR</button>
                    </div>
                  )}
                </div>

                {/* Houses dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setHouseDDOpen((o) => !o); setAccordDDOpen(false); setRatingDDOpen(false); }}
                    className={`font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors ${filters.house ? "border-[var(--blue)] text-[var(--blue)]" : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"}`}
                  >
                    {filters.house || "Houses"} &#9662;
                  </button>
                  {houseDDOpen && (
                    <div className="absolute top-full left-0 z-50 bg-[var(--off)] border border-[var(--b3)] shadow-sm mt-1 w-[220px] max-h-[280px] overflow-y-auto">
                      {allHouses.map((h) => (
                        <button key={h} onClick={() => { setFilters({ house: h }); setHouseDDOpen(false); setPage(1); }} className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${filters.house === h ? "text-[var(--blue)] bg-[var(--blue-tint)]" : "text-[var(--ink2)] hover:bg-[var(--b1)]"}`}>{h}</button>
                      ))}
                      <button onClick={() => { setFilters({ house: "" }); setHouseDDOpen(false); setPage(1); }} className="w-full font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink4)] hover:text-[var(--blue)] px-3 py-2 border-t border-[var(--b2)] text-left">CLEAR</button>
                    </div>
                  )}
                </div>

                {/* Status chips */}
                <FilterBar className="mb-0">
                  {STATUS_FILTERS.map((f) => (
                    <FilterChip key={f.value} label={f.label} active={filters.status === f.value} onClick={() => { setFilters({ status: f.value }); setPage(1); }} />
                  ))}
                </FilterBar>
              </div>
            )}

            <SectionHeader
              title="Fragrances"
              right={
                <div className="flex items-center gap-3">
                  <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                    {filtered.length} {filtered.length === 1 ? "item" : "items"}
                  </span>
                  <button
                    onClick={() => { setEditingFrag(null); setFormOpen(true); }}
                    className="font-[var(--mono)] text-xs tracking-[0.08em] px-3 py-[7px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
                  >
                    + Add to Collection
                  </button>
                </div>
              }
            />

            {filtered.length === 0 ? (
              <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4 flex items-center gap-3">
                {MF.length === 0 ? "Your collection is empty." : (
                  <>
                    No matches.
                    <button
                      onClick={() => { clearAllFilters(); setPage(1); }}
                      className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[4px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            ) : (() => {
              const pageFrags = pageSize === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize);
              return (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto border border-[var(--b2)]">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b border-[var(--b2)]">
                          {["Fragrance", "Size", "Rating", "Added", "Accords", "Compliments", "Status"].map((h) => (
                            <th key={h} className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageFrags.map((f) => (
                          <FragRow key={f.id} frag={f} communityFrags={communityFrags} compliments={MC} userId={user.id} onClick={(frag) => setDetailFrag(frag)} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden flex flex-col border border-[var(--b2)]">
                    {pageFrags.map((f) => {
                      const comps = compMap[f.fragranceId || f.id] ?? 0;
                      const cf = getCf(f);
                      return (
                        <div key={f.id} onClick={() => setDetailFrag(f)} className="px-4 py-3 border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)] cursor-pointer">
                          <div className="font-[var(--mono)] text-[10px] tracking-[0.08em] uppercase text-[var(--ink3)] mb-0.5">{f.house}</div>
                          <div className="font-[var(--body)] text-sm text-[var(--ink)] mb-1">{f.name}</div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">{f.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                            {f.personalRating ? <span className="font-[var(--mono)] text-xs text-[var(--warm-text)]">{"★".repeat(f.personalRating)}</span> : null}
                            {comps > 0 ? <span className="font-[var(--mono)] text-xs text-[var(--blue)]">{comps} comp{comps !== 1 ? "s" : ""}</span> : null}
                            {cf?.fragranceAccords?.[0] ? <span className="font-[var(--mono)] text-xs text-[var(--ink4)]">{cf.fragranceAccords.slice(0, 2).join(", ")}</span> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
                </>
              );
            })()}
          </>
        )}
      </main>
    </>
  );
}
