"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { PageContent } from "@/components/layout/PageContent";
import { FragDetail } from "@/components/ui/frag-detail";
import { FragForm } from "@/components/ui/frag-form";
import { LogComplimentModal } from "@/components/compliments/log-compliment-modal";
import { StatusBadge } from "@/components/ui/frag-row";
import { Button } from "@/components/ui/button";
import { FragranceCell } from "@/components/ui/fragrance-cell";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, getFriend } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";
import {
  starsStr,
  parseRating,
  avgRatingStr,
  getAccords,
  getCompCount,
  addedThisMonth,
  monthNum,
  MONTHS,
} from "@/lib/frag-utils";
import { Plus, MessageCircle, Upload, Flag } from "@/components/ui/Icons";
import { FragSearch } from "@/components/ui/frag-search";

const COLLECTION_STATUSES = new Set(["CURRENT", "PREVIOUSLY_OWNED", "FINISHED"]);
const WISHLIST_STATUSES = new Set(["WANT_TO_BUY", "WANT_TO_SMELL", "WANT_TO_IDENTIFY"]);

/* component-internal: skeleton row height */
const SKELETON_ROW_HEIGHT = 'var(--size-row-min)';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profiles } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded, removeFrag } = useData();
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [editingFrag, setEditingFrag] = useState<UserFragrance | null>(null);
  const [fragFormOpen, setFragFormOpen] = useState(false);
  const [compFormOpen, setCompFormOpen] = useState(false);

  if (!user) return null;

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const MF = fragrances.filter((f) => f.userId === user.id);
  const MC = compliments.filter((c) => c.userId === user.id);

  const collectionFrags = MF.filter((f) => COLLECTION_STATUSES.has(f.status));
  const wishlistFrags = MF.filter((f) => WISHLIST_STATUSES.has(f.status));
  const ratedFrags = MF.filter((f) => f.personalRating);

  const collDelta = addedThisMonth(collectionFrags, curMonth, curYear);
  const compDelta = addedThisMonth(MC, curMonth, curYear);
  const wishDelta = addedThisMonth(wishlistFrags, curMonth, curYear);
  const avgRat = avgRatingStr(MF);

  async function handleDeleteFrag(frag: UserFragrance) {
    await removeFrag(frag.id);
    setDetailFrag(null);
  }

  const hasCollection = collectionFrags.length > 0;

  return (
    <>
      <FragDetail
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        frag={detailFrag}
        communityFrags={communityFrags}
        compliments={MC}
        userId={user.id}
        onEdit={(frag) => { setEditingFrag(frag); setFragFormOpen(true); }}
        onDelete={handleDeleteFrag}
      />
      <FragForm
        open={fragFormOpen}
        onClose={() => setFragFormOpen(false)}
        editing={editingFrag}
      />
      <LogComplimentModal
        open={compFormOpen}
        onClose={() => setCompFormOpen(false)}
      />
      <Topbar title="Dashboard" actions={<FragSearch />} />
      <PageContent>
        {!isLoaded ? (
          <DashboardSkeleton />
        ) : !hasCollection ? (
          <Onboarding onAddFrag={() => { setEditingFrag(null); setFragFormOpen(true); }} />
        ) : (
          <>
            {/* ── Stat Cards ─────────────────────────── */}
            <div className="dash-stat-grid mb-5">
              <StatCard
                label="Collection"
                value={collectionFrags.length}
                delta={collDelta > 0 ? `+${collDelta} this mo` : undefined}
              />
              <StatCard
                label="Compliments"
                value={MC.length}
                delta={compDelta > 0 ? `+${compDelta} this mo` : undefined}
              />
              <StatCard
                label="Wishlist"
                value={wishlistFrags.length}
                delta={wishDelta > 0 ? `+${wishDelta} this mo` : undefined}
              />
              <StatCard
                label="Avg Rating"
                value={avgRat}
                delta={ratedFrags.length > 0 ? `${ratedFrags.length} rated` : undefined}
              />
            </div>

            {/* ── Quick Actions ───────────────────────── */}
            <QuickActions
              onAddFrag={() => { setEditingFrag(null); setFragFormOpen(true); }}
              onLogCompliment={() => setCompFormOpen(true)}
            />

            {/* ── Spotlight + Scent Signature ─────────── */}
            <div className="dash-spotlight-grid mb-6">
              <SignatureSpotlight MF={MF} MC={MC} />
              <ScentSignature frags={MF} communityFrags={communityFrags} />
            </div>

            {/* ── Friend's Recent Activity ─────────────── */}
            <FriendActivity
              fragrances={fragrances}
              compliments={compliments}
              currentUserId={user.id}
              profiles={profiles}
            />

            {/* ── Recent Purchases Table ───────────────── */}
            <RecentPurchases
              frags={MF}
              compliments={MC}
              communityFrags={communityFrags}
              userId={user.id}
              onFragClick={setDetailFrag}
            />
          </>
        )}
      </PageContent>
    </>
  );
}

