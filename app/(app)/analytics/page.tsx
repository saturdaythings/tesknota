"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/card";
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawFrag {
  id: string;
  fragrance_id: string | null;
  name: string;
  house: string;
  status: string;
  personal_rating: number | null;
  created_at: string;
}

interface RawCompliment {
  id: string;
  primary_frag_id: string | null;
  primary_frag_name: string;
  created_at: string;
  location: string | null;
}

type TimeRange = "3M" | "6M" | "1Y" | "All";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function cutoffDate(range: TimeRange): Date | null {
  if (range === "All") return null;
  const d = new Date();
  d.setDate(d.getDate() - (range === "3M" ? 90 : range === "6M" ? 180 : 365));
  return d;
}

function applyTimeFilter<T extends { created_at: string }>(items: T[], range: TimeRange): T[] {
  const cutoff = cutoffDate(range);
  if (!cutoff) return items;
  return items.filter((i) => new Date(i.created_at) >= cutoff!);
}

function buildGrowthData(frags: RawFrag[]) {
  const sorted = [...frags].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const counts: Record<string, number> = {};
  sorted.forEach((f) => {
    const d = new Date(f.created_at);
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
      const label = MONTH_NAMES[parseInt(mo) - 1];
      return { label, fullLabel: `${label} ${yr}`, count: cum };
    });
}

function buildMonthlyBars(items: { created_at: string }[]) {
  const counts: Record<string, number> = {};
  items.forEach((i) => {
    const d = new Date(i.created_at);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort()
    .map(([key, count]) => {
      const [yr, mo] = key.split("-");
      const label = MONTH_NAMES[parseInt(mo) - 1];
      return { label, fullLabel: `${label} ${yr}`, count };
    });
}

const STATUS_COLORS: Record<string, string> = {
  CURRENT: "var(--color-accent)",
  WANT_TO_BUY: "var(--s-unk)",
  PREVIOUSLY_OWNED: "var(--color-text-muted)",
  WANT_TO_SMELL: "var(--color-warning)",
  DONT_LIKE: "var(--color-danger)",
  FINISHED: "var(--color-success)",
  WANT_TO_IDENTIFY: "#92520A",
};

const STATUS_LABELS: Record<string, string> = {
  CURRENT: "Current",
  WANT_TO_BUY: "Wishlist",
  PREVIOUSLY_OWNED: "Prev. Owned",
  WANT_TO_SMELL: "Want to Smell",
  DONT_LIKE: "Don't Like",
  FINISHED: "Finished",
  WANT_TO_IDENTIFY: "Identify Later",
};

// ── Shared tooltip style ───────────────────────────────────────────────────────

const tooltipStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "var(--shadow-md)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-xs)",
  padding: "var(--space-2) var(--space-3)",
  color: "var(--color-text-primary)",
};

// ── Custom tooltips ────────────────────────────────────────────────────────────

function GrowthTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { fullLabel: string }; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      {payload[0].payload.fullLabel}: {payload[0].value} fragrances
    </div>
  );
}

function ComplimentsTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { fullLabel: string }; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      {payload[0].payload.fullLabel}: {payload[0].value} compliments
    </div>
  );
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
  return (
    <div style={tooltipStyle}>
      {payload[0].payload.star}: {payload[0].value} fragrances
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        background: "var(--color-surface-raised)",
        borderRadius: "var(--radius-sm)",
      }}
    />
  );
}

// ── Inline empty ───────────────────────────────────────────────────────────────

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
        gap: "var(--space-2)",
        color: "var(--color-text-muted)",
      }}
    >
      {icon}
      <span className="text-meta">{title}</span>
    </div>
  );
}

// ── Ranked list row ────────────────────────────────────────────────────────────

