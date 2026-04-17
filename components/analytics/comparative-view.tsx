"use client";

import { avgRatingStr } from "@/lib/frag-utils";
import type { UserFragrance, UserCompliment } from "@/types";

interface CompareViewProps {
  myFrags: UserFragrance[];
  myComps: UserCompliment[];
  friendFrags: UserFragrance[];
  friendComps: UserCompliment[];
  myName: string;
  friendName: string;
}

function topComplimented(frags: UserFragrance[], comps: UserCompliment[]) {
  const counts: Record<string, { name: string; house: string; count: number }> = {};
  comps.forEach((c) => {
    if (!c.primaryFragId) return;
    if (!counts[c.primaryFragId]) {
      const frag = frags.find((f) => f.id === c.primaryFragId || f.fragranceId === c.primaryFragId);
      counts[c.primaryFragId] = {
        name: frag?.name ?? (c as any).primaryFrag ?? c.primaryFragId,
        house: frag?.house ?? "",
        count: 0,
      };
    }
    counts[c.primaryFragId].count++;
  });
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
}

export function CompareView({
  myFrags,
  myComps,
  friendFrags,
  friendComps,
  myName,
  friendName,
}: CompareViewProps) {
  const myCollection = myFrags.filter((f) => f.status === "CURRENT").length;
  const friendCollection = friendFrags.filter((f) => f.status === "CURRENT").length;
  const myWishlist = myFrags.filter((f) => f.status === "WANT_TO_BUY").length;
  const friendWishlist = friendFrags.filter((f) => f.status === "WANT_TO_BUY").length;

  const myTop = topComplimented(myFrags, myComps);
  const friendTop = topComplimented(friendFrags, friendComps);

  const allNames = new Map<string, { name: string; house: string; myCount: number; friendCount: number }>();
  myTop.forEach((t) => allNames.set(t.name, { name: t.name, house: t.house, myCount: t.count, friendCount: 0 }));
  friendTop.forEach((t) => {
    const existing = allNames.get(t.name);
    if (existing) {
      existing.friendCount = t.count;
    } else {
      allNames.set(t.name, { name: t.name, house: t.house, myCount: 0, friendCount: t.count });
    }
  });
  const pairedData = Array.from(allNames.values()).sort(
    (a, b) => (b.myCount + b.friendCount) - (a.myCount + a.friendCount)
  );
  const maxCount = Math.max(...pairedData.map((d) => Math.max(d.myCount, d.friendCount)), 1);

  const myCurrentNames = new Set(myFrags.filter((f) => f.status === "CURRENT").map((f) => f.name.toLowerCase()));
  const inCommon = friendFrags.filter((f) => f.status === "CURRENT" && myCurrentNames.has(f.name.toLowerCase()));

  const stats = [
    { label: "COLLECTION", myVal: String(myCollection), friendVal: String(friendCollection) },
    { label: "COMPLIMENTS", myVal: String(myComps.length), friendVal: String(friendComps.length) },
    { label: "WISHLIST", myVal: String(myWishlist), friendVal: String(friendWishlist) },
    { label: "AVG RATING", myVal: avgRatingStr(myFrags), friendVal: avgRatingStr(friendFrags) },
  ];

  const myInitial = myName[0]?.toUpperCase() ?? "M";
  const friendInitial = friendName[0]?.toUpperCase() ?? "F";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}
        className="max-sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.label} style={{
            background: "var(--color-cream)",
            border: "1px solid var(--color-cream-dark)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-4)",
          }}>
            <div style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-label)",
              letterSpacing: "var(--tracking-wide)",
              textTransform: "uppercase",
              color: "var(--color-meta-text)",
              marginBottom: "var(--space-3)",
            }}>
              {s.label}
            </div>
            <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-half)" }}>
                <span style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "var(--text-hero)",
                  color: "var(--color-navy)",
                  lineHeight: 1,
                }}>
                  {s.myVal}
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                  {myInitial}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-half)" }}>
                <span style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "var(--text-hero)",
                  color: "var(--color-accent)",
                  lineHeight: 1,
                }}>
                  {s.friendVal}
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                  {friendInitial}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paired bars */}
      {pairedData.length > 0 && (
        <div style={{
          background: "var(--color-cream)",
          border: "1px solid var(--color-cream-dark)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)",
        }}>
          <div style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "var(--text-note)",
            color: "var(--color-navy)",
            marginBottom: "var(--space-4)",
          }}>
            Top Complimented Fragrances
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {pairedData.map((d) => (
              <div key={d.name}>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "var(--text-note)",
                  color: "var(--color-navy)",
                }}>
                  {d.name}
                </div>
                {d.house && (
                  <div style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-label)",
                    letterSpacing: "var(--tracking-wide)",
                    textTransform: "uppercase",
                    color: "var(--color-meta-text)",
                    marginBottom: "var(--space-2)",
                  }}>
                    {d.house}
                  </div>
                )}
                {/* My bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-navy)", width: "var(--space-3)", textAlign: "center", flexShrink: 0 }}>
                    {myInitial}
                  </span>
                  <div style={{ flex: 1, height: 6, background: "var(--color-row-hover)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(d.myCount / maxCount) * 100}%`,
                      background: "var(--color-navy)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 300ms",
                    }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-navy)", minWidth: "var(--space-4)", textAlign: "right", flexShrink: 0 }}>
                    {d.myCount}
                  </span>
                </div>
                {/* Friend bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-accent)", width: "var(--space-3)", textAlign: "center", flexShrink: 0 }}>
                    {friendInitial}
                  </span>
                  <div style={{ flex: 1, height: 6, background: "var(--color-row-hover)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(d.friendCount / maxCount) * 100}%`,
                      background: "var(--color-accent)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 300ms",
                    }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-accent)", minWidth: "var(--space-4)", textAlign: "right", flexShrink: 0 }}>
                    {d.friendCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In common */}
      {inCommon.length > 0 && (
        <div>
          <div style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-label)",
            letterSpacing: "var(--tracking-wide)",
            textTransform: "uppercase",
            color: "var(--color-meta-text)",
            paddingBottom: "var(--space-2)",
            borderBottom: "1px solid var(--color-row-divider)",
            marginBottom: "var(--space-3)",
          }}>
            In Common — {inCommon.length} {inCommon.length === 1 ? "fragrance" : "fragrances"}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "var(--space-3)",
          }}>
            {inCommon.map((f) => (
              <div key={f.id} style={{
                background: "var(--color-cream-dark)",
                border: "1px solid var(--color-row-divider)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-3) var(--space-4)",
              }}>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "var(--text-note)",
                  color: "var(--color-navy)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {f.name}
                </div>
                {f.house && (
                  <div style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-label)",
                    letterSpacing: "var(--tracking-wide)",
                    textTransform: "uppercase",
                    color: "var(--color-meta-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {f.house}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pairedData.length === 0 && inCommon.length === 0 && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)", textAlign: "center", padding: "var(--space-8)" }}>
          Log compliments to see comparative data.
        </div>
      )}
    </div>
  );
}
