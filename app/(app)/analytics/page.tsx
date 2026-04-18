"use client";

import { useState, useMemo, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContent } from "@/components/layout/PageContent";
import { FragSearch } from "@/components/ui/frag-search";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { avgRatingStr, parseRating, MONTHS, getAccords } from "@/lib/frag-utils";
import { Select } from "@/components/ui/select";
import { TabPill } from "@/components/ui/tab-pill";
import { Button } from "@/components/ui/button";
import { CompareView } from "@/components/analytics/comparative-view";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, MessageCircle, PieChart as PieIcon, Star, Award, Leaf, Sun, Wind, Snowflake } from "lucide-react";
import { loadAllData, fetchFollows, fetchProfile } from "@/lib/data/index";
import type { UserFragrance, UserCompliment, CommunityFrag, Follow, Profile } from "@/types";

// ── Constants ──────────────────────────────────────────────

type TimePeriod = "all" | "year" | "season" | "month";
type Season = "winter" | "spring" | "summer" | "fall";

const SEASON_MONTHS: Record<Season, number[]> = {
  winter: [12, 1, 2],
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  fall: [9, 10, 11],
};

const SEASON_OPTIONS = [
  { value: "winter", label: "Winter" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
];

const STATUS_LABELS: Record<string, string> = {
  CURRENT: "Current",
  WANT_TO_BUY: "Wishlist",
  PREVIOUSLY_OWNED: "Prev. Owned",
  WANT_TO_SMELL: "Want to Smell",
  DONT_LIKE: "Don't Like",
  FINISHED: "Finished",
  WANT_TO_IDENTIFY: "Identify Later",
};

const STATUS_COLORS: Record<string, string> = {
  CURRENT: "var(--color-navy)",
  WANT_TO_BUY: "var(--color-accent-light)",
  PREVIOUSLY_OWNED: "var(--color-meta-text)",
  WANT_TO_SMELL: "var(--color-accent-light)",
  DONT_LIKE: "var(--color-destructive)",
  FINISHED: "var(--color-status-finished)",
  WANT_TO_IDENTIFY: "var(--color-status-want)",
};

const SEASON_META: Record<Season, { label: string; icon: React.ReactNode }> = {
  spring: { label: "Spring", icon: <Leaf size={18} /> },
  summer: { label: "Summer", icon: <Sun size={18} /> },
  fall: { label: "Autumn", icon: <Wind size={18} /> },
  winter: { label: "Winter", icon: <Snowflake size={18} /> },
};

const ALL_SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

// ── Data builders ─────────────────────────────────────────

function buildGrowthData(frags: UserFragrance[]) {
  const sorted = [...frags].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  const byMonth: Record<string, { count: number; names: string[] }> = {};
  sorted.forEach((f) => {
    const d = new Date(f.createdAt);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[key]) byMonth[key] = { count: 0, names: [] };
    byMonth[key].count++;
    byMonth[key].names.push(f.name);
  });
  let cum = 0;
  return Object.entries(byMonth)
    .sort()
    .map(([key, { count, names }]) => {
      cum += count;
      const [yr, mo] = key.split("-");
      const label = MONTHS[parseInt(mo) - 1];
      return { label, fullLabel: `${label} ${yr}`, count: cum, fragsAdded: names };
    });
}

function buildMonthlyBars(items: UserCompliment[], baseFrags: UserFragrance[]) {
  const byMonth: Record<string, { count: number; fragNames: string[] }> = {};
  items.forEach((c) => {
    const mo = parseInt(c.month);
    if (!c.year || isNaN(mo)) return;
    const key = `${c.year}-${String(mo).padStart(2, "0")}`;
    if (!byMonth[key]) byMonth[key] = { count: 0, fragNames: [] };
    byMonth[key].count++;
    if (c.primaryFragId) {
      const frag = baseFrags.find((f) => f.id === c.primaryFragId || f.fragranceId === c.primaryFragId);
      const name = frag?.name ?? (c as any).primaryFrag ?? "";
      if (name && !byMonth[key].fragNames.includes(name)) byMonth[key].fragNames.push(name);
    }
  });
  return Object.entries(byMonth)
    .sort()
    .map(([key, { count, fragNames }]) => {
      const [yr, mo] = key.split("-");
      const label = MONTHS[parseInt(mo) - 1];
      return { label, fullLabel: `${label} ${yr}`, count, fragNames };
    });
}

