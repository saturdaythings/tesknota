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

  if (!user) return null;

  const MF = fragrances.filter((f) => f.userId === user.id);
  const MC = compliments.filter((c) => c.userId === user.id);
  const current = MF.filter((f) => f.status === "CURRENT");

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
      <Topbar category="My Space" title="My Collection" />
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

            <div className="flex flex-wrap items-center gap-3 mb-4">
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
            </div>

            <FilterBar className="mb-4">
              {STATUS_FILTERS.map((f) => (
                <FilterChip
                  key={f.value}
                  label={f.label}
                  active={statusFilter === f.value}
                  onClick={() => { setStatusFilter(f.value); setPage(1); }}
                />
              ))}
            </FilterBar>

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
                    + Add
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
                      onClick={() => { setSearch(""); setStatusFilter("all"); setPage(1); }}
                      className="font-[var(--mono)] text-[11px] tracking-[0.06em] px-3 py-[4px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-[var(--b2)]">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-[var(--b2)]">
                        <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] text-[var(--ink3)]">Fragrance</th>
                        <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] text-[var(--ink3)]">Size</th>
                        <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] text-[var(--ink3)]">Rating</th>
                        <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] text-[var(--ink3)]">Added</th>
                        <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] text-[var(--ink3)]">Accords</th>
                        <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] text-[var(--ink3)]">Compliments</th>
                        <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] text-[var(--ink3)]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pageSize === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize)).map((f) => (
                        <FragRow
                          key={f.id}
                          frag={f}
                          communityFrags={communityFrags}
                          compliments={MC}
                          userId={user.id}
                          onClick={(frag) => setDetailFrag(frag)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  total={filtered.length}
                  page={page}
                  pageSize={pageSize}
                  onPage={setPage}
                  onPageSize={setPageSize}
                />
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
