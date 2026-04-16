"use client";

import { useState, useMemo } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { addedThisMonth, avgRatingStr, parseRating, MONTHS } from "@/lib/frag-utils";
import { Select } from "@/components/ui/select";
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
import { TrendingUp, MessageCircle, PieChart as PieIcon, Star, Award } from "lucide-react";
import type { UserFragrance, UserCompliment } from "@/types";

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
  PREVIOUSLY_OWNED: "rgba(30,45,69,0.8)",
  WANT_TO_SMELL: "#6B8FAA",
  DONT_LIKE: "var(--color-destructive)",
  FINISHED: "#6B7280",
  WANT_TO_IDENTIFY: "#8B6F4E",
};

// ── Helpers ────────────────────────────────────────────────

function buildGrowthData(frags: UserFragrance[]) {
  const sorted = [...frags].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  const counts: Record<string, number> = {};
  sorted.forEach((f) => {
    const d = new Date(f.createdAt);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  });
  let cum = 0;
  return Object.entries(counts)
    .sort()
    .map(([key, n]) => {
      cum += n;
      const [yr, mo] = key.split("-");
      const label = MONTHS[parseInt(mo) - 1];
      return { label, fullLabel: `${label} ${yr}`, count: cum };
    });
}

function buildMonthlyBars(items: UserCompliment[]) {
  const counts: Record<string, number> = {};
  items.forEach((c) => {
    const d = new Date(c.createdAt);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort()
    .map(([key, count]) => {
      const [yr, mo] = key.split("-");
      const label = MONTHS[parseInt(mo) - 1];
      return { label, fullLabel: `${label} ${yr}`, count };
    });
}

function buildMonthOptions(frags: UserFragrance[], comps: UserCompliment[]): { value: string; label: string }[] {
  const s = new Set<string>();
  const add = (dt: string) => {
    const d = new Date(dt);
    if (!isNaN(d.getTime())) s.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  frags.forEach((f) => add(f.createdAt));
  comps.forEach((c) => add(c.createdAt));
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

// ── Tooltip style ─────────────────────────────────────────

const tooltipStyle: React.CSSProperties = {
  background: "var(--color-cream)",
  border: "1px solid var(--color-cream-dark)",
  borderRadius: "3px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  fontFamily: "var(--font-sans)",
  fontSize: "12px",
  padding: "6px 10px",
  color: "var(--color-navy)",
};

function GrowthTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { fullLabel: string }; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return <div style={tooltipStyle}>{payload[0].payload.fullLabel}: {payload[0].value} fragrances</div>;
}

function BarsTooltip({ active, payload, unit }: {
  active?: boolean;
  payload?: Array<{ payload: { fullLabel: string }; value: number }>;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return <div style={tooltipStyle}>{payload[0].payload.fullLabel}: {payload[0].value} {unit ?? ""}</div>;
}

function StatusTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return <div style={tooltipStyle}>{d.name}: {d.value}</div>;
}

function RatingTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { star: string }; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return <div style={tooltipStyle}>{payload[0].payload.star}: {payload[0].value} fragrances</div>;
}

// ── Skeleton ──────────────────────────────────────────────

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        background: "var(--color-cream-dark)",
        borderRadius: "3px",
        opacity: 0.5,
      }}
    />
  );
}

// ── Empty state ───────────────────────────────────────────

function ChartEmpty({ icon, title, height }: {
  icon: React.ReactNode;
  title: string;
  height: number;
}) {
  return (
    <div
      style={{
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        color: "var(--color-navy)",
      }}
    >
      {icon}
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px" }}>{title}</span>
    </div>
  );
}

// ── Ranked row ────────────────────────────────────────────

