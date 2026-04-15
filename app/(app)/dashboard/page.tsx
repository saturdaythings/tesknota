"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { useUser, getFriend, USERS } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { STATUS_LABELS, STATUS_CSS } from "@/types";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";
import type { UserId } from "@/lib/user-context";
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

const WISHLIST_STATUSES = new Set(["WANT_TO_BUY", "WANT_TO_SMELL", "WANT_TO_IDENTIFY"]);

export default function DashboardPage() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded } = useData();

  if (!user) return null;

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const MF = fragrances.filter((f) => f.userId === user.id);
  const MC = compliments.filter((c) => c.userId === user.id);
  const current = MF.filter((f) => f.status === "CURRENT");
  const wish = MF.filter((f) => WISHLIST_STATUSES.has(f.status));

  const ratedThisMonth = MF.filter((f) => {
    if (!f.personalRating || !f.createdAt) return false;
    const dt = new Date(f.createdAt);
    return dt.getMonth() + 1 === curMonth && dt.getFullYear() === curYear;
  });

  const collDelta = addedThisMonth(MF, curMonth, curYear);
  const compDelta = addedThisMonth(MC, curMonth, curYear);
  const wishDelta = addedThisMonth(wish, curMonth, curYear);
  const avgRat = avgRatingStr(MF);
  const avgRatDelta = ratedThisMonth.length > 0 ? `+${ratedThisMonth.length} rated` : "";

  const hasCurrent = current.length > 0;

  return (
    <>
      <Topbar category="My Space" title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-[26px]">
        {!isLoaded && (
          <div className="text-[var(--ink3)] font-[var(--mono)] text-xs tracking-[0.12em] py-6">
            Loading...
          </div>
        )}

        {isLoaded && !hasCurrent && (
          <Onboarding />
        )}

        {isLoaded && hasCurrent && (
          <>
            <DQBanner frags={current} />

            <StatsGrid className="mb-6">
              <StatBox value={MF.length} label="Collection" delta={collDelta > 0 ? `+${collDelta} this mo` : ""} />
              <StatBox value={MC.length} label="Compliments" delta={compDelta > 0 ? `+${compDelta} this mo` : ""} />
              <StatBox value={wish.length} label="Wishlist" delta={wishDelta > 0 ? `+${wishDelta} this mo` : ""} />
              <StatBox value={avgRat} label="Avg Rating" delta={avgRatDelta} />
            </StatsGrid>

            <div className="grid gap-6 [grid-template-columns:1fr_1fr] mb-6">
              <Spotlight MF={MF} MC={MC} />
              <ScentSignature frags={current} communityFrags={communityFrags} />
            </div>

            <RecentFragrances frags={MF} compliments={MC} communityFrags={communityFrags} userId={user.id} />

            <FriendActivity fragrances={fragrances} compliments={compliments} currentUserId={user.id} />
          </>
        )}
      </main>
    </>
  );
}

// ── Onboarding ───────────────────────────────────────────

function Onboarding() {
  return (
    <div className="max-w-[440px] mt-8">
      <div className="font-[var(--serif)] text-[26px] text-[var(--blue)] mb-1">
        Welcome to t&#x0119;sknota
      </div>
      <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] mb-6">
        Your fragrance journey starts here
      </div>
      <div className="flex flex-col gap-4">
        <OnboardStep
          num="1"
          title="Add your first fragrance"
          desc="Search by name or import from a spreadsheet"
        />
        <OnboardStep
          num="2"
          title="Log your first compliment"
          desc="Record who complimented you, when, and what you were wearing"
        />
      </div>
    </div>
  );
}

function OnboardStep({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-[var(--off2)] border border-[var(--b2)]">
      <div className="w-6 h-6 shrink-0 rounded-full bg-[var(--blue)] text-white font-[var(--mono)] text-xs flex items-center justify-center">
        {num}
      </div>
      <div>
        <div className="font-[var(--body)] text-sm text-[var(--ink)] mb-[2px]">{title}</div>
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{desc}</div>
      </div>
    </div>
  );
}

// ── DQ Banner ────────────────────────────────────────────