// ── Stat Card ─────────────────────────────────────────────

function StatCard({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <div
      style={{
        background: "#FFFFFF", /* component-internal: no white token — nearest is var(--color-cream) but intentionally white for contrast */
        border: "1px solid var(--color-cream-dark)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-6) var(--space-6) var(--space-5)",
      }}
    >
      <div
        className="font-sans uppercase"
        style={{
          fontWeight: 500,
          fontSize: "var(--text-xs)",
          color: "var(--color-navy)",
          letterSpacing: "var(--tracking-lg)",
          marginBottom: "var(--space-2)",
        }}
      >
        {label}
      </div>
      <div
        className="font-serif italic"
        style={{
          fontWeight: 400,
          fontSize: "48px", /* component-internal: no token between --text-page-title (24px) and --text-hero (56px) */
          lineHeight: 1,
          color: "var(--color-navy)",
          marginBottom: "var(--space-2)",
        }}
      >
        {value}
      </div>
      {delta ? (
        <div
          className="font-sans"
          style={{ fontWeight: 400, fontSize: "var(--text-sm)", color: "var(--color-navy)" }}
        >
          {delta}
        </div>
      ) : (
        <div style={{ height: "var(--space-5)" }} />
      )}
    </div>
  );
}

// ── Quick Actions ──────────────────────────────────────────

const linkGhostClass =
  "inline-flex items-center gap-2 font-sans font-medium cursor-pointer transition-colors duration-150 " +
  "select-none no-underline px-4 rounded-[3px] text-[13px] leading-none tracking-[0.08em] min-h-8 " +
  "bg-transparent text-[var(--color-navy)] hover:bg-[var(--color-sand-light)]";

function QuickActions({
  onAddFrag,
  onLogCompliment,
}: {
  onAddFrag: () => void;
  onLogCompliment: () => void;
}) {
  return (
    <div className="dash-quick-actions mb-8">
      <Button variant="ghost" size="sm" onClick={onAddFrag}>
        <Plus size={16} />
        Add Fragrance
      </Button>
      <Button variant="ghost" size="sm" onClick={onLogCompliment}>
        <MessageCircle size={16} />
        Log Compliment
      </Button>
      <Link href="/import" className={linkGhostClass}>
        <Upload size={16} />
        Import File
      </Link>
      <Link href="/collection?filter=missing" className={linkGhostClass}>
        <Flag size={16} />
        Review Collection
      </Link>
    </div>
  );
}

// ── Signature Spotlight ────────────────────────────────────