function buildMonthOptions(frags: UserFragrance[], comps: UserCompliment[]): { value: string; label: string }[] {
  const s = new Set<string>();
  frags.forEach((f) => {
    const d = new Date(f.createdAt);
    if (!isNaN(d.getTime())) s.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  });
  comps.forEach((c) => {
    const mo = parseInt(c.month);
    if (c.year && !isNaN(mo)) s.add(`${c.year}-${String(mo).padStart(2, "0")}`);
  });
  const now = new Date();
  s.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  return Array.from(s)
    .sort()
    .reverse()
    .map((v) => {
      const [yr, mo] = v.split("-");
      return { value: v, label: `${MONTHS[parseInt(mo) - 1]} ${yr}` };
    });
}

// ── Seasonal builders ─────────────────────────────────────

function fragsSeason(frags: UserFragrance[], season: Season) {
  const ms = SEASON_MONTHS[season];
  return frags.filter((f) => {
    const d = new Date(f.createdAt);
    return !isNaN(d.getTime()) && ms.includes(d.getMonth() + 1);
  });
}

function compsSeason(comps: UserCompliment[], season: Season) {
  const ms = SEASON_MONTHS[season];
  return comps.filter((c) => {
    const mo = parseInt(c.month);
    return !isNaN(mo) && ms.includes(mo);
  });
}

function buildSeasonalCompliments(comps: UserCompliment[], frags: UserFragrance[]) {
  return ALL_SEASONS.map((season) => {
    const sc = compsSeason(comps, season);
    const counts: Record<string, { name: string; count: number }> = {};
    sc.forEach((c) => {
      if (!c.primaryFragId) return;
      if (!counts[c.primaryFragId]) {
        const frag = frags.find((f) => f.id === c.primaryFragId || f.fragranceId === c.primaryFragId);
        counts[c.primaryFragId] = { name: frag?.name ?? (c as any).primaryFrag ?? "", count: 0 };
      }
      counts[c.primaryFragId].count++;
    });
    const topFrag = Object.values(counts).sort((a, b) => b.count - a.count)[0];
    return { season, count: sc.length, topFrag: topFrag?.name ?? null };
  });
}

function buildSeasonalAcquisitions(frags: UserFragrance[]) {
  return ALL_SEASONS.map((season) => {
    const sf = fragsSeason(frags, season);
    const topFrag = sf.length > 0 ? sf[sf.length - 1].name : null;
    return { season, count: sf.length, topFrag };
  });
}

function buildSeasonalAccords(frags: UserFragrance[], communityFrags: CommunityFrag[]) {
  return ALL_SEASONS.map((season) => {
    const sf = fragsSeason(frags, season);
    const counts: Record<string, number> = {};
    sf.forEach((f) => {
      getAccords(f, communityFrags).forEach((a) => {
        counts[a] = (counts[a] ?? 0) + 1;
      });
    });
    const topAccords = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { season, topAccords };
  });
}

// ── Tooltip style ─────────────────────────────────────────

const tooltipStyle: React.CSSProperties = {
  background: "var(--color-cream)",
  border: "1px solid var(--color-row-divider)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-md)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-xs)",
  color: "var(--color-navy)",
  padding: "var(--space-3)",
  maxHeight: 240,
  overflowY: "auto" as const,
  minWidth: 160,
};

