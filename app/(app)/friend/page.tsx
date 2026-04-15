"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { FragDetail } from "@/components/ui/frag-detail";
import { AccordCloud } from "@/components/ui/accord-cloud";
import { Pagination } from "@/components/ui/pagination";
import { useUser, getFriend } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { MONTHS, getAccords, monthNum } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";

type FriendTab = "collection" | "compliments" | "wishlist" | "incommon";

const FRIEND_TABS: { label: string; value: FriendTab }[] = [
  { label: "Collection", value: "collection" },
  { label: "Compliments", value: "compliments" },
  { label: "Wishlist", value: "wishlist" },
  { label: "In Common", value: "incommon" },
];

const thStyle: React.CSSProperties = {
  padding: "var(--space-2) var(--space-4)",
  textAlign: "left",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
};

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

  const friendAccordCounts: [string, number][] = (() => {
    const counts: Record<string, number> = {};
    FFOwned.forEach((f) => {
      getAccords(f, communityFrags).forEach((a) => {
        counts[a] = (counts[a] ?? 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  })();

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
      <Topbar title={`${friendName}'s Profile`} />
      <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-5) var(--space-4)" }}>
        {!isLoaded && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", letterSpacing: "0.1em", padding: "var(--space-6) 0" }}>
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

            {friendAccordCounts.length > 0 && (
              <div style={{ marginBottom: "var(--space-6)" }}>
                <SectionHeader
                  title="Scent signature"
                  right={
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {friendName}&apos;s accords
                    </span>
                  }
                />
                <AccordCloud accords={friendAccordCounts} />
              </div>
            )}

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
                friendId={friend.id}
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
                friendId={friend.id}
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
  onFragClick,
}: {
  frags: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  friendId: string;
  onFragClick: (frag: UserFragrance) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const sorted = frags.slice().sort((a, b) => a.name.localeCompare(b.name));
  const pageFrags = pageSize === 0 ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);
  return (
    <>
      <SectionHeader
        title="Collection"
        right={
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {sorted.length} {sorted.length === 1 ? "fragrance" : "fragrances"}
          </span>
        }
      />
      {sorted.length === 0 ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", padding: "var(--space-4) 0" }}>No fragrances.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            {pageFrags.map((f) => {
              const comps = compliments.filter((c) => c.primaryFragId === (f.fragranceId || f.id)).length;
              const accords = getAccords(f, communityFrags).slice(0, 3).join(", ");
              return (
                <div
                  key={f.id}
                  onClick={() => onFragClick(f)}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--space-3) var(--space-4)",
                    cursor: "pointer",
                    transition: "background var(--transition-fast)",
                  }}
                  className="hover:bg-[var(--color-surface-raised)]"
                >
                  <div style={{ fontSize: "var(--text-xs)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "var(--space-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.house}</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)", lineHeight: "var(--leading-snug)" }}>{f.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      {STATUS_LABELS[f.status as keyof typeof STATUS_LABELS] ?? f.status}
                    </span>
                    {f.personalRating ? (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)" }}>{"★".repeat(f.personalRating)}</span>
                    ) : null}
                    {comps > 0 ? (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)" }}>{comps} comp{comps !== 1 ? "s" : ""}</span>
                    ) : null}
                    {accords ? (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{accords}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
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
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {sorted.length} {sorted.length === 1 ? "item" : "items"}
          </span>
        }
      />
      {sorted.length === 0 ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", padding: "var(--space-4) 0" }}>No compliments.</div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-6)" }}>
          <table style={{ width: "100%", minWidth: "480px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={thStyle}>Fragrance</th>
                <th style={thStyle}>Relation</th>
                <th style={thStyle}>When</th>
                <th style={thStyle}>Location</th>
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
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                    className="last:border-0"
                  >
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{fragName}</div>
                      {fragHouse && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{fragHouse}</div>
                      )}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      {c.relation}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{when}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
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
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {sorted.length} {sorted.length === 1 ? "item" : "items"}
          </span>
        }
      />
      {sorted.length === 0 ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", padding: "var(--space-4) 0" }}>No wishlist items.</div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-6)" }}>
          <table style={{ width: "100%", minWidth: "420px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={thStyle}>Fragrance</th>
                <th style={thStyle}>Avg Price</th>
                <th style={thStyle}>Accords</th>
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
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                    className="last:border-0"
                  >
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{f.name}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{f.house}</div>
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{price}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{accords}</td>
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
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Both own {sorted.length} {sorted.length === 1 ? "fragrance" : "fragrances"}
          </span>
        }
      />
      {sorted.length === 0 ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", padding: "var(--space-4) 0" }}>
          No fragrances in common yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-6)" }}>
          <table style={{ width: "100%", minWidth: "420px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={thStyle}>Fragrance</th>
                <th style={thStyle}>Accords</th>
                <th style={thStyle}>Compliments</th>
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
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                    className="last:border-0"
                  >
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{f.name}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{f.house}</div>
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{accords}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {myComps > 0 ? (
                        <span>You: <span style={{ color: "var(--color-accent)" }}>{myComps}</span></span>
                      ) : null}
                      {myComps > 0 && friendComps > 0 ? " · " : null}
                      {friendComps > 0 ? (
                        <span>{friendName}: <span style={{ color: "var(--color-accent)" }}>{friendComps}</span></span>
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
