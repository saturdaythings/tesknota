"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { FragRow } from "@/components/ui/frag-row";
import { FragDetail } from "@/components/ui/frag-detail";
import { Pagination } from "@/components/ui/pagination";
import { useUser, getFriend } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { MONTHS, getAccords, monthNum } from "@/lib/frag-utils";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";

type FriendTab = "collection" | "compliments" | "wishlist" | "incommon";

const FRIEND_TABS: { label: string; value: FriendTab }[] = [
  { label: "Collection", value: "collection" },
  { label: "Compliments", value: "compliments" },
  { label: "Wishlist", value: "wishlist" },
  { label: "In Common", value: "incommon" },
];

export default function FriendPage() {
  const { user, profiles } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded } = useData();
  const [tab, setTab] = useState<FriendTab>("collection");
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);

  if (!user) return null;

  const friend = getFriend(user, profiles);
  if (!friend) return null;
  const friendName = friend.name;

  const MF = fragrances.filter((f) => f.userId === user.id);
  const FF = fragrances.filter((f) => f.userId === friend.id);
  const FC = compliments.filter((c) => c.userId === friend.id);

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

  return (
    <>
      <FragDetail
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        frag={detailFrag}
        communityFrags={communityFrags}
        compliments={compliments.filter((c) => c.userId === friend.id)}
        userId={friend.id}
        readOnly
      />
      <Topbar category="Social" title={`${friendName}'s Profile`} />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:p-[26px]">
        {!isLoaded && (
          <div className="text-[var(--ink3)] font-[var(--mono)] text-xs tracking-[0.12em] py-6">
            Loading...
          </div>
        )}

        {isLoaded && (
          <>
            <StatsGrid className="mb-6">
              <StatBox value={FFOwned.length} label="Collection" />
              <StatBox value={FC.length} label="Compliments" />
              <StatBox value={FFWish.length} label="Wishlist" />
              <StatBox value={inCommon.length} label="In Common" />
            </StatsGrid>

            <FilterBar className="mb-6">
              {FRIEND_TABS.map((t) => (
                <FilterChip
                  key={t.value}
                  label={t.label}
                  active={tab === t.value}
                  onClick={() => setTab(t.value)}
                />
              ))}
            </FilterBar>

            {tab === "collection" && (
              <FriendCollectionTab
                frags={FFOwned}
                compliments={FC}
                communityFrags={communityFrags}
                friendId={friend.id }
                onFragClick={setDetailFrag}
              />
            )}
            {tab === "compliments" && (
              <FriendComplimentsTab
                compliments={FC}
                frags={FF}
              />
            )}
            {tab === "wishlist" && (
              <FriendWishlistTab
                frags={FFWish}
                communityFrags={communityFrags}
              />
            )}
            {tab === "incommon" && (
              <InCommonTab
                frags={inCommon}
                myFrags={MF}
                compliments={compliments}
                communityFrags={communityFrags}
                userId={user.id}
                friendId={friend.id }
                friendName={friendName}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}

function FriendCollectionTab({
  frags,
  compliments,
  communityFrags,
  friendId,
  onFragClick,
}: {
  frags: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  friendId: string;
  onFragClick: (frag: UserFragrance) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const sorted = frags.slice().sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <SectionHeader
        title="Collection"
        right={
          <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
            {sorted.length} {sorted.length === 1 ? "fragrance" : "fragrances"}
          </span>
        }
      />
      {sorted.length === 0 ? (
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4">No fragrances.</div>
      ) : (
        <>
          <div className="overflow-x-auto border border-[var(--b2)]">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--b2)]">
                  <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Fragrance</th>
                  <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Size</th>
                  <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Rating</th>
                  <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Added</th>
                  <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Accords</th>
                  <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Compliments</th>
                  <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {(pageSize === 0 ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize)).map((f) => (
                  <FragRow
                    key={f.id}
                    frag={f}
                    communityFrags={communityFrags}
                    compliments={compliments}
                    userId={friendId}
                    onClick={onFragClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            total={sorted.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </>
      )}
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
  const sorted = compliments.slice().sort(
    (a, b) =>
      parseInt(b.year) * 100 + monthNum(b.month) - (parseInt(a.year) * 100 + monthNum(a.month))
  );
  return (
    <>
      <SectionHeader
        title="Compliments"
        right={
          <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
            {sorted.length} {sorted.length === 1 ? "item" : "items"}
          </span>
        }
      />
      {sorted.length === 0 ? (
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4">No compliments.</div>
      ) : (
        <div className="overflow-x-auto border border-[var(--b2)] mb-6">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-[var(--b2)]">
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Fragrance</th>
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Relation</th>
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">When</th>
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Location</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const frag = frags.find((f) => (f.fragranceId || f.id) === c.primaryFragId);
                const fragName = frag?.name ?? c.primaryFrag ?? "\u2014";
                const fragHouse = frag?.house ?? "";
                const mn = monthNum(c.month);
                const mLabel = mn >= 1 && mn <= 12 ? MONTHS[mn - 1] : c.month;
                const when = c.year ? `${mLabel} ${c.year}` : mLabel;
                const location = [c.city, c.country].filter(Boolean).join(", ") || "\u2014";
                return (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--b1)] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="font-[var(--body)] text-sm text-[var(--ink)]">{fragName}</div>
                      {fragHouse && (
                        <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{fragHouse}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink2)]">
                      {c.relation}
                    </td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">{when}</td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">
                      {location}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
  const sorted = frags.slice().sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <SectionHeader
        title="Wishlist"
        right={
          <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
            {sorted.length} {sorted.length === 1 ? "item" : "items"}
          </span>
        }
      />
      {sorted.length === 0 ? (
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4">No wishlist items.</div>
      ) : (
        <div className="overflow-x-auto border border-[var(--b2)] mb-6">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="border-b border-[var(--b2)]">
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Fragrance</th>
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Avg Price</th>
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Accords</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => {
                const accords = getAccords(f, communityFrags).slice(0, 3).join(", ") || "\u2014";
                const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const cf = communityFrags.find(
                  (c) => norm(c.fragranceName) === norm(f.name) && norm(c.fragranceHouse) === norm(f.house)
                );
                const price = (cf?.avgPrice ?? "").replace(/~/g, "") || "\u2014";
                return (
                  <tr
                    key={f.id}
                    className="border-b border-[var(--b1)] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="font-[var(--body)] text-sm text-[var(--ink)]">{f.name}</div>
                      <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{f.house}</div>
                    </td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink2)]">{price}</td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">{accords}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
  const sorted = frags.slice().sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <SectionHeader
        title="In Common"
        right={
          <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
            Both own {sorted.length} {sorted.length === 1 ? "fragrance" : "fragrances"}
          </span>
        }
      />
      {sorted.length === 0 ? (
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4">
          No fragrances in common yet.
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--b2)] mb-6">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="border-b border-[var(--b2)]">
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Fragrance</th>
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Accords</th>
                <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] uppercase font-normal text-[var(--ink3)]">Compliments</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => {
                const myFrag = myFrags.find((mf) => mf.name.toLowerCase() === f.name.toLowerCase());
                const accords = getAccords(f, communityFrags).slice(0, 3).join(", ") || "\u2014";
                const myComps = compliments.filter(
                  (c) => c.userId === userId && c.primaryFragId === (myFrag?.fragranceId || myFrag?.id)
                ).length;
                const friendComps = compliments.filter(
                  (c) => c.userId === friendId && c.primaryFragId === (f.fragranceId || f.id)
                ).length;
                return (
                  <tr
                    key={f.id}
                    className="border-b border-[var(--b1)] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="font-[var(--body)] text-sm text-[var(--ink)]">{f.name}</div>
                      <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{f.house}</div>
                    </td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">{accords}</td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">
                      {myComps > 0 ? (
                        <span>You: <span className="text-[var(--blue)]">{myComps}</span></span>
                      ) : null}
                      {myComps > 0 && friendComps > 0 ? " · " : null}
                      {friendComps > 0 ? (
                        <span>{friendName}: <span className="text-[var(--blue)]">{friendComps}</span></span>
                      ) : null}
                      {myComps === 0 && friendComps === 0 ? "\u2014" : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
