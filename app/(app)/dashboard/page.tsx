"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  MessageCircle,
  Upload,
  FlaskConical,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Divider } from "@/components/ui/divider";
import { FragForm } from "@/components/ui/frag-form";
import { FragDetail } from "@/components/ui/frag-detail";
import { CompForm } from "@/components/ui/comp-form";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { addedThisMonth, avgRatingStr, parseRating } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import type { UserFragrance, FragranceStatus } from "@/types";

const WISHLIST_STATUSES = new Set<FragranceStatus>([
  "WANT_TO_BUY",
  "WANT_TO_SMELL",
  "WANT_TO_IDENTIFY",
]);

const COMPLETENESS_FIELDS: Array<(f: UserFragrance) => boolean> = [
  (f) => !!f.name?.trim(),
  (f) => !!f.house?.trim(),
  (f) => f.personalRating !== null,
  (f) => f.sizes != null && f.sizes.length > 0,
  (f) => !!f.purchasePrice?.trim(),
];

function isComplete(f: UserFragrance): boolean {
  return COMPLETENESS_FIELDS.every((check) => check(f));
}

function fragInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function statusBadgeVariant(
  status: FragranceStatus,
): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "CURRENT":
      return "collection";
    case "WANT_TO_BUY":
    case "WANT_TO_SMELL":
      return "wishlist";
    case "WANT_TO_IDENTIFY":
      return "identify_later";
    case "PREVIOUSLY_OWNED":
      return "previously_owned";
    case "DONT_LIKE":
      return "dont_like";
    case "FINISHED":
      return "finished";
    default:
      return "neutral";
  }
}