function RankedRow({ rank, name, sub, count, maxCount, unit }: {
  rank: number;
  name: string;
  sub?: string;
  count: number;
  maxCount: number;
  unit: string;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", height: 44 }}>
      <span style={{ width: 24, flexShrink: 0, fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-navy)", fontWeight: 500 }}>
        {rank}
      </span>
      <div style={{ display: "flex", flexDirection: "column", width: 140, flexShrink: 0, minWidth: 0, overflow: "hidden" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 500, color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </span>
        {sub && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sub}
          </span>
        )}
      </div>
      <div style={{ flex: 1, height: 4, background: "var(--color-cream-dark)", borderRadius: "9999px", margin: "0 16px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-accent)", borderRadius: "9999px" }} />
      </div>
      <span style={{ flexShrink: 0, whiteSpace: "nowrap", fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-navy)" }}>
        {count} {unit}
      </span>
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────

function ChartCard({ title, sub, children, wide }: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--color-cream-dark)",
        borderRadius: "6px",
        padding: "24px",
        gridColumn: wide ? "1 / -1" : undefined,
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "18px", color: "var(--color-navy)", marginBottom: "2px" }}>
          {title}
        </div>
        {sub && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-navy)" }}>
            {sub}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────

function StatCard({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid var(--color-cream-dark)", borderRadius: "6px", padding: "24px 24px 20px" }}>
      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "12px", color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontStyle: "italic", fontSize: "48px", lineHeight: 1, color: "var(--color-navy)", marginBottom: "8px" }}>
        {value}
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: "13px", color: "var(--color-navy)", minHeight: "20px" }}>
        {delta ?? ""}
      </div>
    </div>
  );
}

// ── Time filter pills ─────────────────────────────────────

function TimePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "6px 14px",
        borderRadius: "2px",
        border: active ? "1px solid var(--color-navy)" : "1px solid var(--color-cream-dark)",
        background: active ? "var(--color-navy)" : "transparent",
        color: active ? "var(--color-cream)" : "var(--color-navy)",
        cursor: "pointer",
        transition: "all 120ms",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, profiles } = useUser();
  const { fragrances, compliments, isLoaded } = useData();

  const [period, setPeriod] = useState<TimePeriod>("all");
  const [season, setSeason] = useState<Season>("winter");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showFriend, setShowFriend] = useState(false);

  if (!user) return null;

  const friend = profiles.find((p) => p.id !== user.id) ?? null;
  const curYear = new Date().getFullYear();
  const now = new Date();

  // Base data sets
  const MF = fragrances.filter((f) => f.userId === user.id);
  const MC = compliments.filter((c) => c.userId === user.id);
  const FF = friend ? fragrances.filter((f) => f.userId === friend.id) : [];
  const FC = friend ? compliments.filter((c) => c.userId === friend.id) : [];

  const baseFrags = showFriend ? FF : MF;
  const baseComps = showFriend ? FC : MC;

  // Apply time filter
  function filterByTime<T extends { createdAt: string }>(items: T[]): T[] {
    if (period === "all") return items;
    if (period === "year") {
      return items.filter((i) => new Date(i.createdAt).getFullYear() === curYear);
    }
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

  const activeFrags = filterByTime(baseFrags);
  const activeComps = filterByTime(baseComps);

  // Stat card data
  const totalComps = activeComps.length;
  const compDelta = addedThisMonth(activeComps, now.getMonth() + 1, now.getFullYear());
  const inCollection = activeFrags.length;
  const ratedCount = activeFrags.filter((f) => f.personalRating).length;
  const strangerCount = activeComps.filter((c) => c.relation === "Stranger").length;
  const strangerPct = totalComps > 0 ? Math.round((strangerCount / totalComps) * 100) : 0;
  const avgRat = avgRatingStr(activeFrags);

  // Chart data
  const growthData = useMemo(() => buildGrowthData(activeFrags), [activeFrags]);
  const complimentsMonthly = useMemo(() => buildMonthlyBars(activeComps), [activeComps]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeFrags.forEach((f) => { counts[f.status] = (counts[f.status] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, value]) => ({
        status,
        name: STATUS_LABELS[status] ?? status,
        value,
        color: STATUS_COLORS[status] ?? "rgba(30,45,69,0.8)",
      }));
  }, [activeFrags]);

  const ratingData = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    activeFrags.forEach((f) => {
      const r = parseRating(f.personalRating);
      if (r >= 1 && r <= 5) counts[r]++;
    });
    return [5, 4, 3, 2, 1].map((s) => ({ star: `★ ${s}`, count: counts[s] ?? 0 }));
  }, [activeFrags]);
  const hasRatings = ratingData.some((d) => d.count > 0);

  const topComplimented = useMemo(() => {
    const counts: Record<string, { name: string; house: string; count: number }> = {};
    activeComps.forEach((c) => {
      if (!c.primaryFragId) return;
      if (!counts[c.primaryFragId]) {
        const frag = baseFrags.find((f) => f.id === c.primaryFragId || f.fragranceId === c.primaryFragId);
        counts[c.primaryFragId] = {
          name: frag?.name ?? c.primaryFrag ?? c.primaryFragId,
          house: frag?.house ?? "",
          count: 0,
        };
      }
      counts[c.primaryFragId].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [activeComps, baseFrags]);

  const locationData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeComps.forEach((c) => {
      const loc = c.city ?? c.country ?? c.location ?? null;
      if (!loc) return;
      counts[loc] = (counts[loc] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [activeComps]);

  const monthOptions = useMemo(() => buildMonthOptions(MF, MC), [MF.length, MC.length]);

  return (
    <>
      <Topbar title="Analytics" />
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--color-cream)", padding: "32px 24px 40px" }}>

        {/* Stat cards */}
        <div className="dash-stat-grid mb-6">
          <StatCard
            label="Total Compliments"
            value={totalComps}
            delta={compDelta > 0 ? `+${compDelta} this month` : undefined}
          />
          <StatCard
            label="In Collection"
            value={inCollection}
            delta={ratedCount > 0 ? `${ratedCount} rated` : undefined}
          />
          <StatCard
            label="From Strangers"
            value={totalComps > 0 ? `${strangerPct}%` : "—"}
            delta={totalComps > 0 ? `${strangerCount} of ${totalComps}` : undefined}
          />
          <StatCard
            label="Avg Rating"
            value={avgRat}
            delta={ratedCount > 0 ? `${ratedCount} rated` : undefined}
          />
        </div>

        {/* Time + friend filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
          {/* Time pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <TimePill label="All Time" active={period === "all"} onClick={() => setPeriod("all")} />
            <TimePill label="Year" active={period === "year"} onClick={() => setPeriod("year")} />
            <TimePill label="Season" active={period === "season"} onClick={() => setPeriod("season")} />
            {period === "season" && (
              <div style={{ width: "130px", marginLeft: "4px" }}>
                <Select
                  options={SEASON_OPTIONS}
                  value={season}
                  onChange={(v) => setSeason(v as Season)}
                />
              </div>
            )}
            <TimePill label="Month" active={period === "month"} onClick={() => setPeriod("month")} />
            {period === "month" && monthOptions.length > 0 && (
              <div style={{ width: "140px", marginLeft: "4px" }}>
                <Select
                  options={monthOptions}
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                />
              </div>
            )}
          </div>

          {/* Friend toggle */}
          {friend && (
            <button
              onClick={() => setShowFriend((v) => !v)}
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "6px 14px",
                borderRadius: "2px",
                border: showFriend ? "1px solid var(--color-accent)" : "1px solid var(--color-cream-dark)",
                background: showFriend ? "var(--color-accent)" : "transparent",
                color: showFriend ? "var(--color-cream)" : "var(--color-navy)",
                cursor: "pointer",
                transition: "all 120ms",
                marginLeft: "auto",
              }}
            >
              {friend.name}
            </button>
          )}
        </div>

        {/* Charts grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "20px",
          }}
          className="max-md:grid-cols-1"
        >
          {/* Collection Growth — full width */}
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
                  <Area type="monotone" dataKey="count" fill="rgba(45,74,107,0.08)" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-accent)" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Compliments Over Time */}
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
                  <Tooltip content={<BarsTooltip unit="compliments" />} />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Status Breakdown */}
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                  {statusData.map((d) => (
                    <div key={d.status} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(30,45,69,0.8)" }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>

          {/* Rating Distribution */}
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

          {/* Most Complimented */}
          <ChartCard title="Most Complimented" sub="Fragrances that get the most attention">
            {!isLoaded ? (
              <ChartSkeleton height={220} />
            ) : topComplimented.length === 0 ? (
              <ChartEmpty icon={<Award size={24} />} title="Log compliments to see rankings" height={220} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {topComplimented.map((item, i) => (
                  <RankedRow
                    key={i}
                    rank={i + 1}
                    name={item.name}
                    sub={item.house || undefined}
                    count={item.count}
                    maxCount={topComplimented[0].count}
                    unit="compliments"
                  />
                ))}
              </div>
            )}
          </ChartCard>

          {/* Where You Received Compliments — full width */}
          <ChartCard title="Where You Received Compliments" sub="Top locations and contexts" wide>
            {!isLoaded ? (
              <ChartSkeleton height={200} />
            ) : locationData.length === 0 ? (
              <ChartEmpty icon={<Award size={24} />} title="Log compliments with locations to see breakdown" height={200} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {locationData.map((item, i) => (
                  <RankedRow
                    key={i}
                    rank={i + 1}
                    name={item.name}
                    count={item.count}
                    maxCount={locationData[0].count}
                    unit="compliments"
                  />
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </main>
    </>
  );
}
