"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, X, FlaskConical, SearchX } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FragForm } from "@/components/ui/frag-form";
import { AddFragranceModal } from "@/components/collection/add-fragrance-modal";
import { FragranceCard } from "@/components/collection/fragrance-card";
import { FragranceDetailModal } from "@/components/collection/fragrance-detail-modal";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import type { UserFragrance, FragranceStatus } from "@/types";

// ── Filter / sort constants ───────────────────────────────

type StatusKey =
  | "all"
  | "collection"
  | "wishlist"
  | "previously_owned"
  | "want_to_smell"
  | "dont_like"
  | "finished"
  | "identify_later";

type SortKey =
  | "name_asc"
  | "name_desc"
  | "rating_desc"
  | "rating_asc"
  | "newest"
  | "oldest"
  | "compliments_desc";

const WISHLIST_STATUSES = new Set<FragranceStatus>([
  "WANT_TO_BUY",
  "WANT_TO_SMELL",
  "WANT_TO_IDENTIFY",
]);

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "collection", label: "Current Collection" },
  { value: "wishlist", label: "Wishlist" },
  { value: "previously_owned", label: "Previously Owned" },
  { value: "want_to_smell", label: "Want to Smell" },
  { value: "dont_like", label: "Don't Like" },
  { value: "finished", label: "Finished" },
  { value: "identify_later", label: "Identify Later" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "rating_desc", label: "Highest Rated" },
  { value: "rating_asc", label: "Lowest Rated" },
  { value: "newest", label: "Recently Added" },
  { value: "oldest", label: "Oldest First" },
  { value: "compliments_desc", label: "Most Complimented" },
];

function applyStatus(frags: UserFragrance[], status: StatusKey): UserFragrance[] {
  switch (status) {
    case "collection":
      return frags.filter((f) => f.status === "CURRENT");
    case "wishlist":
      return frags.filter((f) => WISHLIST_STATUSES.has(f.status));
    case "previously_owned":
      return frags.filter((f) => f.status === "PREVIOUSLY_OWNED");
    case "want_to_smell":
      return frags.filter((f) => f.status === "WANT_TO_SMELL");
    case "dont_like":
      return frags.filter((f) => f.status === "DONT_LIKE");
    case "finished":
      return frags.filter((f) => f.status === "FINISHED");
    case "identify_later":
      return frags.filter((f) => f.status === "WANT_TO_IDENTIFY");
    default:
      return frags;
  }
}

function applySort(
  frags: UserFragrance[],
  sort: SortKey,
  compMap: Record<string, number>,
): UserFragrance[] {
  return [...frags].sort((a, b) => {
    switch (sort) {
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "rating_desc":
        return (b.personalRating ?? 0) - (a.personalRating ?? 0);
      case "rating_asc":
        return (a.personalRating ?? 0) - (b.personalRating ?? 0);
      case "newest":
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      case "oldest":
        return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      case "compliments_desc":
        return (
          (compMap[b.fragranceId ?? b.id] ?? 0) -
          (compMap[a.fragranceId ?? a.id] ?? 0)
        );
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

// ── Card skeleton ─────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
        <div style={{ flex: 1, marginRight: "var(--space-3)" }}>
          <Skeleton className="h-5 w-4/5 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-3)" }}>
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// ── Inner page (uses useSearchParams, must be inside Suspense) ─

function CollectionInner() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded, removeFrag } =
    useData();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = (searchParams.get("status") as StatusKey) || "all";
  const sort = (searchParams.get("sort") as SortKey) || "name_asc";

  const [addOpen, setAddOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFrag, setEditingFrag] = useState<UserFragrance | null>(null);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "name_asc") {
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

  const filtersActive = status !== "all" || sort !== "name_asc";

  if (!user) return null;

  const MF = fragrances.filter((f) => f.userId === user.id);
  const MC = compliments.filter((c) => c.userId === user.id);

  const compMap: Record<string, number> = {};
  MC.forEach((c) => {
    if (c.primaryFragId)
      compMap[c.primaryFragId] = (compMap[c.primaryFragId] ?? 0) + 1;
    if (c.secondaryFragId)
      compMap[c.secondaryFragId] = (compMap[c.secondaryFragId] ?? 0) + 1;
  });

  const filtered = useMemo(
    () => applySort(applyStatus(MF, status), sort, compMap),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fragrances, status, sort, compliments, user.id],
  );

  async function handleDelete(frag: UserFragrance) {
    await removeFrag(frag.id);
    setDetailFrag(null);
    toast("Fragrance removed.");
  }

  function openAdd() {
    setAddOpen(true);
  }

  return (
    <>
      <FragranceDetailModal
        frag={detailFrag}
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        communityFrags={communityFrags}
        compliments={MC}
        userId={user.id}
        onEdit={(frag) => {
          setDetailFrag(null);
          setEditingFrag(frag);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />
      <AddFragranceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
      <FragForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingFrag(null);
        }}
        editing={editingFrag}
      />

      <Topbar title="My Collection" />

      <main style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: "1200px",
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
            <h1 className="text-page-title">My Collection</h1>
            <Button variant="primary" onClick={openAdd}>
              <Plus size={15} aria-hidden="true" />
              Add Fragrance
            </Button>
          </div>

          {/* Filter/sort toolbar */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3) var(--space-4)",
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "var(--space-6)",
            }}
          >
            {/* Left: selects */}
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                flexWrap: "wrap",
                flex: 1,
              }}
            >
              <div style={{ width: "200px" }}>
                <Select
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(v) => setParam("status", v)}
                  placeholder="All Statuses"
                />
              </div>
              <div style={{ width: "180px" }}>
                <Select
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={(v) => setParam("sort", v)}
                  placeholder="Sort by"
                />
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
                  {filtered.length} fragrance{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
              {filtersActive && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X size={13} aria-hidden="true" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {!isLoaded ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "var(--space-4)",
              }}
              className="max-sm:grid-cols-1"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : MF.length === 0 ? (
            <EmptyState
              icon={<FlaskConical size={48} />}
              title="Your collection is empty"
              description="Start tracking your fragrances."
              action={
                <Button variant="primary" onClick={openAdd}>
                  Add Fragrance
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "var(--space-4)",
              }}
              className="max-sm:grid-cols-1"
            >
              {filtered.map((frag) => (
                <FragranceCard
                  key={frag.id}
                  frag={frag}
                  compCount={compMap[frag.fragranceId ?? frag.id] ?? 0}
                  onClick={() => setDetailFrag(frag)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// Wrap in Suspense for useSearchParams
export default function CollectionPage() {
  return (
    <Suspense>
      <CollectionInner />
    </Suspense>
  );
}
