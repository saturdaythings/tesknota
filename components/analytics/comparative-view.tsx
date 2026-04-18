"use client";

import type { UserFragrance, UserCompliment } from "@/types";

interface CompareViewProps {
  myFrags: UserFragrance[];
  myComps: UserCompliment[];
  friendFrags: UserFragrance[];
  friendComps: UserCompliment[];
  myName: string;
  friendName: string;
}

function compToTimestamp(c: UserCompliment): number {
  const mo = parseInt(c.month);
  const yr = parseInt(c.year);
  if (isNaN(mo) || isNaN(yr)) return 0;
  return new Date(yr, mo - 1, 15).getTime();
}

function avgGapWeeks(comps: UserCompliment[]): string {
  const timestamps = comps
    .map(compToTimestamp)
    .filter((t) => t > 0)
    .sort((a, b) => a - b);
  if (timestamps.length < 2) return "\u2014";
  const gaps: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    gaps.push((timestamps[i] - timestamps[i - 1]) / (7 * 24 * 60 * 60 * 1000));
  }
  const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  return avg < 1 ? "<1 wk" : `${avg.toFixed(1)} wk${avg !== 1 ? "s" : ""}`;
}

function strangerPct(comps: UserCompliment[]): string {
  if (!comps.length) return "\u2014";
  const n = comps.filter((c) => c.relation === "Stranger").length;
  return `${Math.round((n / comps.length) * 100)}%`;
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

  const myInitial = myName[0]?.toUpperCase() ?? "M";
  const friendInitial = friendName[0]?.toUpperCase() ?? "F";

  const stats = [
    { label: "Collection", myVal: String(myCollection), friendVal: String(friendCollection) },
    { label: "Compliments", myVal: String(myComps.length), friendVal: String(friendComps.length) },
    { label: "Stranger %", myVal: strangerPct(myComps), friendVal: strangerPct(friendComps) },
    { label: "Avg Gap", myVal: avgGapWeeks(myComps), friendVal: avgGapWeeks(friendComps) },
  ];

  // Paired bars
  const myTop = topComplimented(myFrags, myComps);
  const friendTop = topComplimented(friendFrags, friendComps);
  const allNames = new Map<string, { name: string; house: string; myCount: number; friendCount: number }>();
  myTop.forEach((t) => allNames.set(t.name, { name: t.name, house: t.house, myCount: t.count, friendCount: 0 }));
  friendTop.forEach((t) => {
    const existing = allNames.get(t.name);
    if (existing) existing.friendCount = t.count;
    else allNames.set(t.name, { name: t.name, house: t.house, myCount: 0, friendCount: t.count });
  });
  const pairedData = Array.from(allNames.values()).sort(
    (a, b) => (b.myCount + b.friendCount) - (a.myCount + a.friendCount)
  );
  const maxCount = Math.max(...pairedData.map((d) => Math.max(d.myCount, d.friendCount)), 1);

  // In common
  const myCurrentNames = new Set(myFrags.filter((f) => f.status === "CURRENT").map((f) => f.name.toLowerCase()));
  const inCommon = friendFrags.filter((f) => f.status === "CURRENT" && myCurrentNames.has(f.name.toLowerCase()));

  const cardStyle: React.CSSProperties = {
    background: "var(--color-cream)",
    border: "1px solid var(--color-cream-dark)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-4)",
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontFamily: "var(--font-serif)",
    fontStyle: "italic",
    fontSize: "var(--text-note)",
    color: "var(--color-navy)",
    marginBottom: "var(--space-3)",
    paddingBottom: "var(--space-2)",
    borderBottom: "1px solid var(--color-row-divider)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

      {/* Stat strip */}
      <div
        className="max-sm:grid-cols-2"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}
      >
        {stats.map((s) => (
          <div key={s.label} style={cardStyle}>
            <div
              className="font-sans uppercase"
              style={{
                fontSize: "var(--text-label)",
                letterSpacing: "var(--tracking-wide)",
                color: "var(--color-meta-text)",
                marginBottom: "var(--space-3)",
              }}
            >
              {s.label}
            </div>
            <div style={{ display: "flex", gap: "var(--space-5)", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-half)" }}>
                <span
                  className="font-serif italic"
                  style={{ fontSize: "var(--text-lg)", color: "var(--color-navy)", lineHeight: 1 }}
                >
                  {s.myVal}
                </span>
                <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                  {myInitial}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-half)" }}>
                <span
                  className="font-serif"
                  style={{ fontSize: "var(--text-lg)", color: "var(--color-accent)", lineHeight: 1 }}
                >
                  {s.friendVal}
                </span>
                <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                  {friendInitial}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paired bars — Top earners */}
      {pairedData.length > 0 && (
        <div style={{ ...cardStyle, padding: "var(--space-6)" }}>
          <div style={sectionHeadingStyle}>Top earners</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {pairedData.map((d) => (
              <div key={d.name}>
                <div
                  className="font-serif italic"
                  style={{ fontSize: "var(--text-note)", color: "var(--color-navy)" }}
                >
                  {d.name}
                </div>
                {d.house && (
                  <div
                    className="font-sans uppercase"
                    style={{
                      fontSize: "var(--text-label)",
                      letterSpacing: "var(--tracking-wide)",
                      color: "var(--color-meta-text)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    {d.house}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {/* My bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span
                      className="font-sans"
                      style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)", minWidth: "var(--space-4)", flexShrink: 0 }}
                    >
                      {myInitial}
                    </span>
                    <div style={{ flex: 1, display: "flex", height: "6px", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${(d.myCount / maxCount) * 100}%`,
                          background: "var(--color-navy)",
                          borderRadius: "var(--radius-full)",
                          transition: "width 300ms",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, background: "var(--color-row-hover)" }} />
                    </div>
                    <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-navy)", minWidth: "var(--space-4)", textAlign: "right", flexShrink: 0 }}>
                      {d.myCount}
                    </span>
                  </div>
                  {/* Friend bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span
                      className="font-sans"
                      style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)", minWidth: "var(--space-4)", flexShrink: 0 }}
                    >
                      {friendInitial}
                    </span>
                    <div style={{ flex: 1, display: "flex", height: "6px", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${(d.friendCount / maxCount) * 100}%`,
                          background: "var(--color-accent)",
                          borderRadius: "var(--radius-full)",
                          transition: "width 300ms",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, background: "var(--color-row-hover)" }} />
                    </div>
                    <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", minWidth: "var(--space-4)", textAlign: "right", flexShrink: 0 }}>
                      {d.friendCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In common */}
      {inCommon.length > 0 && (
        <div>
          <div style={sectionHeadingStyle}>In common</div>
          <div
            className="grid-cols-1 md:grid-cols-3"
            style={{ display: "grid", gap: "var(--space-2)" }}
          >
            {inCommon.map((f) => (
              <div
                key={f.id}
                style={{
                  background: "var(--color-cream-dark)",
                  border: "1px solid var(--color-row-divider)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-2) var(--space-3)",
                }}
              >
                <div
                  className="font-serif italic"
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-navy)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </div>
                {f.house && (
                  <div
                    className="font-sans uppercase"
                    style={{
                      fontSize: "var(--text-label)",
                      letterSpacing: "var(--tracking-wide)",
                      color: "var(--color-meta-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.house}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pairedData.length === 0 && inCommon.length === 0 && (
        <div
          className="font-sans"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-meta-text)", textAlign: "center", padding: "var(--space-8)" }}
        >
          Log compliments to see comparative data.
        </div>
      )}
    </div>
  );
}