// ── Circular progress ring ────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 32;
  const stroke = 4;
  const size = (r + stroke) * 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);
  const done = pct >= 100;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-surface-raised)"
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={done ? "var(--color-success)" : "var(--color-accent)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 700,
          fill: done ? "var(--color-success)" : "var(--color-accent)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded, removeFrag } =
    useData();
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [editingFrag, setEditingFrag] = useState<UserFragrance | null>(null);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [compFormOpen, setCompFormOpen] = useState(false);

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const MF = useMemo(
    () => (user ? fragrances.filter((f) => f.userId === user.id) : []),
    [fragrances, user],
  );
  const MC = useMemo(
    () => (user ? compliments.filter((c) => c.userId === user.id) : []),
    [compliments, user],
  );

  const wishFrags = useMemo(
    () => MF.filter((f) => WISHLIST_STATUSES.has(f.status)),
    [MF],
  );

  const collDelta = addedThisMonth(MF, curMonth, curYear);
  const compDelta = addedThisMonth(MC, curMonth, curYear);
  const avgRat = avgRatingStr(MF);

  // Recently added — all frags sorted by createdAt desc
  const recentlyAdded = useMemo(
    () =>
      [...MF]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 5),
    [MF],
  );

  // Compliment counts per frag
  const compCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    MC.forEach((c) => {
      if (c.primaryFragId) {
        map[c.primaryFragId] = (map[c.primaryFragId] ?? 0) + 1;
      }
    });
    return map;
  }, [MC]);

  // Most complimented — sort MF by comp count desc
  const mostComplimented = useMemo(
    () =>
      [...MF]
        .map((f) => ({
          frag: f,
          count: compCountMap[f.fragranceId ?? f.id] ?? 0,
        }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    [MF, compCountMap],
  );

  // Status breakdown
  const statusCounts = useMemo(() => {
    const counts: Partial<Record<FragranceStatus, number>> = {};
    MF.forEach((f) => {
      counts[f.status] = (counts[f.status] ?? 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, n]) => (n ?? 0) > 0)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0)) as [FragranceStatus, number][];
  }, [MF]);

  // Data quality
  const completeCount = useMemo(
    () => MF.filter(isComplete).length,
    [MF],
  );
  const incompleteFrags = useMemo(
    () => MF.filter((f) => !isComplete(f)).slice(0, 3),
    [MF],
  );
  const qualityPct = MF.length > 0 ? (completeCount / MF.length) * 100 : 0;

  if (!user) return null;

  function openAdd() {
    setEditingFrag(null);
    setFormOpen(true);
  }

  async function handleDeleteFrag(frag: UserFragrance) {
    await removeFrag(frag.id);
    setDetailFrag(null);
  }

  return (
    <>
      <FragDetail
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        frag={detailFrag}
        communityFrags={communityFrags}
        compliments={MC}
        userId={user.id}
        onEdit={(frag) => {
          setEditingFrag(frag);
          setFormOpen(true);
        }}
        onDelete={handleDeleteFrag}
      />
      <FragForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingFrag(null);
        }}
        editing={editingFrag}
      />
      <CompForm open={compFormOpen} onClose={() => setCompFormOpen(false)} editing={null} />

      <Topbar title="Dashboard" />

      <main
        style={{ flex: 1, overflowY: "auto" }}
        className="focus-visible:outline-none"
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "var(--space-8)",
          }}
          className="max-sm:px-[var(--space-4)] max-sm:py-[var(--space-4)]"
        >
          {/* ── Stat Row ─────────────────────────────── */}
          {!isLoaded ? (
            <div
              className="grid gap-[var(--space-4)] mb-[var(--space-6)]"
              style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
            >
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[92px]" />
              ))}
            </div>
          ) : (
            <div
              className="grid gap-[var(--space-4)] mb-[var(--space-6)] max-[768px]:grid-cols-2 max-[480px]:grid-cols-1"
              style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
            >
              <StatCard
                label="Collection"
                value={MF.length}
                delta={collDelta > 0 ? `+${collDelta} this mo` : undefined}
                deltaPositive
              />
              <StatCard
                label="Compliments"
                value={MC.length}
                delta={compDelta > 0 ? `+${compDelta} this mo` : undefined}
                deltaPositive
              />
              <StatCard label="Wishlist" value={wishFrags.length} />
              <StatCard
                label="Avg Rating"
                value={avgRat || "—"}
              />
            </div>
          )}

          {/* ── Quick Actions ─────────────────────────── */}
          <div style={{ marginBottom: "var(--space-6)" }}>
            <p className="text-label" style={{ marginBottom: "var(--space-3)" }}>
              Quick Actions
            </p>
            <div
              className="flex flex-wrap"
              style={{ gap: "var(--space-3)" }}
            >
              <Button variant="secondary" size="sm" onClick={openAdd}>
                <Plus size={15} aria-hidden="true" />
                Add Fragrance
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCompFormOpen(true)}
              >
                <MessageCircle size={15} aria-hidden="true" />
                Log Compliment
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/import")}
              >
                <Upload size={15} aria-hidden="true" />
                Import File
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/collection")}
              >
                <FlaskConical size={15} aria-hidden="true" />
                Review Collection
              </Button>
            </div>
          </div>

          {/* ── Two-column body ───────────────────────── */}
          <div
            className="grid gap-[var(--space-6)] max-[768px]:grid-cols-1"
            style={{ gridTemplateColumns: "60fr 40fr" }}
          >
            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              {/* Recently Added */}
              <Card padding="0">
                <div style={{ padding: "var(--space-6) var(--space-6) var(--space-4)" }}>
                  <CardHeader>
                    <CardTitle>Recently Added</CardTitle>
                    <Link
                      href="/collection"
                      className="text-secondary hover:text-[var(--color-text-primary)]"
                      style={{ fontSize: "var(--text-sm)", textDecoration: "none", transition: "color var(--transition-fast)" }}
                    >
                      View all
                    </Link>
                  </CardHeader>
                </div>

                {!isLoaded ? (
                  <div style={{ padding: "0 var(--space-6) var(--space-6)" }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-[52px] mb-2" />
                    ))}
                  </div>
                ) : recentlyAdded.length === 0 ? (
                  <EmptyState
                    icon={<FlaskConical size={48} />}
                    title="Nothing added yet"
                    description="Add your first fragrance to get started."
                    action={
                      <Button variant="primary" onClick={openAdd}>
                        Add Fragrance
                      </Button>
                    }
                  />
                ) : (
                  <div>
                    {recentlyAdded.map((frag, i) => (
                      <div key={frag.id}>
                        <button
                          onClick={() => setDetailFrag(frag)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-3)",
                            width: "100%",
                            height: "52px",
                            padding: "0 var(--space-6)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background var(--transition-fast)",
                          }}
                          className="hover:bg-[var(--color-surface-raised)]"
                        >
                          {/* Avatar */}
                          <div
                            aria-hidden="true"
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "var(--radius-full)",
                              background: "var(--color-accent-subtle)",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                              color: "var(--color-accent)",
                            }}
                          >
                            {fragInitials(frag.name)}
                          </div>
                          {/* Name + brand */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              className="text-body"
                              style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {frag.name}
                            </div>
                            <div className="text-secondary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {frag.house}
                            </div>
                          </div>
                          {/* Right: badge + rating */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: "var(--space-1)",
                              flexShrink: 0,
                            }}
                          >
                            <Badge variant={statusBadgeVariant(frag.status)}>
                              {STATUS_LABELS[frag.status]}
                            </Badge>
                            {frag.personalRating !== null && (
                              <span className="text-meta">
                                ★ {parseRating(frag.personalRating)}
                              </span>
                            )}
                          </div>
                        </button>
                        {i < recentlyAdded.length - 1 && <Divider className="my-0" style={{ margin: 0 }} />}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Most Complimented */}
              <Card padding="0">
                <div style={{ padding: "var(--space-6) var(--space-6) var(--space-4)" }}>
                  <CardHeader>
                    <CardTitle>Most Complimented</CardTitle>
                    <Link
                      href="/compliments"
                      className="text-secondary hover:text-[var(--color-text-primary)]"
                      style={{ fontSize: "var(--text-sm)", textDecoration: "none", transition: "color var(--transition-fast)" }}
                    >
                      View all
                    </Link>
                  </CardHeader>
                </div>

                {!isLoaded ? (
                  <div style={{ padding: "0 var(--space-6) var(--space-6)" }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-[52px] mb-2" />
                    ))}
                  </div>
                ) : mostComplimented.length === 0 ? (
                  <EmptyState
                    icon={<MessageCircle size={48} />}
                    title="No compliments yet"
                    description="Log your first compliment to see your most-loved fragrances here."
                  />
                ) : (
                  <div>
                    {mostComplimented.map(({ frag, count }, i) => (
                      <div key={frag.id}>
                        <button
                          onClick={() => setDetailFrag(frag)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-3)",
                            width: "100%",
                            height: "52px",
                            padding: "0 var(--space-6)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background var(--transition-fast)",
                          }}
                          className="hover:bg-[var(--color-surface-raised)]"
                        >
                          <div
                            aria-hidden="true"
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "var(--radius-full)",
                              background: "var(--color-accent-subtle)",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                              color: "var(--color-accent)",
                            }}
                          >
                            {fragInitials(frag.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              className="text-body"
                              style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {frag.name}
                            </div>
                            <div className="text-secondary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {frag.house}
                            </div>
                          </div>
                          <span className="text-meta" style={{ flexShrink: 0 }}>
                            {count} compliment{count !== 1 ? "s" : ""}
                          </span>
                        </button>
                        {i < mostComplimented.length - 1 && <Divider className="my-0" style={{ margin: 0 }} />}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              {/* Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>By Status</CardTitle>
                </CardHeader>
                <CardBody>
                  {!isLoaded ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                      {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-8" />
                      ))}
                    </div>
                  ) : statusCounts.length === 0 ? (
                    <EmptyState
                      icon={<FlaskConical size={48} />}
                      title="No data yet"
                      description="Add fragrances to see your breakdown"
                    />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                      {statusCounts.map(([status, count]) => {
                        const pct = MF.length > 0 ? (count / MF.length) * 100 : 0;
                        return (
                          <div key={status}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                marginBottom: "var(--space-1)",
                              }}
                            >
                              <span className="text-secondary">
                                {STATUS_LABELS[status]}
                              </span>
                              <span className="text-meta">
                                {count} · {Math.round(pct)}%
                              </span>
                            </div>
                            <div
                              style={{
                                height: "6px",
                                borderRadius: "var(--radius-full)",
                                background: "var(--color-accent-subtle)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${pct}%`,
                                  borderRadius: "var(--radius-full)",
                                  background: "var(--color-accent)",
                                  transition: "width 0.4s ease",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Data Quality */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Quality</CardTitle>
                </CardHeader>
                <CardBody>
                  {!isLoaded ? (
                    <Skeleton className="h-[160px]" />
                  ) : MF.length === 0 ? (
                    <p className="text-secondary">Add fragrances to track data completeness.</p>
                  ) : (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          marginBottom: "var(--space-4)",
                        }}
                      >
                        <ProgressRing pct={qualityPct} />
                        <p
                          className="text-secondary"
                          style={{ marginTop: "var(--space-3)", textAlign: "center" }}
                        >
                          {completeCount} of {MF.length}{" "}
                          fragrance{MF.length !== 1 ? "s" : ""} complete
                        </p>
                        {qualityPct >= 100 && (
                          <p
                            style={{
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                              color: "var(--color-success)",
                              marginTop: "var(--space-1)",
                            }}
                          >
                            All complete
                          </p>
                        )}
                      </div>

                      {qualityPct < 100 && incompleteFrags.length > 0 && (
                        <div
                          style={{
                            borderTop: "1px solid var(--color-border)",
                            paddingTop: "var(--space-3)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "var(--space-2)",
                          }}
                        >
                          {incompleteFrags.map((frag) => (
                            <div
                              key={frag.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "var(--space-2)",
                              }}
                            >
                              <span
                                className="text-secondary"
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {frag.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingFrag(frag);
                                  setFormOpen(true);
                                }}
                              >
                                Review
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
