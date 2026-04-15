"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, MessageCircle, SearchX, MapPin } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { LogComplimentModal } from "@/components/compliments/log-compliment-modal";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import type { UserCompliment } from "@/types";

// ── Constants ─────────────────────────────────────────────

const RELATION_OPTIONS = [
  { value: "Significant Other", label: "Partner" },
  { value: "Friend", label: "Friend" },
  { value: "Family", label: "Family" },
  { value: "Colleague / Client", label: "Colleague" },
  { value: "Stranger", label: "Stranger" },
  { value: "Other", label: "Other" },
];

// ── Helpers ────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(createdAt: string, month: string, year: string): string {
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
  }
  const mn = parseInt(month, 10);
  const mLabel = mn >= 1 && mn <= 12 ? MONTH_NAMES[mn - 1] : month;
  return year ? `${mLabel} ${year}` : mLabel;
}

function compSortKey(c: UserCompliment): number {
  if (c.createdAt) return -new Date(c.createdAt).getTime();
  return -(parseInt(c.year || "0") * 100 + parseInt(c.month || "0"));
}

// convert YYYY-MM-DD to a ym number for range comparisons
function toYM(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

function compYM(c: UserCompliment): number {
  return parseInt(c.year || "0") * 100 + parseInt(c.month || "0");
}

// ── Card skeleton ─────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      style={{
        height: 96,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        display: "flex",
        gap: "var(--space-4)",
      }}
    >
      <div style={{ flex: 1 }}>
        <Skeleton className="h-5 w-3/5 mb-2" />
        <Skeleton className="h-4 w-2/5" />
      </div>
      <div style={{ flexShrink: 0, width: 120 }}>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-5 w-16 ml-auto" />
      </div>
    </div>
  );
}

// ── Compliment row card ────────────────────────────────────

interface ComplimentCardProps {
  comp: UserCompliment;
  fragName: string;
  fragHouse: string;
}