function TooltipHeader({ label }: { label: string }) {
  return (
    <div style={{
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-label)",
      letterSpacing: "var(--tracking-wide)",
      textTransform: "uppercase" as const,
      color: "var(--color-meta-text)",
      marginBottom: "var(--space-2)",
      paddingBottom: "var(--space-1)",
      borderBottom: "1px solid var(--color-row-divider)",
    }}>
      {label}
    </div>
  );
}

function TooltipFragLine({ name }: { name: string }) {
  return (
    <div style={{
      fontFamily: "var(--font-serif)",
      fontStyle: "italic",
      fontSize: "var(--text-note)",
      color: "var(--color-navy)",
      lineHeight: 1.3,
    }}>
      {name}
    </div>
  );
}

function GrowthTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { fullLabel: string; fragsAdded: string[] }; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <TooltipHeader label={`${d.fullLabel} — ${d.fragsAdded.length} added`} />
      {d.fragsAdded.map((n) => <TooltipFragLine key={n} name={n} />)}
    </div>
  );
}

function CompsTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { fullLabel: string; count: number; fragNames: string[] } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <TooltipHeader label={`${d.fullLabel} — ${d.count} compliments`} />
      {d.fragNames.map((n) => <TooltipFragLine key={n} name={n} />)}
    </div>
  );
}

function StatusTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; fragrances: string[] } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <TooltipHeader label={`${d.name} — ${d.value}`} />
      {d.fragrances.slice(0, 12).map((n) => <TooltipFragLine key={n} name={n} />)}
      {d.fragrances.length > 12 && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", marginTop: "var(--space-1)" }}>
          +{d.fragrances.length - 12} more
        </div>
      )}
    </div>
  );
}

function RatingTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { star: string; count: number; fragrances: string[] } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <TooltipHeader label={`${d.star} — ${d.count} fragrances`} />
      {d.fragrances.map((n) => <TooltipFragLine key={n} name={n} />)}
    </div>
  );
}

// ── Hover tooltip for non-Recharts elements ───────────────

function HoverTooltip({ children, lines, header }: {
  children: React.ReactNode;
  lines: string[];
  header?: string;
}) {
  const [show, setShow] = useState(false);
  if (!lines.length) return <>{children}</>;
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          ...tooltipStyle,
          position: "absolute",
          top: "50%",
          left: "calc(100% + var(--space-2))",
          transform: "translateY(-50%)",
          zIndex: 50,
          pointerEvents: "none",
        }}>
          {header && <TooltipHeader label={header} />}
          {lines.map((n) => <TooltipFragLine key={n} name={n} />)}
        </div>
      )}
    </div>
  );
}

// ── Skeleton / Empty ──────────────────────────────────────

function ChartSkeleton({ height }: { height: number }) {
  return <div style={{ height, background: "var(--color-cream-dark)", borderRadius: "var(--radius-md)", opacity: 0.5 }} />;
}

