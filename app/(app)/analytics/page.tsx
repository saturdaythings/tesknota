"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { AccordCloud } from "@/components/ui/accord-cloud";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { getAccords, MONTHS, monthNum } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";

type Tab = "compliments" | "collection";

function getAccordCounts(frags: UserFragrance[], communityFrags: CommunityFrag[]): [string, number][] {
  const counts: Record<string, number> = {};
  frags.forEach((f) => {
    getAccords(f, communityFrags).forEach((a) => {
      counts[a] = (counts[a] ?? 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
}

export default function AnalyticsPage() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded } = useData();
  const [tab, setTab] = useState<Tab>("compliments");

  if (!user) return null;

  const MF = fragrances.filter((f) => f.userId === user.id);
  const MC = compliments.filter((c) => c.userId === user.id);

  return (
    <>
      <Topbar title="Analytics" />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:p-[26px]">
        {!isLoaded && (
          <div className="text-[var(--ink3)] font-[var(--mono)] text-xs tracking-[0.12em] py-6">
            Loading...
          </div>
        )}

        {isLoaded && (
          <>
            <FilterBar className="mb-6">
              <FilterChip label="Compliments" active={tab === "compliments"} onClick={() => setTab("compliments")} />
              <FilterChip label="Collection" active={tab === "collection"} onClick={() => setTab("collection")} />
            </FilterBar>

            {tab === "compliments" && (
              <ComplimentsTab MC={MC} MF={MF} communityFrags={communityFrags} />
            )}
            {tab === "collection" && (
              <CollectionTab MF={MF} communityFrags={communityFrags} />
            )}
          </>
        )}
      </main>
    </>
  );
}

function ComplimentsTab({
  MC,
  MF,
  communityFrags,
}: {
  MC: UserCompliment[];
  MF: UserFragrance[];
  communityFrags: CommunityFrag[];
}) {
  const compMap: Record<string, number> = {};
  MC.forEach((c) => {
    if (c.primaryFragId) compMap[c.primaryFragId] = (compMap[c.primaryFragId] ?? 0) + 1;
  });

  const topFrags = Object.entries(compMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([fragId, count]) => {
      const frag = MF.find((f) => (f.fragranceId || f.id) === fragId);
      return { fragId, count, name: frag?.name ?? fragId, house: frag?.house ?? "" };
    });
  const maxFragCount = topFrags[0]?.count ?? 1;

  const relationMap: Record<string, number> = {};
  MC.forEach((c) => {
    if (c.relation) relationMap[c.relation] = (relationMap[c.relation] ?? 0) + 1;
  });
  const relations = Object.entries(relationMap).sort((a, b) => b[1] - a[1]);

  const monthData: Record<string, number> = {};
  MC.forEach((c) => {
    if (c.year && c.month) {
      const mn = String(monthNum(c.month)).padStart(2, "0");
      const key = `${c.year}-${mn}`;
      monthData[key] = (monthData[key] ?? 0) + 1;
    }
  });
  const monthBars = Object.entries(monthData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const [year, mo] = key.split("-");
      const moNum = parseInt(mo, 10);
      return { key, label: `${MONTHS[moNum - 1].slice(0, 3)} '${year.slice(2)}`, count };
    });
  const maxMonthCount = Math.max(...monthBars.map((m) => m.count), 1);

  const complimentedFragIds = new Set(MC.map((c) => c.primaryFragId).filter(Boolean));
  const complimentedFrags = MF.filter((f) =>
    complimentedFragIds.has(f.fragranceId || f.id)
  );
  const accordCounts = getAccordCounts(complimentedFrags, communityFrags);

  if (!MC.length) {
    return (
      <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4">
        No compliments logged yet.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <SectionHeader title="Top fragrances" />
        {topFrags.length === 0 ? (
          <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-2">None yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {topFrags.map(({ fragId, count, name, house }) => {
              const pct = Math.round((count / maxFragCount) * 100);
              return (
                <div key={fragId} className="flex items-center gap-3">
                  <div className="w-36 shrink-0">
                    <div className="font-[var(--body)] text-sm text-[var(--ink)] truncate">{name}</div>
                    {house && (
                      <div className="font-[var(--mono)] text-xs text-[var(--ink3)] truncate">{house}</div>
                    )}
                  </div>
                  <div className="flex-1 bg-[var(--b2)] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-[var(--blue)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-8 text-right font-[var(--mono)] text-xs text-[var(--blue)] shrink-0">{count}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-6">
        <SectionHeader title="By relation" />
        <StatsGrid>
          {relations.map(([rel, count]) => (
            <StatBox key={rel} value={count} label={rel} />
          ))}
        </StatsGrid>
      </div>

      {monthBars.length > 0 && (
        <div className="mb-6">
          <SectionHeader title="By month" />
          <div className="flex items-end gap-1" style={{ height: 100 }}>
            {monthBars.map(({ key, count }) => (
              <div key={key} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">{count}</span>
                <div
                  className="w-full bg-[var(--blue)] rounded-t-sm opacity-80"
                  style={{ height: `${Math.max(4, Math.round((count / maxMonthCount) * 72))}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1.5 overflow-hidden">
            {monthBars.map(({ key, label }) => (
              <div key={key} className="flex-1 text-center font-[var(--mono)] text-xs text-[var(--ink3)] truncate">
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {accordCounts.length > 0 && (
        <div className="mb-6">
          <SectionHeader
            title="Accord profile"
            right={
              <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                Accords in compliment-worn frags
              </span>
            }
          />
          <AccordCloud accords={accordCounts} />
        </div>
      )}
    </>
  );
}

function CollectionTab({
  MF,
  communityFrags,
}: {
  MF: UserFragrance[];
  communityFrags: CommunityFrag[];
}) {
  const STATUS_DONUT_COLOR: Record<string, string> = {
    CURRENT: "var(--s-cur)",
    PREVIOUSLY_OWNED: "var(--s-prv)",
    WANT_TO_BUY: "var(--s-wnt)",
    WANT_TO_SMELL: "var(--s-wnt)",
    DONT_LIKE: "var(--s-no)",
    IDENTIFY_LATER: "var(--s-unk)",
    FINISHED: "var(--s-fin)",
  };

  const statusMap: Partial<Record<string, number>> = {};
  MF.forEach((f) => {
    statusMap[f.status] = (statusMap[f.status] ?? 0) + 1;
  });
  const statuses = Object.entries(statusMap).sort((a, b) => b[1]! - a[1]!);
  const statusTotal = statuses.reduce((s, [, c]) => s + (c ?? 0), 0);
  let cumPct = 0;
  const donutStops = statuses.map(([status, count]) => {
    const pct = ((count ?? 0) / statusTotal) * 100;
    const from = cumPct;
    cumPct += pct;
    return { status, count: count ?? 0, pct, from, to: cumPct };
  });
  const donutGradient = donutStops
    .map((s) => `${STATUS_DONUT_COLOR[s.status] ?? "var(--ink4)"} ${s.from.toFixed(1)}% ${s.to.toFixed(1)}%`)
    .join(", ");

  const houseMap: Record<string, number> = {};
  MF.forEach((f) => {
    if (f.house) houseMap[f.house] = (houseMap[f.house] ?? 0) + 1;
  });
  const topHouses = Object.entries(houseMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const current = MF.filter((f) => f.status === "CURRENT");
  const accordCounts = getAccordCounts(current, communityFrags);

  const ratedFrags = MF.filter((f) => f.personalRating);
  const avgRating =
    ratedFrags.length > 0
      ? (ratedFrags.reduce((a, f) => a + (f.personalRating ?? 0), 0) / ratedFrags.length).toFixed(1)
      : null;

  if (!MF.length) {
    return (
      <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4">
        Your collection is empty.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <SectionHeader title="By status" />
        {donutStops.length > 0 && (
          <div className="flex items-center gap-6 flex-wrap">
            <div
              className="shrink-0 rounded-full"
              style={{
                width: 120,
                height: 120,
                background: `conic-gradient(${donutGradient})`,
                WebkitMask: "radial-gradient(circle, transparent 42px, black 43px)",
                mask: "radial-gradient(circle, transparent 42px, black 43px)",
              }}
            />
            <div className="flex flex-col gap-1.5">
              {donutStops.map(({ status, count, pct }) => (
                <div key={status} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ background: STATUS_DONUT_COLOR[status] ?? "var(--ink4)" }}
                  />
                  <span className="font-[var(--mono)] text-xs text-[var(--ink)]">
                    {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
                  </span>
                  <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {avgRating && (
        <div className="mb-6">
          <SectionHeader title="Ratings" />
          <StatsGrid>
            <StatBox value={avgRating} label="Avg Rating" />
            <StatBox value={ratedFrags.length} label="Rated" />
            <StatBox value={MF.length - ratedFrags.length} label="Unrated" />
          </StatsGrid>
        </div>
      )}

      {topHouses.length > 0 && (
        <div className="mb-6">
          <SectionHeader title="Top houses" />
          <div className="overflow-x-auto border border-[var(--b2)]">
            <table className="w-full min-w-[300px]">
              <thead>
                <tr className="border-b border-[var(--b2)]">
                  <th className="px-4 py-2 text-left font-[var(--mono)] text-xs tracking-[0.06em] text-[var(--ink3)]">House</th>
                  <th className="px-4 py-2 text-right font-[var(--mono)] text-xs tracking-[0.06em] text-[var(--ink3)]">Count</th>
                </tr>
              </thead>
              <tbody>
                {topHouses.map(([house, count]) => (
                  <tr key={house} className="border-b border-[var(--b1)] last:border-0">
                    <td className="px-4 py-3 font-[var(--body)] text-sm text-[var(--ink)]">{house}</td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)] text-right">
                      {count} {count === 1 ? "fragrance" : "fragrances"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {accordCounts.length > 0 && (
        <div className="mb-6">
          <SectionHeader
            title="Scent profile"
            right={
              <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                Accords in current collection
              </span>
            }
          />
          <AccordCloud accords={accordCounts} />
        </div>
      )}
    </>
  );
}
