"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { FragRow } from "@/components/ui/frag-row";
import { useUser, getFriend } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { MONTHS, getAccords, monthNum } from "@/lib/frag-utils";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";
import type { UserId } from "@/lib/user-context";

type FriendTab = "collection" | "compliments" | "wishlist" | "incommon";

const FRIEND_TABS: { label: string; value: FriendTab }[] = [
  { label: "Collection", value: "collection" },
  { label: "Compliments", value: "compliments" },
  { label: "Wishlist", value: "wishlist" },
  { label: "In Common", value: "incommon" },
];

export default function FriendPage() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded } = useData();
  const [tab, setTab] = useState<FriendTab>("collection");

  if (!user) return null;

  const friend = getFriend(user);
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
      <Topbar category="Social" title={`${friendName}'s Profile`} />
      <main className="flex-1 overflow-y-auto p-[26px]">
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
                friendId={friend.id as UserId}
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
                friendId={friend.id as UserId}
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
}: {
  frags: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  friendId: UserId;
}) {
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
        <div className="border border-[var(--b2)] mb-6">
          <table className="w-full">
            <tbody>
              {sorted.map((f) => (
                <FragRow
                  key={f.id}
                  frag={f}
                  communityFrags={communityFrags}
                  compliments={compliments}
                  userId={friendId}
                />
              ))}
            </tbody>
          </table>
        </div>
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
        <div className="border border-[var(--b2)] mb-6">
          <table className="w-full">
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
                    className="border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)] cursor-pointer"
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
        <div className="border border-[var(--b2)] mb-6">
          <table className="w-full">
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
                    className="border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)] cursor-pointer"
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
  userId: UserId;
  friendId: UserId;
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
        <div className="border border-[var(--b2)] mb-6">
          <table className="w-full">
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
                    className="border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)] cursor-pointer"
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