function ChartEmpty({ icon, title, height }: { icon: React.ReactNode; title: string; height: number }) {
  return (
    <div style={{ height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", color: "var(--color-navy)" }}>
      {icon}
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)" }}>{title}</span>
    </div>
  );
}

// ── Ranked row ────────────────────────────────────────────

function RankedRow({ rank, name, sub, count, maxCount, unit, tooltipLines, tooltipHeader }: {
  rank: number;
  name: string;
  sub?: string;
  count: number;
  maxCount: number;
  unit: string;
  tooltipLines?: string[];
  tooltipHeader?: string;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const row = (
    <div style={{ display: "flex", alignItems: "center", height: 44 }}>
      <span style={{ width: 24, flexShrink: 0, fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-navy)", fontWeight: 500 }}>
        {rank}
      </span>
      <div style={{ display: "flex", flexDirection: "column", width: 140, flexShrink: 0, minWidth: 0, overflow: "hidden" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-ui)", fontWeight: 500, color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </span>
        {sub && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sub}
          </span>
        )}
      </div>
      <div style={{ flex: 1, height: "var(--space-1)", background: "var(--color-cream-dark)", borderRadius: "var(--radius-full)", margin: "0 var(--space-4)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-accent)", borderRadius: "var(--radius-full)" }} />
      </div>
      <span style={{ flexShrink: 0, whiteSpace: "nowrap", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-navy)" }}>
        {count} {unit}
      </span>
    </div>
  );

  if (tooltipLines?.length) {
    return <HoverTooltip lines={tooltipLines} header={tooltipHeader}>{row}</HoverTooltip>;
  }
  return row;
}

// ── Chart card ────────────────────────────────────────────

function ChartCard({ title, sub, children, wide }: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div style={{
      background: "var(--color-cream)",
      border: "1px solid var(--color-cream-dark)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-6)",
      gridColumn: wide ? "1 / -1" : undefined,
    }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-lg)", color: "var(--color-navy)", marginBottom: "var(--space-half)" }}>
          {title}
        </div>
        {sub && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
            {sub}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────

function StatCard({ label, value, delta, friendValue }: { label: string; value: string | number; delta?: string; friendValue?: string | number }) {
  return (
    <div style={{ background: "var(--color-cream)", border: "1px solid var(--color-cream-dark)", borderRadius: "var(--radius-lg)", padding: "var(--space-6) var(--space-6) var(--space-5)" }}>
      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "var(--text-xs)", color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "var(--tracking-lg)", marginBottom: "var(--space-2)" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-5)", marginBottom: "var(--space-2)" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontStyle: "italic", fontSize: "var(--text-hero)", lineHeight: 1, color: "var(--color-navy)" }}>
          {value}
        </div>
        {friendValue != null && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-half)" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontStyle: "italic", fontSize: "var(--text-hero)", lineHeight: 1, color: "var(--color-accent)" }}>
              {friendValue}
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", color: "var(--color-accent)", textTransform: "uppercase" }}>
              S
            </div>
          </div>
        )}
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "var(--text-sm)", color: "var(--color-meta-text)", minHeight: "var(--space-5)" }}>
        {delta ?? ""}
      </div>
    </div>
  );
}

// ── Season card ───────────────────────────────────────────

