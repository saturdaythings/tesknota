"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { FragDetail } from "@/components/ui/frag-detail";
import { FragForm } from "@/components/ui/frag-form";
import { LogComplimentModal } from "@/components/compliments/log-compliment-modal";
import { StatusBadge } from "@/components/ui/frag-row";
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

const COLLECTION_STATUSES = new Set(["CURRENT", "PREVIOUSLY_OWNED", "FINISHED"]);
const WISHLIST_STATUSES = new Set(["WANT_TO_BUY", "WANT_TO_SMELL", "WANT_TO_IDENTIFY"]);

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
      <Topbar title="Dashboard" />
      <main
        className="flex-1 overflow-y-auto"
        style={{ background: "var(--color-cream)", padding: "32px 24px 40px" }}
      >
        {!isLoaded && (
          <div
            className="text-xs tracking-[0.12em] py-6"
            style={{ fontFamily: "var(--font-sans)", color: "var(--color-navy)" }}
          >
            Loading...
          </div>
        )}

        {isLoaded && !hasCollection && (
          <Onboarding onAddFrag={() => { setEditingFrag(null); setFragFormOpen(true); }} />
        )}

        {isLoaded && hasCollection && (
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
      </main>
    </>
  );
}

// ── Stat Card ─────────────────────────────────────────────

function StatCard({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--color-cream-dark)",
        borderRadius: "6px",
        padding: "24px 24px 20px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          fontSize: "12px",
          color: "var(--color-navy)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 400,
          fontStyle: "italic",
          fontSize: "48px",
          lineHeight: 1,
          color: "var(--color-navy)",
          marginBottom: "8px",
        }}
      >
        {value}
      </div>
      {delta ? (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
            fontSize: "13px",
            color: "var(--color-navy)",
          }}
        >
          {delta}
        </div>
      ) : (
        <div style={{ height: "20px" }} />
      )}
    </div>
  );
}

// ── Quick Actions ──────────────────────────────────────────

function QuickActions({
  onAddFrag,
  onLogCompliment,
}: {
  onAddFrag: () => void;
  onLogCompliment: () => void;
}) {
  return (
    <div className="dash-quick-actions mb-8">
      <ActionBtn icon={<Plus size={16} />} label="Add Fragrance" onClick={onAddFrag} />
      <ActionBtn icon={<MessageCircle size={16} />} label="Log Compliment" onClick={onLogCompliment} />
      <ActionBtn icon={<Upload size={16} />} label="Import File" href="/import" />
      <ActionBtn
        icon={<Flag size={16} />}
        label="Review Collection"
        href="/collection?filter=missing"
      />
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    fontSize: "13px",
    color: "var(--color-navy)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "4px",
    textDecoration: "none",
    transition: "background 0.15s",
  };

  if (href) {
    return (
      <Link href={href} style={style} className="hover:bg-[var(--color-cream-dark)]">
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button style={style} onClick={onClick} className="hover:bg-[var(--color-cream-dark)]">
      {icon}
      {label}
    </button>
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
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: "20px",
          color: "var(--color-navy)",
          marginBottom: "12px",
        }}
      >
        Signature spotlight
      </div>
      {spotlight ? (
        <div
          style={{
            background: "var(--color-navy)",
            borderRadius: "6px",
            padding: "28px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "28px",
              color: "var(--color-cream)",
              lineHeight: 1.15,
              marginBottom: "4px",
            }}
          >
            {spotlight.name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              fontSize: "12px",
              color: "rgba(200,184,154,0.8)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "20px",
            }}
          >
            {spotlight.house}
          </div>
          <div style={{ display: "flex", gap: "28px" }}>
            <SpotStat value={compCount} label="Compliments" />
            <SpotStat value={`${pct}%`} label="of total" />
            <SpotStat value={<StarRow rating={rating} />} label="Your rating" />
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-navy)",
            borderRadius: "6px",
            padding: "28px",
            color: "rgba(245,240,232,0.4)",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
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
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: "16px",
          color: "var(--color-cream)",
          lineHeight: 1,
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 400,
          fontSize: "12px",
          color: "rgba(200,184,154,0.7)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
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
          style={{ color: i < rating ? "rgba(245,240,232,0.7)" : "rgba(245,240,232,0.25)" }}
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
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "20px",
            color: "var(--color-navy)",
          }}
        >
          Scent signature
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            fontSize: "12px",
            color: "var(--color-navy)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Top accords in your collection
        </div>
      </div>
      {top.length === 0 ? (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "var(--color-navy)",
            paddingTop: "8px",
          }}
        >
          No accords data yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {top.map(([accord], i) => (
            <Link
              key={accord}
              href={`/collection?filter=accord:${encodeURIComponent(accord)}`}
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "4px 12px",
                borderRadius: "2px",
                border: "1px solid var(--color-cream-dark)",
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
      <div key={friend.id} style={{ marginBottom: "24px" }}>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "20px",
            color: "var(--color-navy)",
            marginBottom: "12px",
          }}
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
        borderRadius: "6px",
        padding: "20px 24px",
        cursor: onClick ? "pointer" : "default",
      }}
      className={onClick ? "hover:bg-[var(--color-cream-dark)] transition-colors" : ""}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          fontSize: "12px",
          color: "var(--color-navy)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: "20px",
          color: "var(--color-navy)",
          marginBottom: "2px",
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 400,
          fontSize: "13px",
          color: "var(--color-navy)",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

