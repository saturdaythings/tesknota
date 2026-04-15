"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { FragRow } from "@/components/ui/frag-row";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { avgRatingStr } from "@/lib/frag-utils";
import type { FragranceStatus } from "@/types";

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
  const { fragrances, compliments, communityFrags, isLoaded } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("nameAZ");

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

  return (
    <>
      <Topbar category="My Space" title="My Collection" />
      <main className="flex-1 overflow-y-auto p-[26px]">
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

            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="Search name or house..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 max-w-[280px] px-3 py-[6px] border border-[var(--b3)] bg-[var(--off)] font-[var(--mono)] text-xs text-[var(--ink)] placeholder:text-[var(--ink3)] focus:outline-none focus:border-[var(--blue)]"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
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
                  onClick={() => setStatusFilter(f.value)}
                />
              ))}
            </FilterBar>

            <SectionHeader
              title="Fragrances"
              right={
                <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                  {filtered.length} {filtered.length === 1 ? "item" : "items"}
                </span>
              }
            />

            {filtered.length === 0 ? (
              <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4">
                {MF.length === 0 ? "Your collection is empty." : "No matches."}
              </div>
            ) : (
              <div className="border border-[var(--b2)] mb-6">
                <table className="w-full">
                  <tbody>
                    {filtered.map((f) => (
                      <FragRow
                        key={f.id}
                        frag={f}
                        communityFrags={communityFrags}
                        compliments={MC}
                        userId={user.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
