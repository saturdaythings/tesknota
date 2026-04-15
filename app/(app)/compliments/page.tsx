"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { MONTHS, monthNum } from "@/lib/frag-utils";
import type { Relation } from "@/types";

const RELATIONS: (Relation | "all")[] = [
  "all",
  "Stranger",
  "Friend",
  "Colleague / Client",
  "Family",
  "Significant Other",
];

function compWhen(month: string, year: string): string {
  const mn = monthNum(month);
  const mLabel = mn >= 1 && mn <= 12 ? MONTHS[mn - 1] : month;
  return year ? `${mLabel} ${year}` : mLabel;
}

export default function ComplimentsPage() {
  const { user } = useUser();
  const { compliments, fragrances, isLoaded } = useData();
  const [relation, setRelation] = useState<Relation | "all">("all");

  if (!user) return null;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const MC = compliments.filter((c) => c.userId === user.id);
  const thisYear = MC.filter((c) => parseInt(c.year) === curYear);
  const thisMonth = MC.filter(
    (c) => parseInt(c.year) === curYear && monthNum(c.month) === curMonth
  );

  const MF = fragrances.filter((f) => f.userId === user.id);

  let filtered = relation === "all" ? MC : MC.filter((c) => c.relation === relation);
  filtered = filtered
    .slice()
    .sort(
      (a, b) =>
        parseInt(b.year) * 100 + monthNum(b.month) - (parseInt(a.year) * 100 + monthNum(a.month))
    );

  return (
    <>
      <Topbar category="Experiences" title="Compliments" />
      <main className="flex-1 overflow-y-auto p-[26px]">
        {!isLoaded && (
          <div className="text-[var(--ink3)] font-[var(--mono)] text-xs tracking-[0.12em] py-6">
            Loading...
          </div>
        )}

        {isLoaded && (
          <>
            <StatsGrid className="mb-6">
              <StatBox value={MC.length} label="Total" />
              <StatBox value={thisYear.length} label={String(curYear)} />
              <StatBox value={thisMonth.length} label="This Month" />
            </StatsGrid>

            <FilterBar className="mb-4">
              {RELATIONS.map((r) => (
                <FilterChip
                  key={r}
                  label={r === "all" ? "All" : r}
                  active={relation === r}
                  onClick={() => setRelation(r)}
                />
              ))}
            </FilterBar>

            <SectionHeader
              title="Compliments"
              right={
                <span className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                  {filtered.length} {filtered.length === 1 ? "item" : "items"}
                </span>
              }
            />

            {filtered.length === 0 ? (
              <div className="font-[var(--mono)] text-xs text-[var(--ink3)] py-4">
                {MC.length === 0 ? "No compliments logged yet." : "No matches."}
              </div>
            ) : (
              <div className="border border-[var(--b2)] mb-6">
                <table className="w-full">
                  <tbody>
                    {filtered.map((c) => {
                      const frag = MF.find(
                        (f) => (f.fragranceId || f.id) === c.primaryFragId
                      );
                      const fragName = frag?.name ?? c.primaryFrag ?? "\u2014";
                      const fragHouse = frag?.house ?? "";
                      const location = [c.city, c.country].filter(Boolean).join(", ") || "\u2014";
                      return (
                        <tr
                          key={c.id}
                          className="border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)] cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <div className="font-[var(--body)] text-sm text-[var(--ink)]">
                              {fragName}
                            </div>
                            {fragHouse && (
                              <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                                {fragHouse}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink2)]">
                            {c.relation}
                          </td>
                          <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">
                            {compWhen(c.month, c.year)}
                          </td>
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
        )}
      </main>
    </>
  );
}