function SignatureSpotlight({
  MF,
  MC,
}: {
  MF: UserFragrance[];
  MC: UserCompliment[];
}) {
  const fragCompCounts: Record<string, number> = {};
  MC.forEach((c) => {
    const key = c.primaryFragId ?? "";
    if (key) fragCompCounts[key] = (fragCompCounts[key] ?? 0) + 1;
  });

  let spotlight: UserFragrance | null = null;

  const hasCompliments = Object.keys(fragCompCounts).length > 0;

  if (hasCompliments) {
    const ranked = MF.filter((f) => {
      const key = f.fragranceId || f.id;
      return (fragCompCounts[key] ?? 0) > 0;
    }).sort((a, b) => {
      const ka = a.fragranceId || a.id;
      const kb = b.fragranceId || b.id;
      const ca = fragCompCounts[ka] ?? 0;
      const cb = fragCompCounts[kb] ?? 0;
      if (cb !== ca) return cb - ca;
      return parseRating(b.personalRating) - parseRating(a.personalRating);
    });
    spotlight = ranked[0] ?? null;
  } else {
    const sorted = [...MF]
      .filter((f) => !WISHLIST_STATUSES.has(f.status))
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    spotlight = sorted[0] ?? null;
  }

  const totalComps = MC.length;
  const spotKey = spotlight ? (spotlight.fragranceId || spotlight.id) : "";
  const compCount = spotKey ? (fragCompCounts[spotKey] ?? 0) : 0;
  const pct = totalComps > 0 ? Math.round((compCount / totalComps) * 100) : 0;
  const rating = parseRating(spotlight?.personalRating);

  return (
    <div>
      <div
        className="font-serif italic"
        style={{ fontSize: "var(--text-lg)", color: "var(--color-navy)", marginBottom: "var(--space-3)" }}
      >
        Signature spotlight
      </div>
      {spotlight ? (
        <div
          style={{
            background: "var(--color-navy)",
            borderRadius: "var(--radius-lg)",
            padding: "28px", /* component-internal: no token between --space-6 (24px) and --space-8 (32px) */
          }}
        >
          <div
            className="font-serif italic"
            style={{
              fontSize: "var(--text-logo)",
              color: "var(--color-cream)",
              lineHeight: 1.15,
              marginBottom: "var(--space-1)",
            }}
          >
            {spotlight.name}
          </div>
          <div
            className="font-sans uppercase"
            style={{
              fontWeight: 500,
              fontSize: "var(--text-xs)",
              color: "var(--color-sand-muted)",
              letterSpacing: "var(--tracking-md)",
              marginBottom: "var(--space-5)",
            }}
          >
            {spotlight.house}
          </div>
          <div style={{ display: "flex", gap: "28px" /* component-internal: no token near 28px */ }}>
            <SpotStat value={compCount} label="Compliments" />
            <SpotStat value={`${pct}%`} label="of total" />
            <SpotStat value={<StarRow rating={rating} />} label="Your rating" />
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-navy)",
            borderRadius: "var(--radius-lg)",
            padding: "28px",
            color: "rgba(245,240,232,0.4)", /* component-internal: no token for this opacity */
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm)",
          }}
        >
          Add fragrances to see your spotlight.
        </div>
      )}
    </div>
  );
}

function SpotStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div
        className="font-sans"
        style={{
          fontWeight: 600,
          fontSize: "var(--text-note)",
          color: "var(--color-cream)",
          lineHeight: 1,
          marginBottom: "var(--space-1)",
        }}
      >
        {value}
      </div>
      <div
        className="font-sans uppercase"
        style={{
          fontWeight: 400,
          fontSize: "var(--text-xs)",
          color: "rgba(200,184,154,0.7)", /* component-internal: between --color-sand-label (0.60) and --color-sand-muted (0.80) */
          letterSpacing: "var(--tracking-sm)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            color: i < rating
              ? "var(--color-cream-muted)"
              : "rgba(245,240,232,0.25)", /* component-internal: no token for this opacity */
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ── Scent Signature ────────────────────────────────────────

function ScentSignature({
  frags,
  communityFrags,
}: {
  frags: UserFragrance[];
  communityFrags: CommunityFrag[];
}) {
  const acCounts: Record<string, number> = {};
  frags.forEach((f) => {
    getAccords(f, communityFrags).forEach((a) => {
      acCounts[a] = (acCounts[a] ?? 0) + 1;
    });
  });

  const top = Object.entries(acCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "var(--space-3)",
        }}
      >
        <div
          className="font-serif italic"
          style={{ fontSize: "var(--text-lg)", color: "var(--color-navy)" }}
        >
          Scent signature
        </div>
        <div
          className="font-sans uppercase"
          style={{
            fontWeight: 500,
            fontSize: "var(--text-xs)",
            color: "var(--color-navy)",
            letterSpacing: "var(--tracking-md)",
          }}
        >
          Top accords in your collection
        </div>
      </div>
      {top.length === 0 ? (
        <div
          className="font-sans"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-navy)", paddingTop: "var(--space-2)" }}
        >
          No accords data yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {top.map(([accord], i) => (
            <Link
              key={accord}
              href={`/collection?filter=accord:${encodeURIComponent(accord)}`}
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: "var(--text-xs)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-sm)",
                padding: "var(--space-1) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-sand-light)",
                textDecoration: "none",
                background: i === 0 ? "var(--color-navy)" : "var(--color-cream-dark)",
                color: i === 0 ? "var(--color-cream)" : "var(--color-navy)",
                transition: "opacity 0.15s",
              }}
            >
              {accord}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Friend Activity ────────────────────────────────────────

function FriendActivity({
  fragrances,
  compliments,
  currentUserId,
  profiles,
}: {
  fragrances: UserFragrance[];
  compliments: UserCompliment[];
  currentUserId: string;
  profiles: ReturnType<typeof useUser>["profiles"];
}) {
  const router = useRouter();
  const friends = profiles.filter((p) => p.id !== currentUserId);

  if (!friends.length) return null;

  const sections: React.ReactNode[] = [];

  for (const friend of friends) {
    const FF = fragrances.filter((f) => f.userId === friend.id);
    const FC = compliments.filter((c) => c.userId === friend.id);

    const recentPurchase = FF.filter((f) => !WISHLIST_STATUSES.has(f.status))
      .slice()
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0] ?? null;

    const recentComp = FC.slice().sort(
      (a, b) =>
        parseInt(b.year) * 100 + monthNum(b.month) -
        (parseInt(a.year) * 100 + monthNum(a.month))
    )[0] ?? null;

    if (!recentPurchase && !recentComp) continue;

    const compFrag = recentComp
      ? FF.find((f) => (f.fragranceId || f.id) === recentComp.primaryFragId) ?? null
      : null;

    const compMonthStr = recentComp
      ? [
          recentComp.relation,
          recentComp.year
            ? `${MONTHS[(monthNum(recentComp.month) - 1) || 0] ?? ""} ${recentComp.year}`
            : "",
        ]
          .filter(Boolean)
          .join(" \u00B7 ")
      : "";

    sections.push(
      <div key={friend.id} style={{ marginBottom: "var(--space-6)" }}>
        <div
          className="font-serif italic"
          style={{ fontSize: "var(--text-lg)", color: "var(--color-navy)", marginBottom: "var(--space-3)" }}
        >
          <Link
            href="/friend"
            style={{ color: "inherit", textDecoration: "none" }}
            className="hover:underline"
          >
            {friend.name}&rsquo;s recent activity
          </Link>
        </div>
        <div className="dash-activity-grid">
          {recentPurchase && (
            <ActivityCard
              label="Latest Purchase"
              name={recentPurchase.name}
              sub={recentPurchase.house}
              onClick={() => router.push("/friend")}
            />
          )}
          {recentComp && (
            <ActivityCard
              label="Latest Compliment"
              name={compFrag?.name ?? recentComp.primaryFrag ?? "\u2014"}
              sub={compMonthStr}
              onClick={() => router.push("/friend")}
            />
          )}
        </div>
      </div>
    );
  }

  return <>{sections}</>;
}

function ActivityCard({
  label,
  name,
  sub,
  onClick,
}: {
  label: string;
  name: string;
  sub: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid var(--color-cream-dark)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5) var(--space-6)",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = "var(--color-row-hover)"; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.background = "transparent"; }}
    >
      <div
        className="font-sans uppercase"
        style={{
          fontWeight: 500,
          fontSize: "var(--text-xs)",
          color: "var(--color-navy)",
          letterSpacing: "var(--tracking-lg)",
          marginBottom: "var(--space-2)",
        }}
      >
        {label}
      </div>
      <div
        className="font-serif italic"
        style={{
          fontSize: "var(--text-lg)",
          color: "var(--color-navy)",
          marginBottom: "var(--space-half)",
        }}
      >
        {name}
      </div>
      <div
        className="font-sans"
        style={{ fontWeight: 400, fontSize: "var(--text-sm)", color: "var(--color-navy)" }}
      >
        {sub}
      </div>
    </div>
  );
}

// ── Recent Purchases Table ─────────────────────────────────

const PURCHASE_COLS = ["Fragrance", "Size", "Rating", "Added", "Accords", "Compliments", "Status"];
const PURCHASE_GRID = "minmax(200px,1fr) max-content max-content max-content 180px max-content max-content";

function RecentPurchases({
  frags,
  compliments,
  communityFrags,
  userId,
  onFragClick,
}: {
  frags: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  userId: string;
  onFragClick: (frag: UserFragrance) => void;
}) {
  const sorted = frags
    .filter((f) => !WISHLIST_STATUSES.has(f.status))
    .slice()
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-3)",
        }}
      >
        <div
          className="font-serif italic"
          style={{ fontSize: "var(--text-lg)", color: "var(--color-navy)" }}
        >
          Recent Purchases
        </div>
        <Link
          href="/collection?sort=added-desc"
          className="font-sans uppercase hover:opacity-70 transition-opacity"
          style={{
            fontWeight: 500,
            fontSize: "var(--text-xs)",
            color: "var(--color-navy)",
            letterSpacing: "var(--tracking-md)",
            textDecoration: "none",
          }}
        >
          View All
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div
          className="font-sans"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-navy)", paddingTop: "var(--space-2)" }}
        >
          No fragrances added yet.
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--color-sand-light)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <div
              className="hidden md:grid"
              style={{ gridTemplateColumns: PURCHASE_GRID, columnGap: "var(--space-10)", minWidth: "640px" }}
            >
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "subgrid",
                  gridColumn: "1 / -1",
                  background: "var(--color-cream-dark)",
                  borderBottom: "1px solid var(--color-row-divider)",
                  height: "var(--space-10)",
                  alignItems: "center",
                }}
              >
                {PURCHASE_COLS.map((h) => (
                  <div
                    key={h}
                    className="font-sans uppercase"
                    style={{
                      padding: "0 var(--space-4)",
                      fontWeight: 500,
                      fontSize: "var(--text-xxs)",
                      letterSpacing: "var(--tracking-md)",
                      color: "var(--color-navy)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {sorted.map((f) => (
                <PurchaseRow
                  key={f.id}
                  frag={f}
                  compliments={compliments}
                  communityFrags={communityFrags}
                  userId={userId}
                  onClick={onFragClick}
                />
              ))}
            </div>

            {/* Mobile fallback */}
            <div className="md:hidden">
              {sorted.map((f) => {
                const compCount = getCompCount(f.fragranceId || f.id, compliments, userId);
                return (
                  <div
                    key={f.id}
                    onClick={() => onFragClick(f)}
                    className="cursor-pointer"
                    style={{ padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--color-row-divider)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-row-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <FragranceCell name={f.name} house={f.house} type={f.type ?? null} />
                    {compCount > 0 && (
                      <div className="font-sans uppercase mt-1" style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)", letterSpacing: "var(--tracking-md)" }}>
                        {compCount} compliment{compCount !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PurchaseRow({
  frag: f,
  compliments,
  communityFrags,
  userId,
  onClick,
}: {
  frag: UserFragrance;
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  userId: string;
  onClick: (frag: UserFragrance) => void;
}) {
  const compCount = getCompCount(f.fragranceId || f.id, compliments, userId);
  const accords = getAccords(f, communityFrags).slice(0, 3).join(", ") || "\u2014";
  const addedStr = f.purchaseDate ??
    (f.createdAt
      ? `${MONTHS[new Date(f.createdAt).getMonth()]} ${new Date(f.createdAt).getFullYear()}`
      : "");

  return (
    <div
      onClick={() => onClick(f)}
      className="cursor-pointer transition-colors duration-100"
      style={{
        display: "grid",
        gridTemplateColumns: "subgrid",
        gridColumn: "1 / -1",
        alignItems: "center",
        minHeight: "var(--space-16)",
        borderBottom: "1px solid var(--color-row-divider)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-row-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ padding: "0 var(--space-4)", minWidth: 0 }}>
        <FragranceCell name={f.name} house={f.house} type={f.type ?? null} />
      </div>
      <div style={{ padding: "0 var(--space-4)" }}>
        <span className="font-sans uppercase" style={{ fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-md)", color: "var(--color-navy)", whiteSpace: "nowrap" }}>
          {(f.sizes ?? []).join(", ") || "\u2014"}
        </span>
      </div>
      <div style={{ padding: "0 var(--space-4)" }}>
        <span className="font-sans uppercase" style={{ fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-md)", color: "var(--color-navy)", whiteSpace: "nowrap" }}>
          {starsStr(parseRating(f.personalRating))}
        </span>
      </div>
      <div style={{ padding: "0 var(--space-4)" }}>
        <span className="font-sans uppercase" style={{ fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-md)", color: "var(--color-navy)", whiteSpace: "nowrap" }}>
          {addedStr || "\u2014"}
        </span>
      </div>
      <div style={{ padding: "0 var(--space-4)", minWidth: 0 }}>
        <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-navy)" }}>
          {accords}
        </span>
      </div>
      <div style={{ padding: "0 var(--space-4)" }}>
        <span
          className="font-sans uppercase"
          style={{
            fontSize: "var(--text-xs)",
            letterSpacing: "var(--tracking-md)",
            color: compCount > 0 ? "var(--color-navy)" : "var(--color-meta-text)",
            whiteSpace: "nowrap",
          }}
        >
          {compCount > 0 ? compCount : "\u2014"}
        </span>
      </div>
      <div style={{ padding: "0 var(--space-4)" }}>
        <StatusBadge status={f.status} />
      </div>
    </div>
  );
}

// ── Onboarding ─────────────────────────────────────────────

function Onboarding({ onAddFrag }: { onAddFrag: () => void }) {
  return (
    <div style={{ maxWidth: "440px", marginTop: "var(--space-8)" }}>
      <div
        className="font-serif italic"
        style={{ fontSize: "var(--text-xl)", color: "var(--color-navy)", marginBottom: "var(--space-1)" }}
      >
        Welcome to t&#x0119;sknota
      </div>
      <div
        className="font-sans"
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-meta-text)",
          letterSpacing: "0.06em", /* component-internal: no token between --tracking-xs (0.04em) and --tracking-sm (0.08em) */
          marginBottom: "var(--space-6)",
        }}
      >
        Your fragrance journey starts here
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <button
          onClick={onAddFrag}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--space-4)",
            padding: "var(--space-4)",
            background: "var(--color-cream-dark)",
            border: "1px solid var(--color-sand-light)",
            borderRadius: "4px", /* component-internal: no token between --radius-md (3px) and --radius-lg (6px) */
            textAlign: "left",
            width: "100%",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              flexShrink: 0,
              borderRadius: "50%",
              background: "var(--color-navy)",
              color: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            1
          </div>
          <div>
            <div
              className="font-sans"
              style={{ fontSize: "var(--text-ui)", color: "var(--color-navy)", marginBottom: "var(--space-half)" }}
            >
              Add your first fragrance
            </div>
            <div
              className="font-sans"
              style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}
            >
              Search by name or import from a spreadsheet
            </div>
          </div>
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--space-4)",
            padding: "var(--space-4)",
            background: "var(--color-cream-dark)",
            border: "1px solid var(--color-sand-light)",
            borderRadius: "4px",
            opacity: 0.5,
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              flexShrink: 0,
              borderRadius: "50%",
              background: "var(--color-sand)",
              color: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            2
          </div>
          <div>
            <div
              className="font-sans"
              style={{ fontSize: "var(--text-ui)", color: "var(--color-navy)", marginBottom: "var(--space-half)" }}
            >
              Log your first compliment
            </div>
            <div
              className="font-sans"
              style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}
            >
              Record who complimented you, when, and what you were wearing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Skeleton ─────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: SKELETON_ROW_HEIGHT,
            borderBottom: "1px solid var(--color-row-divider)",
            background: "var(--color-row-hover)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-1)",
          }}
        />
      ))}
    </div>
  );
}