function SeasonCard({ season, children }: { season: Season; children: React.ReactNode }) {
  const { label, icon } = SEASON_META[season];
  return (
    <div style={{
      background: "var(--color-cream)",
      border: "1px solid var(--color-cream-dark)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-6)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-meta-text)" }}>
        {icon}
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function SeasonSection({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "var(--space-8)" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-lg)", color: "var(--color-navy)" }}>
          {title}
        </div>
        {sub && <div className="max-sm:text-sm" style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>{sub}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}
        className="max-sm:grid-cols-1">
        {children}
      </div>
    </div>
  );
}

function profileDisplayName(p: Profile): string {
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ");
  return full || p.username || p.id;
}

// ── Page ──────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded } = useData();

  const [period, setPeriod] = useState<TimePeriod>("all");
  const [season, setSeason] = useState<Season>("winter");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [compareWithId, setCompareWithId] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<{ fragrances: UserFragrance[]; compliments: UserCompliment[] } | null>(null);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [followProfiles, setFollowProfiles] = useState<Record<string, Profile>>({});

  useEffect(() => {
    if (!user) return;
    fetchFollows(user.id).then((all) => {
      const accepted = all.filter((f) => f.followerId === user.id && f.status === "accepted");
      setFollows(accepted);
      const ids = accepted.map((f) => f.followingId);
      Promise.all(ids.map((id) => fetchProfile(id))).then((ps) => {
        const map: Record<string, Profile> = {};
        ps.forEach((p, i) => { if (p) map[ids[i]] = p; });
        setFollowProfiles(map);
      });
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!compareWithId) { setCompareData(null); return; }
    loadAllData(compareWithId).then(({ data }) => {
      setCompareData({ fragrances: data.fragrances, compliments: data.compliments });
    });
  }, [compareWithId]);

  if (!user) return null;
  const curYear = new Date().getFullYear();
  const now = new Date();

  const MF = fragrances.filter((f) => f.userId === user.id);
  const MC = compliments.filter((c) => c.userId === user.id);
  const FF = compareData?.fragrances ?? [];
  const FC = compareData?.compliments ?? [];
  const showFriend = compareWithId !== null;

  const baseFrags = showFriend ? FF : MF;
  const baseComps = showFriend ? FC : MC;

  function filterFragsByTime(items: UserFragrance[]): UserFragrance[] {
    if (period === "all") return items;
    if (period === "year") return items.filter((i) => new Date(i.createdAt).getFullYear() === curYear);
    if (period === "season") {
      const ms = SEASON_MONTHS[season];
      return items.filter((i) => ms.includes(new Date(i.createdAt).getMonth() + 1));
    }
    if (period === "month") {
      const [y, m] = selectedMonth.split("-").map(Number);
      return items.filter((i) => {
        const d = new Date(i.createdAt);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
    }
    return items;
  }

  function filterCompsByTime(items: UserCompliment[]): UserCompliment[] {
    if (period === "all") return items;
    if (period === "year") return items.filter((c) => c.year === String(curYear));
    if (period === "season") {
      const ms = SEASON_MONTHS[season];
      return items.filter((c) => {
        const mo = parseInt(c.month);
        return !isNaN(mo) && ms.includes(mo);
      });
    }
    if (period === "month") {
      const [y, m] = selectedMonth.split("-").map(Number);
      return items.filter((c) => c.year === String(y) && parseInt(c.month) === m);
    }
    return items;
  }

  const activeFrags = filterFragsByTime(baseFrags);
  const activeComps = filterCompsByTime(baseComps);

  // Stat cards always show user's own values
  const myActiveFrags = filterFragsByTime(MF);
  const myActiveComps = filterCompsByTime(MC);

  const totalComps = myActiveComps.length;
  const compDelta = myActiveComps.filter((c) => {
    const mo = parseInt(c.month);
    return !isNaN(mo) && mo === now.getMonth() + 1 && c.year === String(now.getFullYear());
  }).length;
  const inCollection = myActiveFrags.length;
  const ratedCount = myActiveFrags.filter((f) => f.personalRating).length;
  const strangerCount = myActiveComps.filter((c) => c.relation === "Stranger").length;
  const strangerPct = totalComps > 0 ? Math.round((strangerCount / totalComps) * 100) : 0;
  const avgRat = avgRatingStr(myActiveFrags);

  // Friend stat values (only when compare mode active and data loaded)
  const friendActiveFrags = showFriend ? filterFragsByTime(FF) : [];
  const friendActiveComps = showFriend ? filterCompsByTime(FC) : [];
  const friendTotalComps = showFriend ? friendActiveComps.length : undefined;
  const friendInCollection = showFriend ? friendActiveFrags.length : undefined;
  const friendStrangerCount = showFriend ? friendActiveComps.filter((c) => c.relation === "Stranger").length : undefined;
  const friendStrangerPct = (showFriend && friendTotalComps != null && friendTotalComps > 0)
    ? Math.round((friendStrangerCount! / friendTotalComps) * 100)
    : undefined;
  const friendAvgRat = showFriend ? avgRatingStr(friendActiveFrags) : undefined;

  const growthData = useMemo(() => buildGrowthData(activeFrags), [activeFrags]);
  const complimentsMonthly = useMemo(() => buildMonthlyBars(activeComps, baseFrags), [activeComps, baseFrags]);

  const statusData = useMemo(() => {
    const counts: Record<string, { value: number; fragrances: string[] }> = {};
    activeFrags.forEach((f) => {
      if (!counts[f.status]) counts[f.status] = { value: 0, fragrances: [] };
      counts[f.status].value++;
      counts[f.status].fragrances.push(f.name);
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].value - a[1].value)
      .map(([status, { value, fragrances }]) => ({
        status,
        name: STATUS_LABELS[status] ?? status,
        value,
        fragrances,
        color: STATUS_COLORS[status] ?? "var(--color-meta-text)",
      }));
  }, [activeFrags]);

  const ratingData = useMemo(() => {
    const byRating: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    activeFrags.forEach((f) => {
      const r = parseRating(f.personalRating);
      if (r >= 1 && r <= 5) byRating[r].push(f.name);
    });
    return [5, 4, 3, 2, 1].map((s) => ({ star: `★ ${s}`, count: byRating[s].length, fragrances: byRating[s] }));
  }, [activeFrags]);
  const hasRatings = ratingData.some((d) => d.count > 0);

  const topComplimented = useMemo(() => {
    const counts: Record<string, { name: string; house: string; count: number }> = {};
    activeComps.forEach((c) => {
      if (!c.primaryFragId) return;
      if (!counts[c.primaryFragId]) {
        const frag = baseFrags.find((f) => f.id === c.primaryFragId || f.fragranceId === c.primaryFragId);
        counts[c.primaryFragId] = {
          name: frag?.name ?? (c as any).primaryFrag ?? c.primaryFragId,
          house: frag?.house ?? "",
          count: 0,
        };
      }
      counts[c.primaryFragId].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [activeComps, baseFrags]);

  const locationData = useMemo(() => {
    const byLoc: Record<string, { count: number; fragNames: string[] }> = {};
    activeComps.forEach((c) => {
      const loc = c.city ?? c.country ?? (c as any).location ?? null;
      if (!loc) return;
      if (!byLoc[loc]) byLoc[loc] = { count: 0, fragNames: [] };
      byLoc[loc].count++;
      if (c.primaryFragId) {
        const frag = baseFrags.find((f) => f.id === c.primaryFragId || f.fragranceId === c.primaryFragId);
        const name = frag?.name ?? (c as any).primaryFrag ?? "";
        if (name && !byLoc[loc].fragNames.includes(name)) byLoc[loc].fragNames.push(name);
      }
    });
    return Object.entries(byLoc)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([name, { count, fragNames }]) => ({ name, count, fragNames }));
  }, [activeComps, baseFrags]);

  const monthOptions = useMemo(() => buildMonthOptions(MF, MC), [MF.length, MC.length]);

  // Seasonal data — always uses full MF/MC, not time-filtered
  const seasonalCompliments = useMemo(() => buildSeasonalCompliments(MC, MF), [MC, MF]);
  const seasonalAcquisitions = useMemo(() => buildSeasonalAcquisitions(MF), [MF]);
  const seasonalAccords = useMemo(() => buildSeasonalAccords(MF, communityFrags), [MF, communityFrags]);

  return (
    <>
      <Topbar title="Analytics" actions={<FragSearch />} />
      <PageContent>

        {/* Stat cards */}
        <div className="dash-stat-grid mb-6">
          <StatCard label="Total Compliments" value={totalComps} delta={compDelta > 0 ? `+${compDelta} this month` : undefined} friendValue={friendTotalComps} />
          <StatCard label="In Collection" value={inCollection} delta={ratedCount > 0 ? `${ratedCount} rated` : undefined} friendValue={friendInCollection} />
          <StatCard label="From Strangers" value={totalComps > 0 ? `${strangerPct}%` : "—"} delta={totalComps > 0 ? `${strangerCount} of ${totalComps}` : undefined} friendValue={friendStrangerPct != null ? `${friendStrangerPct}%` : undefined} />
          <StatCard label="Avg Rating" value={avgRat} delta={ratedCount > 0 ? `${ratedCount} rated` : undefined} friendValue={friendAvgRat} />
        </div>

        {/* Filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <TabPill label="All Time" active={period === "all"} onClick={() => setPeriod("all")} />
            <TabPill label="Year" active={period === "year"} onClick={() => setPeriod("year")} />
            <TabPill label="Season" active={period === "season"} onClick={() => setPeriod("season")} />
            {period === "season" && (
              <div className="max-sm:w-full" style={{ width: "130px", marginLeft: "var(--space-1)" }}>
                <Select options={SEASON_OPTIONS} value={season} onChange={(v) => setSeason(v as Season)} />
              </div>
            )}
            <TabPill label="Month" active={period === "month"} onClick={() => setPeriod("month")} />
            {period === "month" && monthOptions.length > 0 && (
              <div className="max-sm:w-full" style={{ width: "140px", marginLeft: "var(--space-1)" }}>
                <Select options={monthOptions} value={selectedMonth} onChange={setSelectedMonth} />
              </div>
            )}
          </div>
          {follows.length > 0 && (() => {
            const starred = follows.filter((f) => f.starred);
            const unstarred = follows.filter((f) => !f.starred);
            const friendOptions = [
              ...starred.map((f) => ({ value: f.followingId, label: followProfiles[f.followingId] ? profileDisplayName(followProfiles[f.followingId]) : f.followingId })),
              ...(starred.length > 0 && unstarred.length > 0 ? [{ value: "__divider__", label: "", divider: true as const }] : []),
              ...unstarred.map((f) => ({ value: f.followingId, label: followProfiles[f.followingId] ? profileDisplayName(followProfiles[f.followingId]) : f.followingId })),
            ];
            return (
              <div className="ml-auto" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Button variant="secondary" disabled style={{ cursor: "default" }}>Compare with</Button>
                <Select
                  size="auto"
                  options={[{ value: "", label: "No one" }, ...friendOptions]}
                  value={compareWithId ?? ""}
                  onChange={(v) => setCompareWithId(v || null)}
                />
              </div>
            );
          })()}
        </div>

        {/* Comparative view */}
        {showFriend && compareWithId && (
          <div style={{ marginBottom: "var(--space-8)" }}>
            <CompareView
              myFrags={MF}
              myComps={MC}
              friendFrags={FF}
              friendComps={FC}
              myName={user.name ?? "Me"}
              friendName={followProfiles[compareWithId] ? profileDisplayName(followProfiles[compareWithId]) : "Friend"}
            />
          </div>
        )}

        {/* Charts grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-5)" }}
          className="max-md:grid-cols-1"
        >
          <ChartCard title="Collection Growth" sub="Cumulative fragrances over time" wide>
            {!isLoaded ? (
              <ChartSkeleton height={240} />
            ) : growthData.length < 2 ? (
              <ChartEmpty icon={<TrendingUp size={24} />} title="Not enough data yet" height={240} />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={growthData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid horizontal vertical={false} stroke="var(--color-cream-dark)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-navy)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-navy)" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<GrowthTooltip />} />
                  <Area type="monotone" dataKey="count" fill="var(--color-navy-tint)" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-accent)" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Compliments Over Time" sub="Monthly compliment frequency">
            {!isLoaded ? (
              <ChartSkeleton height={200} />
            ) : complimentsMonthly.length === 0 ? (
              <ChartEmpty icon={<MessageCircle size={24} />} title="Log compliments to see trends" height={200} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={complimentsMonthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid horizontal vertical={false} stroke="var(--color-cream-dark)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-navy)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-navy)" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CompsTooltip />} />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Status Breakdown" sub="Your collection by current status">
            {!isLoaded ? (
              <ChartSkeleton height={200} />
            ) : statusData.length === 0 ? (
              <ChartEmpty icon={<PieIcon size={24} />} title="Add fragrances to see breakdown" height={200} />
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" innerRadius={50} outerRadius={88} paddingAngle={2}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<StatusTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                  {statusData.map((d) => (
                    <div key={d.status} style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                      <div style={{ width: "var(--space-2)", height: "var(--space-2)", borderRadius: "var(--radius-full)", background: d.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Rating Distribution" sub="How you've rated your fragrances">
            {!isLoaded ? (
              <ChartSkeleton height={180} />
            ) : !hasRatings ? (
              <ChartEmpty icon={<Star size={24} />} title="Rate fragrances to see distribution" height={180} />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ratingData} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid horizontal={false} vertical stroke="var(--color-cream-dark)" strokeDasharray="4 4" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-navy)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="star" tick={{ fontSize: 11, fill: "var(--color-navy)" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<RatingTooltip />} />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Most Complimented" sub="Fragrances that get the most attention">
            {!isLoaded ? (
              <ChartSkeleton height={220} />
            ) : topComplimented.length === 0 ? (
              <ChartEmpty icon={<Award size={24} />} title="Log compliments to see rankings" height={220} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                {topComplimented.map((item, i) => (
                  <RankedRow
                    key={i}
                    rank={i + 1}
                    name={item.name}
                    sub={item.house || undefined}
                    count={item.count}
                    maxCount={topComplimented[0].count}
                    unit="compliments"
                    tooltipHeader={item.name}
                    tooltipLines={item.house ? [item.house] : []}
                  />
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Where You Received Compliments" sub="Top locations and contexts" wide>
            {!isLoaded ? (
              <ChartSkeleton height={200} />
            ) : locationData.length === 0 ? (
              <ChartEmpty icon={<Award size={24} />} title="Log compliments with locations to see breakdown" height={200} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                {locationData.map((item, i) => (
                  <RankedRow
                    key={i}
                    rank={i + 1}
                    name={item.name}
                    count={item.count}
                    maxCount={locationData[0].count}
                    unit="compliments"
                    tooltipHeader={item.name}
                    tooltipLines={item.fragNames}
                  />
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Seasonal sections */}
        {isLoaded && (
          <>
            <SeasonSection title="Seasonal Compliments" sub="When you receive the most compliments by season">
              {ALL_SEASONS.map((s) => {
                const d = seasonalCompliments.find((x) => x.season === s)!;
                return (
                  <SeasonCard key={s} season={s}>
                    <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-hero)", color: "var(--color-navy)", lineHeight: 1 }}>
                      {d.count}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
                      COMPLIMENTS
                    </div>
                    {d.topFrag && (
                      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)", borderTop: "1px solid var(--color-row-divider)", paddingTop: "var(--space-2)" }}>
                        {d.topFrag}
                      </div>
                    )}
                  </SeasonCard>
                );
              })}
            </SeasonSection>

            <SeasonSection title="Seasonal Acquisitions" sub="When you add the most fragrances to your collection">
              {ALL_SEASONS.map((s) => {
                const d = seasonalAcquisitions.find((x) => x.season === s)!;
                return (
                  <SeasonCard key={s} season={s}>
                    <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-hero)", color: "var(--color-navy)", lineHeight: 1 }}>
                      {d.count}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
                      FRAGRANCES ACQUIRED
                    </div>
                    {d.topFrag && (
                      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)", borderTop: "1px solid var(--color-row-divider)", paddingTop: "var(--space-2)" }}>
                        {d.topFrag}
                      </div>
                    )}
                  </SeasonCard>
                );
              })}
            </SeasonSection>

            <SeasonSection title="Seasonal Accords" sub="Top accords in fragrances you add each season">
              {ALL_SEASONS.map((s) => {
                const d = seasonalAccords.find((x) => x.season === s)!;
                return (
                  <SeasonCard key={s} season={s}>
                    {d.topAccords.length === 0 ? (
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>No data</div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                        {d.topAccords.map(([accord]) => (
                          <span key={accord} style={{
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            fontSize: "var(--text-xs)",
                            color: "var(--color-navy)",
                            background: "var(--color-row-hover)",
                            borderRadius: "var(--radius-full)",
                            padding: "var(--space-half) var(--space-2)",
                          }}>
                            {accord}
                          </span>
                        ))}
                      </div>
                    )}
                  </SeasonCard>
                );
              })}
            </SeasonSection>
          </>
        )}
      </PageContent>
    </>
  );
}
