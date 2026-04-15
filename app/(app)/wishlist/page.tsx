"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { FragForm } from "@/components/ui/frag-form";
import { FragDetail } from "@/components/ui/frag-detail";
import { FragRow } from "@/components/ui/frag-row";
import { Dropdown } from "@/components/ui/dropdown";
import { useUser, getFriend } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { useFilterSync } from "@/lib/hooks/useFilterSync";
import type { UserFragrance, CommunityFrag } from "@/types";

type WishFilter = "all" | "WANT_TO_BUY" | "WANT_TO_SMELL";
type SortKey = "nameAZ" | "nameZA" | "houseAZ" | "added";

const WISH_FILTERS: { label: string; value: WishFilter }[] = [
  { label: "All", value: "all" },
  { label: "Want to Buy", value: "WANT_TO_BUY" },
  { label: "Want to Smell", value: "WANT_TO_SMELL" },
];

export default function WishlistPage() {
  const { user, profiles } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded, removeFrag } = useData();
  const { toast } = useToast();

  // URL-synced filter state
  const [filters, setFilters] = useFilterSync({
    q: "",
    filter: "all" as WishFilter,
    sort: "nameAZ" as SortKey,
  });

  // Local UI state (not in URL)
  const [boughtFrag, setBoughtFrag] = useState<UserFragrance | null>(null);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [editingFrag, setEditingFrag] = useState<UserFragrance | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  if (!user) return null;

  const MC = compliments.filter((c) => c.userId === user.id);

  async function handleDeleteFrag(frag: UserFragrance) {
    await removeFrag(frag.id);
    setDetailFrag(null);
    toast("Fragrance deleted.");
  }

  const MF = fragrances.filter((f) => f.userId === user.id);
  const wish = MF.filter(
    (f) => f.status === "WANT_TO_BUY" || f.status === "WANT_TO_SMELL"
  );
  const wantToBuy = wish.filter((f) => f.status === "WANT_TO_BUY");
  const wantToSmell = wish.filter((f) => f.status === "WANT_TO_SMELL");

  const sq = filters.q.trim().toLowerCase();
  let filtered = filters.filter === "all" ? wish : wish.filter((f) => f.status === filters.filter);
  if (sq) filtered = filtered.filter((f) => f.name.toLowerCase().includes(sq) || (f.house ?? "").toLowerCase().includes(sq));
  filtered = filtered.slice().sort((a, b) => {
    if (filters.sort === "nameZA") return b.name.localeCompare(a.name);
    if (filters.sort === "houseAZ") return (a.house ?? "").localeCompare(b.house ?? "");
    if (filters.sort === "added") return (b.createdAt ?? "") > (a.createdAt ?? "") ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const friend = user ? getFriend(user, profiles) : null;
  const FF = fragrances.filter((f) => f.userId === friend?.id && f.status === "CURRENT");
  const myNames = new Set(MF.map((f) => f.name.toLowerCase()));
  const friendSignals = FF.filter((f) => !myNames.has(f.name.toLowerCase())).slice(0, 4);
  const qualityPicks = communityFrags
    .filter((cf) => {
      const rating = parseFloat(cf.communityRating ?? "0");
      return rating >= 4.3 && !myNames.has(cf.fragranceName.toLowerCase());
    })
    .sort((a, b) => parseFloat(b.communityRating ?? "0") - parseFloat(a.communityRating ?? "0"))
    .slice(0, 4);

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
      <FragForm
        open={!!boughtFrag}
        onClose={() => setBoughtFrag(null)}
        editing={boughtFrag}
        forceStatus="CURRENT"
      />
      <Topbar title="Wishlist" />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:p-[26px]">
        {!isLoaded && (
          <div className="text-[var(--ink3)] font-[var(--mono)] text-xs tracking-[0.12em] py-6">
            Loading...
          </div>
        )}

        {isLoaded && (
          <>
            <StatsGrid className="mb-6">
              <StatBox value={wantToBuy.length} label="Want to Buy" />
              <StatBox value={wantToSmell.length} label="Want to Smell" />
            </StatsGrid>

            <div className="mb-4">
              <input
                value={filters.q}
                onChange={(e) => setFilters({ q: e.target.value })}
                placeholder="Search wishlist..."
                className="w-full px-3 py-[9px] mb-3 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
              />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <FilterBar className="mb-0">
                {WISH_FILTERS.map((f) => (
                  <FilterChip
                    key={f.value}
                    label={f.label}
                    active={filters.filter === f.value}
                    onClick={() => setFilters({ filter: f.value })}
                  />
                ))}
              </FilterBar>
              <Dropdown
                value={filters.sort}
                onChange={(value) => setFilters({ sort: value as SortKey })}
                options={[
                  { label: "Name A–Z", value: "nameAZ" },
                  { label: "Name Z–A", value: "nameZA" },
                  { label: "House A–Z", value: "houseAZ" },
                  { label: "Recently Added", value: "added" },
                ]}
              />
            </div>

            <SectionHeader
              title="Wishlist"
              right={
                <div className="flex items-center gap-3">
                  <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                    {filtered.length} {filtered.length === 1 ? "item" : "items"}
                  </span>
                  <button
                    onClick={() => { setEditingFrag(null); setFormOpen(true); }}
                    className="font-[var(--mono)] text-xs tracking-[0.08em] px-3 py-[7px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
                  >
                    + Add to Wishlist
                  </button>
                </div>
              }
            />

            {filtered.length === 0 ? (
              <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4 flex items-center gap-3">
                {wish.length === 0 ? "Nothing on your wishlist yet." : (
                  <>
                    No matches.
                    <button
                      onClick={() => setFilters({ filter: "all", q: "" })}
                      className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[4px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
                    >
                      Clear filter
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto border border-[var(--b2)] mb-6">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[var(--b2)]">
                      {["Fragrance", "Size", "Rating", "Added", "Accords", "Comps", "Status", ""].map((h) => (
                        <th key={h} className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase text-[var(--ink3)] font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f) => (
                      <FragRow
                        key={f.id}
                        frag={f}
                        communityFrags={communityFrags}
                        compliments={MC}
                        userId={user.id}
                        onClick={setDetailFrag}
                        actionLabel="Bought it"
                        onAction={(frag, e) => { void e; setBoughtFrag(frag); }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(friendSignals.length > 0 || qualityPicks.length > 0) && (
              <div className="mb-6">
                <SectionHeader title="Discover" />
                {friendSignals.length > 0 && (
                  <div className="mb-5">
                    <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-3">
                      From your friend's collection
                    </div>
                    <div className="grid gap-px bg-[var(--b2)] border border-[var(--b2)] [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                      {friendSignals.map((f) => (
                        <DiscoverCard key={f.id} name={f.name} house={f.house} communityFrags={communityFrags} />
                      ))}
                    </div>
                  </div>
                )}
                {qualityPicks.length > 0 && (
                  <div>
                    <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-3">
                      Highly rated
                    </div>
                    <div className="grid gap-px bg-[var(--b2)] border border-[var(--b2)] [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                      {qualityPicks.map((cf) => (
                        <div key={cf.fragranceId} className="bg-[var(--off)] p-4">
                          <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.08em] uppercase mb-1">
                            {cf.fragranceHouse}
                          </div>
                          <div className="font-[var(--body)] text-sm text-[var(--ink)] mb-1">{cf.fragranceName}</div>
                          <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                            {cf.communityRating ? `${cf.communityRating}/10` : ""}
                            {cf.avgPrice ? ` · ${cf.avgPrice.replace(/~/g, "")}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

function DiscoverCard({
  name,
  house,
  communityFrags,
}: {
  name: string;
  house: string;
  communityFrags: CommunityFrag[];
}) {
  const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cf = communityFrags.find(
    (c) => norm(c.fragranceName) === norm(name) && norm(c.fragranceHouse) === norm(house)
  );
  return (
    <div className="bg-[var(--off)] p-4">
      <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.08em] uppercase mb-1">
        {house}
      </div>
      <div className="font-[var(--body)] text-sm text-[var(--ink)] mb-1">{name}</div>
      {cf && (
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">
          {cf.communityRating ? `${cf.communityRating}/10` : ""}
          {cf.avgPrice ? ` · ${cf.avgPrice.replace(/~/g, "")}` : ""}
        </div>
      )}
    </div>
  );
}