function ComplimentCard({ comp, fragName, fragHouse }: ComplimentCardProps) {
  const locationStr = [comp.city, comp.country].filter(Boolean).join(", ") || comp.location;

  return (
    <Card padding="var(--space-5)">
      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          alignItems: "flex-start",
        }}
      >
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="text-subheading"
            style={{ fontWeight: 500, marginBottom: 2 }}
          >
            {fragName}
          </div>
          <div
            className="text-secondary"
            style={{ marginBottom: "var(--space-2)" }}
          >
            {fragHouse}
          </div>
          {comp.notes && (
            <div
              className="text-body"
              style={{
                color: "var(--color-text-secondary)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {comp.notes}
            </div>
          )}
        </div>

        {/* Right column */}
        <div
          style={{
            flexShrink: 0,
            minWidth: 160,
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-1)",
            alignItems: "flex-end",
          }}
        >
          <span className="text-meta">
            {formatDate(comp.createdAt, comp.month, comp.year)}
          </span>
          {comp.relation && (
            <Badge variant="neutral">{comp.relation}</Badge>
          )}
          {locationStr && (
            <span
              className="text-meta"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                color: "var(--color-text-muted)",
                justifyContent: "flex-end",
              }}
            >
              <MapPin size={12} aria-hidden="true" style={{ flexShrink: 0 }} />
              {locationStr}
            </span>
          )}
          {comp.secondaryFrag && (
            <span className="text-meta" style={{ fontStyle: "italic" }}>
              layered with {comp.secondaryFrag}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Inner page ─────────────────────────────────────────────

function ComplimentsInner() {
  const { user } = useUser();
  const { compliments, fragrances, isLoaded } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [modalOpen, setModalOpen] = useState(false);

  const fragFilter = searchParams.get("frag") || "";
  const relationFilter = searchParams.get("relation") || "";
  const fromFilter = searchParams.get("from") || "";
  const toFilter = searchParams.get("to") || "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const clearFilters = useCallback(() => {
    router.push(window.location.pathname);
  }, [router]);

  const filtersActive = !!(fragFilter || relationFilter || fromFilter || toFilter);

  if (!user) return null;

  const MC = compliments.filter((c) => c.userId === user.id);
  const MF = fragrances.filter((f) => f.userId === user.id);

  // Build fragrance select options from user's collection
  const fragOptions = MF.map((f) => ({
    value: f.fragranceId || f.id,
    label: f.house ? `${f.name} — ${f.house}` : f.name,
  }));

  // Build lookup map: fragId -> frag
  const fragMap = new Map(MF.map((f) => [f.fragranceId || f.id, f]));

  function getFragInfo(comp: UserCompliment): { name: string; house: string } {
    const frag = fragMap.get(comp.primaryFragId ?? "");
    return {
      name: frag?.name ?? comp.primaryFrag ?? "-",
      house: frag?.house ?? "",
    };
  }

  const filtered = useMemo(() => {
    let result = [...MC];

    if (fragFilter) {
      result = result.filter((c) => c.primaryFragId === fragFilter);
    }
    if (relationFilter) {
      result = result.filter((c) => c.relation === relationFilter);
    }
    if (fromFilter) {
      const fromYM = toYM(fromFilter);
      result = result.filter((c) => compYM(c) >= fromYM);
    }
    if (toFilter) {
      const toYM2 = toYM(toFilter);
      result = result.filter((c) => compYM(c) <= toYM2);
    }

    return result.sort((a, b) => compSortKey(a) - compSortKey(b));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compliments, fragFilter, relationFilter, fromFilter, toFilter, user.id]);

  return (
    <>
      <LogComplimentModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <Topbar title="Compliments" />

      <main style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "var(--space-8)",
          }}
          className="max-sm:px-[var(--space-4)] max-sm:py-[var(--space-4)]"
        >
          {/* Page header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-6)",
            }}
          >
            <span className="text-page-title">Compliments</span>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus size={15} aria-hidden="true" />
              Log Compliment
            </Button>
          </div>

          {/* Filter toolbar */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3) var(--space-4)",
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              alignItems: "flex-end",
              marginBottom: "var(--space-6)",
            }}
          >
            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                flexWrap: "wrap",
                flex: 1,
                alignItems: "flex-end",
              }}
            >
              <div style={{ width: 220 }}>
                <Select
                  options={fragOptions}
                  value={fragFilter}
                  onChange={(v) => setParam("frag", v)}
                  placeholder="All Fragrances"
                />
              </div>
              <div style={{ width: 160 }}>
                <Select
                  options={RELATION_OPTIONS}
                  value={relationFilter}
                  onChange={(v) => setParam("relation", v)}
                  placeholder="All Relations"
                />
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end" }}>
                <div style={{ width: 140 }}>
                  <Input
                    type="date"
                    value={fromFilter}
                    onChange={(e) => setParam("from", e.target.value)}
                    placeholder="From"
                  />
                </div>
                <div style={{ width: 140 }}>
                  <Input
                    type="date"
                    value={toFilter}
                    onChange={(e) => setParam("to", e.target.value)}
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            {/* Right: count + clear */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                flexShrink: 0,
              }}
            >
              {isLoaded && (
                <span className="text-secondary">
                  {filtered.length} compliment{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
              {filtersActive && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {!isLoaded ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : MC.length === 0 ? (
            <EmptyState
              icon={<MessageCircle size={48} />}
              title="No compliments yet"
              description="Start logging when someone notices your fragrance."
              action={
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  Log First Compliment
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<SearchX size={48} />}
              title="No matches"
              description="Try adjusting your filters."
              action={
                <Button variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {filtered.map((comp) => {
                const { name, house } = getFragInfo(comp);
                return (
                  <ComplimentCard
                    key={comp.id}
                    comp={comp}
                    fragName={name}
                    fragHouse={house}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function ComplimentsPage() {
  return (
    <Suspense>
      <ComplimentsInner />
    </Suspense>
  );
}
