"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { AccordCloud } from "@/components/ui/accord-cloud";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { getAccords, parseRating } from "@/lib/frag-utils";
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
      <Topbar category="Experiences" title="Analytics" />
      <main className="flex-1 overflow-y-auto p-[26px]">
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

  const relationMap: Record<string, number> = {};
  MC.forEach((c) => {
    if (c.relation) relationMap[c.relation] = (relationMap[c.relation] ?? 0) + 1;
  });
  const relations = Object.entries(relationMap).sort((a, b) => b[1] - a[1]);

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
          <div className="border border-[var(--b2)]">
            <table className="w-full">
              <tbody>
                {topFrags.map(({ fragId, count, name, house }) => (
                  <tr key={fragId} className="border-b border-[var(--b1)] last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-[var(--body)] text-sm text-[var(--ink)]">{name}</div>
                      {house && (
                        <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{house}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--blue)] text-right">
                      {count} {count === 1 ? "compliment" : "compliments"}
                    </td>
                    <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)] text-right">
                      {MC.length > 0 ? `${Math.round((count / MC.length) * 100)}%` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  const statusMap: Partial<Record<string, number>> = {};
  MF.forEach((f) => {
    statusMap[f.status] = (statusMap[f.status] ?? 0) + 1;
  });
  const statuses = Object.entries(statusMap).sort((a, b) => b[1]! - a[1]!);

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
        <StatsGrid>
          {statuses.map(([status, count]) => (
            <StatBox
              key={status}
              value={count ?? 0}
              label={STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
            />
          ))}
        </StatsGrid>
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
          <div className="border border-[var(--b2)]">
            <table className="w-full">
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