function DQBanner({ frags }: { frags: UserFragrance[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !frags.length) return null;

  const missingRating = frags.filter((f) => !f.personalRating).length;
  const missingNotes = frags.filter((f) => !(f.personalNotes ?? "").trim()).length;
  const incomplete = frags.filter((f) => !f.personalRating || !(f.personalNotes ?? "").trim()).length;

  if (!incomplete) return null;

  const topField = missingRating >= missingNotes ? "rating" : "notes";

  return (
    <div className="flex items-center justify-between bg-[var(--warm3)] border border-[var(--warm2)] px-4 py-[10px] mb-5 text-sm">
      <span className="font-[var(--body)] text-[var(--warm-text)]">
        {incomplete} {incomplete === 1 ? "fragrance is" : "fragrances are"} missing {topField} &mdash; add it to improve your insights.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="font-[var(--mono)] text-xs text-[var(--ink3)] hover:text-[var(--ink)] ml-4 shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}

// ── Signature Spotlight ──────────────────────────────────

function Spotlight({ MF, MC }: { MF: UserFragrance[]; MC: UserCompliment[] }) {
  const fragCompCounts: Record<string, number> = {};
  MC.forEach((c) => {
    if (c.primaryFragId) fragCompCounts[c.primaryFragId] = (fragCompCounts[c.primaryFragId] ?? 0) + 1;
  });

  const sorted = Object.entries(fragCompCounts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;

  const [topFragId, topCt] = sorted[0];
  const topFrag = MF.find((f) => (f.fragranceId || f.id) === topFragId);
  if (!topFrag) return null;

  const pctOfTotal = MC.length > 0 ? Math.round((topCt / MC.length) * 100) : 0;

  return (
    <div>
      <SectionHeader title="Signature spotlight" />
      <div className="bg-[var(--blue4)] border border-[var(--b2)] p-5">
        <div className="font-[var(--serif)] text-[22px] text-[var(--blue)] leading-tight mb-[2px]">
          {topFrag.name}
        </div>
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] mb-4">
          {topFrag.house}
        </div>
        <div className="flex gap-5">
          <SpotStat value={topCt} label="compliments" />
          <SpotStat value={`${pctOfTotal}%`} label="of total" />
          <SpotStat value={starsStr(parseRating(topFrag.personalRating))} label="your rating" />
        </div>
      </div>
    </div>
  );
}

function SpotStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="font-[var(--serif)] text-[20px] text-[var(--blue)] leading-none">{value}</div>
      <div className="font-[var(--mono)] text-[10px] text-[var(--ink3)] tracking-[0.12em] uppercase mt-[3px]">
        {label}
      </div>
    </div>
  );
}

// ── Scent Signature ──────────────────────────────────────

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

  const top = Object.entries(acCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!top.length) return null;

  const sizeClass = (i: number) => (i === 0 ? "text-[15px]" : i <= 2 ? "text-[13px]" : "text-[11px]");

  return (
    <div>
      <SectionHeader title="Scent signature" right={<span className="font-[var(--mono)] text-xs text-[var(--ink3)]">Top accords in your collection</span>} />
      <div className="flex flex-wrap gap-[6px]">
        {top.map(([accord], i) => (
          <span
            key={accord}
            className={`font-[var(--mono)] tracking-[0.08em] px-3 py-[5px] bg-[var(--off2)] border border-[var(--b2)] text-[var(--ink2)] cursor-default ${sizeClass(i)}`}
          >
            {accord}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Recent Fragrances ────────────────────────────────────

function RecentFragrances({
  frags,
  compliments,
  communityFrags,
  userId,
}: {
  frags: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  userId: UserId;
}) {
  const sorted = frags
    .filter((f) => !WISHLIST_STATUSES.has(f.status))
    .slice()
    .sort((a, b) => {
      const da = a.createdAt ?? "";
      const db = b.createdAt ?? "";
      return db > da ? 1 : db < da ? -1 : 0;
    })
    .slice(0, 3);

  return (
    <div className="mb-6">
      <SectionHeader title="Recently added" />
      {sorted.length === 0 ? (
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4">
          Your collection is empty.
        </div>
      ) : (
        <div className="border border-[var(--b2)]">
          <table className="w-full">
            <tbody>
              {sorted.map((f) => (
                <RecentRow
                  key={f.id}
                  frag={f}
                  compliments={compliments}
                  communityFrags={communityFrags}
                  userId={userId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecentRow({
  frag: f,
  compliments,
  communityFrags,
  userId,
}: {
  frag: UserFragrance;
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  userId: UserId;
}) {
  const compCount = getCompCount(f.fragranceId || f.id, compliments, userId);
  const accords = getAccords(f, communityFrags).join(", ") || "\u2014";
  const addedStr = f.purchaseDate ?? (f.createdAt ? `${MONTHS[new Date(f.createdAt).getMonth()]} ${new Date(f.createdAt).getFullYear()}` : "");

  return (
    <tr className="border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)] cursor-pointer">
      <td className="px-4 py-3">
        <div className="font-[var(--body)] text-sm text-[var(--ink)]">
          {f.name}
          {f.isDupe && (
            <span className="ml-2 text-[11px] bg-[var(--ink3)] text-[var(--off)] rounded px-[4px] py-[1px] align-middle tracking-[0.04em]">
              DUPE
            </span>
          )}
        </div>
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{f.house}</div>
      </td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink2)]">
        {(f.sizes ?? []).join(", ") || "\u2014"}
      </td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--warm-text)] tracking-[1px]">
        {starsStr(parseRating(f.personalRating))}
      </td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">
        {addedStr || "\u2014"}
      </td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">{accords}</td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">
        {compCount > 0 ? <span className="text-[var(--blue)] underline underline-offset-2 cursor-pointer">{compCount}</span> : "\u2014"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`font-[var(--mono)] text-[11px] tracking-[0.04em] ${
            {
              "s-cur": "text-[var(--sage)]",
              "s-prv": "text-[var(--ink3)]",
              "s-wnt": "text-[var(--s-want)]",
              "s-no": "text-[var(--rose-tk)]",
              "s-unk": "text-[var(--s-unknown)]",
              "s-fin": "text-[var(--s-sold)]",
            }[STATUS_CSS[f.status]] ?? "text-[var(--ink3)]"
          }`}
        >
          {STATUS_LABELS[f.status] ?? f.status}
        </span>
      </td>
    </tr>
  );
}

// ── Friend Activity ──────────────────────────────────────

function FriendActivity({
  fragrances,
  compliments,
  currentUserId,
}: {
  fragrances: UserFragrance[];
  compliments: UserCompliment[];
  currentUserId: UserId;
}) {
  const friends = USERS.filter((u) => u.id !== currentUserId);
  const sections: React.ReactNode[] = [];

  for (const friend of friends) {
    const FF = fragrances.filter((f) => f.userId === friend.id);
    const FC = compliments.filter((c) => c.userId === friend.id);

    const recentPurchase = FF.filter((f) => !WISHLIST_STATUSES.has(f.status))
      .slice()
      .sort((a, b) => {
        const da = a.createdAt ?? "";
        const db = b.createdAt ?? "";
        return db > da ? 1 : db < da ? -1 : 0;
      })[0] ?? null;

    const recentComp = FC.slice().sort(
      (a, b) =>
        (parseInt(b.year) * 100 + monthNum(b.month)) -
        (parseInt(a.year) * 100 + monthNum(a.month))
    )[0] ?? null;

    if (!recentPurchase && !recentComp) continue;

    const compFrag = recentComp
      ? FF.find((f) => (f.fragranceId || f.id) === recentComp.primaryFragId) ?? null
      : null;

    sections.push(
      <div key={friend.id} className="mb-6">
        <SectionHeader title={`${friend.name}'s recent activity`} />
        <div className="flex gap-4">
          {recentPurchase && (
            <FriendCard
              label="Latest purchase"
              name={recentPurchase.name}
              sub={recentPurchase.house}
            />
          )}
          {recentComp && (
            <FriendCard
              label="Latest compliment"
              name={compFrag?.name ?? recentComp.primaryFrag ?? "\u2014"}
              sub={[
                recentComp.relation,
                recentComp.year
                  ? `${MONTHS[(monthNum(recentComp.month) - 1) || 0] ?? ""} ${recentComp.year}`
                  : "",
              ]
                .filter(Boolean)
                .join(" \u00B7 ")}
            />
          )}
        </div>
      </div>
    );
  }

  if (!sections.length) return null;
  return <>{sections}</>;
}

function FriendCard({ label, name, sub }: { label: string; name: string; sub: string }) {
  return (
    <div className="flex-1 bg-[var(--off2)] border border-[var(--b2)] p-4 cursor-pointer hover:bg-[var(--off3)]">
      <div className="font-[var(--mono)] text-[10px] text-[var(--ink3)] tracking-[0.12em] uppercase mb-2">
        {label}
      </div>
      <div className="font-[var(--body)] text-sm text-[var(--ink)]">{name}</div>
      <div className="font-[var(--mono)] text-xs text-[var(--ink3)] mt-[2px]">{sub}</div>
    </div>
  );
}