function RankedRow({
  rank,
  name,
  sub,
  count,
  maxCount,
  unit,
}: {
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
      <span
        className="text-label"
        style={{ width: 24, flexShrink: 0, color: "var(--color-text-muted)" }}
      >
        {rank}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 140,
          flexShrink: 0,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span
          className="text-body"
          style={{
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </span>
        {sub && (
          <span
            className="text-secondary"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </span>
        )}
      </div>
      <div
        style={{
          flex: 1,
          height: 4,
          background: "var(--color-surface-raised)",
          borderRadius: "var(--radius-full)",
          margin: "0 var(--space-4)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--color-accent)",
            borderRadius: "var(--radius-full)",
          }}
        />
      </div>
      <span className="text-meta" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
        {count} {unit}
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const TIME_RANGES: TimeRange[] = ["3M", "6M", "1Y", "All"];

export default function AnalyticsPage() {
  const [frags, setFrags] = useState<RawFrag[]>([]);
  const [compliments, setCompliments] = useState<RawCompliment[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("All");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [fragsRes, compsRes] = await Promise.all([
        supabase
          .from("user_fragrances")
          .select("id, fragrance_id, name, house, status, personal_rating, created_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("user_compliments")
          .select("id, primary_frag_id, primary_frag_name, created_at, location")
          .order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      if (fragsRes.error) console.error("[analytics] user_fragrances:", fragsRes.error.message);
      if (compsRes.error) console.error("[analytics] user_compliments:", compsRes.error.message);
      setFrags(fragsRes.data ?? []);
      setCompliments(compsRes.data ?? []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredFrags = useMemo(() => applyTimeFilter(frags, timeRange), [frags, timeRange]);
  const filteredComps = useMemo(() => applyTimeFilter(compliments, timeRange), [compliments, timeRange]);

  const growthData = useMemo(() => buildGrowthData(filteredFrags), [filteredFrags]);
  const complimentsMonthly = useMemo(() => buildMonthlyBars(filteredComps), [filteredComps]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredFrags.forEach((f) => {
      counts[f.status] = (counts[f.status] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, value]) => ({
        status,
        name: STATUS_LABELS[status] ?? status,
        value,
        color: STATUS_COLORS[status] ?? "var(--color-text-muted)",
      }));
  }, [filteredFrags]);

  const ratingData = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredFrags.forEach((f) => {
      if (f.personal_rating) {
        const r = Math.round(f.personal_rating);
        if (r >= 1 && r <= 5) counts[r] = (counts[r] ?? 0) + 1;
      }
    });
    return [5, 4, 3, 2, 1].map((star) => ({ star: `★ ${star}`, count: counts[star] ?? 0 }));
  }, [filteredFrags]);
  const hasRatings = ratingData.some((d) => d.count > 0);

  const topComplimented = useMemo(() => {
    const counts: Record<string, { name: string; house: string; count: number }> = {};
    filteredComps.forEach((c) => {
      if (!c.primary_frag_id) return;
      if (!counts[c.primary_frag_id]) {
        const frag = frags.find(
          (f) => f.id === c.primary_frag_id || f.fragrance_id === c.primary_frag_id
        );
        counts[c.primary_frag_id] = {
          name: frag?.name ?? c.primary_frag_name ?? c.primary_frag_id,
          house: frag?.house ?? "",
          count: 0,
        };
      }
      counts[c.primary_frag_id].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredComps, frags]);

  const locationData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredComps.forEach((c) => {
      if (!c.location) return;
      counts[c.location] = (counts[c.location] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [filteredComps]);

  return (
    <>
      <Topbar title="Analytics" />
      <main className="flex-1 overflow-y-auto" style={{ padding: "var(--space-4)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Time range segmented control */}
          <div style={{ marginBottom: "var(--space-8)" }}>
            <div
              style={{
                display: "inline-flex",
                background: "var(--color-surface-raised)",
                borderRadius: "var(--radius-sm)",
                padding: "var(--space-1)",
              }}
            >
              {TIME_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    height: 32,
                    padding: "0 var(--space-4)",
                    fontSize: "var(--text-xs)",
                    fontWeight: timeRange === range ? 600 : 500,
                    borderRadius: "var(--radius-sm)",
                    color: timeRange === range ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    background: timeRange === range ? "var(--color-surface)" : "transparent",
                    boxShadow: timeRange === range ? "var(--shadow-sm)" : "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: "var(--space-6)" }}
          >

            {/* Chart 1: Collection Growth — full width */}
            <Card className="lg:col-span-2">
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h2 className="text-subheading">Collection Growth</h2>
                <p className="text-secondary">Cumulative fragrances in your collection over time</p>
              </div>
              {loading ? (
                <Skeleton height={240} />
              ) : growthData.length < 2 ? (
                <ChartEmpty icon={<TrendingUp size={24} />} title="Not enough data yet" height={240} />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={growthData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid
                      horizontal
                      vertical={false}
                      stroke="var(--color-border)"
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 14, fill: "var(--color-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 14, fill: "var(--color-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<GrowthTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      fill="var(--color-accent-subtle)"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--color-accent)" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Chart 2: Compliments Over Time — left */}
            <Card>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h2 className="text-subheading">Compliments Over Time</h2>
                <p className="text-secondary">Monthly compliment frequency</p>
              </div>
              {loading ? (
                <Skeleton height={200} />
              ) : complimentsMonthly.length === 0 ? (
                <ChartEmpty
                  icon={<MessageCircle size={24} />}
                  title="Log compliments to see trends"
                  height={200}
                />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={complimentsMonthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid
                      horizontal
                      vertical={false}
                      stroke="var(--color-border)"
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 14, fill: "var(--color-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 14, fill: "var(--color-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<ComplimentsTooltip />} />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Chart 3: Status Breakdown — right */}
            <Card>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h2 className="text-subheading">Status Breakdown</h2>
                <p className="text-secondary">Your collection by current status</p>
              </div>
              {loading ? (
                <Skeleton height={200} />
              ) : statusData.length === 0 ? (
                <ChartEmpty
                  icon={<PieIcon size={24} />}
                  title="Add fragrances to see breakdown"
                  height={200}
                />
              ) : (
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<StatusTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "var(--space-3)",
                      marginTop: "var(--space-3)",
                    }}
                  >
                    {statusData.map((d) => (
                      <div
                        key={d.status}
                        style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: d.color,
                            flexShrink: 0,
                          }}
                        />
                        <span className="text-meta">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Chart 4: Rating Distribution — left */}
            <Card>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h2 className="text-subheading">Rating Distribution</h2>
                <p className="text-secondary">How you've rated your fragrances</p>
              </div>
              {loading ? (
                <Skeleton height={180} />
              ) : !hasRatings ? (
                <ChartEmpty
                  icon={<Star size={24} />}
                  title="Rate fragrances to see distribution"
                  height={180}
                />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={ratingData}
                    layout="vertical"
                    margin={{ top: 0, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      vertical
                      stroke="var(--color-border)"
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 14, fill: "var(--color-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="star"
                      tick={{ fontSize: 14, fill: "var(--color-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip content={<RatingTooltip />} />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Chart 5: Top Complimented — right */}
            <Card>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h2 className="text-subheading">Most Complimented</h2>
                <p className="text-secondary">Fragrances that get the most attention</p>
              </div>
              {loading ? (
                <Skeleton height={220} />
              ) : topComplimented.length === 0 ? (
                <ChartEmpty
                  icon={<Award size={24} />}
                  title="Log compliments to see rankings"
                  height={220}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
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
            </Card>

            {/* Chart 6: Location Breakdown — full width */}
            <Card className="lg:col-span-2">
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h2 className="text-subheading">Where You Received Compliments</h2>
                <p className="text-secondary">Top locations and contexts</p>
              </div>
              {loading ? (
                <Skeleton height={200} />
              ) : locationData.length === 0 ? (
                <ChartEmpty
                  icon={<Award size={24} />}
                  title="Log compliments with locations to see breakdown"
                  height={200}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
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
            </Card>

          </div>
        </div>
      </main>
    </>
  );
}
