"use client";

import { useState } from "react";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("nameAZ");
  const [formOpen, setFormOpen] = useState(false);
  const [editingFrag, setEditingFrag] = useState<UserFragrance | null>(null);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [accordFilter, setAccordFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [houseFilter, setHouseFilter] = useState("");
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
  const allAccords = Array.from(new Set(MF.flatMap((f) => getCf(f)?.accords ?? []))).sort();
  const allHouses = Array.from(new Set(MF.map((f) => f.house).filter(Boolean) as string[])).sort();

  const compMap: Record<string, number> = {};
  MC.forEach((c) => {
    if (c.primaryFragId) compMap[c.primaryFragId] = (compMap[c.primaryFragId] ?? 0) + 1;
  });

  let filtered = MF;
  if (statusFilter === "wish") {
    filtered = filtered.filter((f) => WISHLIST_STATUSES.has(f.status));
  } else if (statusFilter !== "all") {
    filtered = filtered.filter((f) => f.status === statusFilter);
  }
  if (search.trim().length >= 2) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.house ?? "").toLowerCase().includes(q)
    );
  }
  if (accordFilter) filtered = filtered.filter((f) => getCf(f)?.accords?.includes(accordFilter) ?? false);
  if (ratingFilter !== null) filtered = filtered.filter((f) => (f.personalRating ?? 0) >= ratingFilter);
  if (houseFilter) filtered = filtered.filter((f) => f.house === houseFilter);
  filtered = filtered.slice().sort((a, b) => {
    if (sort === "nameZA") return b.name.localeCompare(a.name);
    if (sort === "houseAZ") return (a.house ?? "").localeCompare(b.house ?? "");
    if (sort === "ratingHL") return (b.personalRating ?? 0) - (a.personalRating ?? 0);
    if (sort === "ratingLH") return (a.personalRating ?? 0) - (b.personalRating ?? 0);
    if (sort === "added") return (b.createdAt ?? "") > (a.createdAt ?? "") ? 1 : -1;
    if (sort === "comps")
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
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="flex-1 min-w-[160px] max-w-[280px] px-3 py-[8px] border border-[var(--b3)] bg-[var(--off)] font-[var(--mono)] text-sm text-[var(--ink)] placeholder:text-[var(--ink3)] focus:outline-none focus:border-[var(--blue)]"
              />
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
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
              {accordFilter && (
                <span className="flex items-center gap-1 font-[var(--mono)] text-xs px-2 py-1 border border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-tint)]">
                  {accordFilter} <button onClick={() => { setAccordFilter(""); setPage(1); }} className="hover:opacity-70 leading-none">×</button>
                </span>
              )}
              {ratingFilter !== null && (
                <span className="flex items-center gap-1 font-[var(--mono)] text-xs px-2 py-1 border border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-tint)]">
                  {ratingFilter}+ stars <button onClick={() => { setRatingFilter(null); setPage(1); }} className="hover:opacity-70 leading-none">×</button>
                </span>
              )}
              {houseFilter && (
                <span className="flex items-center gap-1 font-[var(--mono)] text-xs px-2 py-1 border border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-tint)]">
                  {houseFilter} <button onClick={() => { setHouseFilter(""); setPage(1); }} className="hover:opacity-70 leading-none">×</button>
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
                    className={`font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors ${accordFilter ? "border-[var(--blue)] text-[var(--blue)]" : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"}`}
                  >
                    {accordFilter || "Accords"} &#9662;
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
                          <button key={a} onClick={() => { setAccordFilter(a); setAccordDDOpen(false); setAccordSearch(""); setPage(1); }} className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${accordFilter === a ? "text-[var(--blue)] bg-[var(--blue-tint)]" : "text-[var(--ink2)] hover:bg-[var(--b1)]"}`}>{a}</button>
                        ))}
                      </div>
                      <button onClick={() => { setAccordFilter(""); setAccordDDOpen(false); setAccordSearch(""); setPage(1); }} className="w-full font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink4)] hover:text-[var(--blue)] px-3 py-2 border-t border-[var(--b2)] text-left">CLEAR</button>
                    </div>
                  )}
                </div>

                {/* Rating dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setRatingDDOpen((o) => !o); setAccordDDOpen(false); setHouseDDOpen(false); }}
                    className={`font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors ${ratingFilter !== null ? "border-[var(--blue)] text-[var(--blue)]" : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"}`}
                  >
                    {ratingFilter !== null ? `${ratingFilter}+ stars` : "Rating"} &#9662;
                  </button>
                  {ratingDDOpen && (
                    <div className="absolute top-full left-0 z-50 bg-[var(--off)] border border-[var(--b3)] shadow-sm mt-1 w-[160px]">
                      {[5, 4, 3, 2, 1].map((r) => (
                        <button key={r} onClick={() => { setRatingFilter(r); setRatingDDOpen(false); setPage(1); }} className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${ratingFilter === r ? "text-[var(--blue)] bg-[var(--blue-tint)]" : "text-[var(--ink2)] hover:bg-[var(--b1)]"}`}>{r}+ stars</button>
                      ))}
                      <button onClick={() => { setRatingFilter(null); setRatingDDOpen(false); setPage(1); }} className="w-full font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink4)] hover:text-[var(--blue)] px-3 py-2 border-t border-[var(--b2)] text-left">CLEAR</button>
                    </div>
                  )}
                </div>

                {/* Houses dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setHouseDDOpen((o) => !o); setAccordDDOpen(false); setRatingDDOpen(false); }}
                    className={`font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors ${houseFilter ? "border-[var(--blue)] text-[var(--blue)]" : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"}`}
                  >
                    {houseFilter || "Houses"} &#9662;
                  </button>
                  {houseDDOpen && (
                    <div className="absolute top-full left-0 z-50 bg-[var(--off)] border border-[var(--b3)] shadow-sm mt-1 w-[220px] max-h-[280px] overflow-y-auto">
                      {allHouses.map((h) => (
                        <button key={h} onClick={() => { setHouseFilter(h); setHouseDDOpen(false); setPage(1); }} className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${houseFilter === h ? "text-[var(--blue)] bg-[var(--blue-tint)]" : "text-[var(--ink2)] hover:bg-[var(--b1)]"}`}>{h}</button>
                      ))}
                      <button onClick={() => { setHouseFilter(""); setHouseDDOpen(false); setPage(1); }} className="w-full font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink4)] hover:text-[var(--blue)] px-3 py-2 border-t border-[var(--b2)] text-left">CLEAR</button>
                    </div>
                  )}
                </div>

                {/* Status chips */}
                <FilterBar className="mb-0">
                  {STATUS_FILTERS.map((f) => (
                    <FilterChip key={f.value} label={f.label} active={statusFilter === f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }} />
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
                      onClick={() => { setSearch(""); setStatusFilter("all"); setAccordFilter(""); setRatingFilter(null); setHouseFilter(""); setPage(1); }}
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
                            {cf?.accords?.[0] ? <span className="font-[var(--mono)] text-xs text-[var(--ink4)]">{cf.accords.slice(0, 2).join(", ")}</span> : null}
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