// ── Recent Purchases Table ─────────────────────────────────

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

  const COLS = ["Fragrance", "Size", "Rating", "Added", "Accords", "Compliments", "Status"];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "20px",
            color: "var(--color-navy)",
          }}
        >
          Recent Purchases
        </div>
        <Link
          href="/collection?sort=added-desc"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            fontSize: "12px",
            color: "var(--color-navy)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textDecoration: "none",
          }}
          className="hover:text-[var(--color-navy)] transition-colors"
        >
          View All
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "var(--color-navy)",
            paddingTop: "8px",
          }}
        >
          No fragrances added yet.
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--color-cream-dark)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "640px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-cream-dark)" }}>
                  {COLS.map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 500,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--color-navy)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
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
              </tbody>
            </table>
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
    <tr
      onClick={() => onClick(f)}
      style={{ borderBottom: "1px solid var(--color-cream-dark)", cursor: "pointer" }}
      className="hover:bg-[var(--color-cream-dark)] transition-colors last:border-0"
    >
      <td style={{ padding: "12px 16px" }}>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "15px",
            color: "var(--color-navy)",
          }}
        >
          {f.name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "var(--color-navy)",
            marginTop: "1px",
          }}
        >
          {f.house}
        </div>
      </td>
      <td
        style={{
          padding: "12px 16px",
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          color: "var(--color-navy)",
          whiteSpace: "nowrap",
        }}
      >
        {(f.sizes ?? []).join(", ") || "\u2014"}
      </td>
      <td
        style={{
          padding: "12px 16px",
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          color: "var(--color-navy)",
          whiteSpace: "nowrap",
        }}
      >
        {starsStr(parseRating(f.personalRating))}
      </td>
      <td
        style={{
          padding: "12px 16px",
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          color: "var(--color-navy)",
          whiteSpace: "nowrap",
        }}
      >
        {addedStr || "\u2014"}
      </td>
      <td
        style={{
          padding: "12px 16px",
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          color: "var(--color-navy)",
        }}
      >
        {accords}
      </td>
      <td
        style={{
          padding: "12px 16px",
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          color: compCount > 0 ? "var(--color-navy)" : "var(--color-cream-dark)",
          whiteSpace: "nowrap",
        }}
      >
        {compCount > 0 ? compCount : "\u2014"}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <StatusBadge status={f.status} />
      </td>
    </tr>
  );
}

// ── Onboarding ─────────────────────────────────────────────

function Onboarding({ onAddFrag }: { onAddFrag: () => void }) {
  return (
    <div style={{ maxWidth: "440px", marginTop: "32px" }}>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "26px",
          color: "var(--color-navy)",
          marginBottom: "4px",
        }}
      >
        Welcome to t&#x0119;sknota
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          color: "var(--color-sand)",
          letterSpacing: "0.06em",
          marginBottom: "24px",
        }}
      >
        Your fragrance journey starts here
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <button
          onClick={onAddFrag}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            padding: "16px",
            background: "var(--color-cream-dark)",
            border: "1px solid var(--color-cream-dark)",
            borderRadius: "4px",
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
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            1
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--color-navy)", marginBottom: "2px" }}>
              Add your first fragrance
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-sand)" }}>
              Search by name or import from a spreadsheet
            </div>
          </div>
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            padding: "16px",
            background: "var(--color-cream-dark)",
            border: "1px solid var(--color-cream-dark)",
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
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            2
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--color-navy)", marginBottom: "2px" }}>
              Log your first compliment
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-sand)" }}>
              Record who complimented you, when, and what you were wearing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
