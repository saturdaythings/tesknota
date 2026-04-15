"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Heart } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardFooter } from "@/components/ui/card";
import { AddFragranceModal } from "@/components/collection/add-fragrance-modal";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import type { UserFragrance, CommunityFrag, FragranceStatus } from "@/types";

// ── Constants ─────────────────────────────────────────────

const WISHLIST_STATUSES = new Set<FragranceStatus>([
  "WANT_TO_BUY",
  "WANT_TO_SMELL",
  "WANT_TO_IDENTIFY",
]);

type SortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc" | "newest" | "oldest";

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A\u2013Z" },
  { value: "name_desc", label: "Name Z\u2013A" },
  { value: "price_asc", label: "Avg Price Low\u2013High" },
  { value: "price_desc", label: "Avg Price High\u2013Low" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

// ── Helpers ───────────────────────────────────────────────

function parsePrice(p: string | null): number {
  if (!p) return -1;
  const m = p.match(/\d+/);
  return m ? parseInt(m[0], 10) : -1;
}

function getCF(frag: UserFragrance, communityFrags: CommunityFrag[]): CommunityFrag | null {
  if (frag.fragranceId) {
    const hit = communityFrags.find((c) => c.fragranceId === frag.fragranceId);
    if (hit) return hit;
  }
  const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    communityFrags.find(
      (c) =>
        norm(c.fragranceName) === norm(frag.name) &&
        norm(c.fragranceHouse) === norm(frag.house),
    ) ?? null
  );
}

// ── WishlistCard ──────────────────────────────────────────

interface WishlistCardProps {
  frag: UserFragrance;
  cf: CommunityFrag | null;
  onMoveToCollection: (frag: UserFragrance) => void;
  onRemove: (frag: UserFragrance) => void;
  removing: boolean;
}

function WishlistCard({ frag, cf, onMoveToCollection, onRemove, removing }: WishlistCardProps) {
  const [confirming, setConfirming] = useState(false);

  const avgPrice = cf?.avgPrice ?? "\u2014";
  const type = cf?.fragranceType ?? frag.type ?? "\u2014";
  const profile =
    cf?.fragranceAccords && cf.fragranceAccords.length > 0
      ? cf.fragranceAccords.slice(0, 3).join(", ")
      : "\u2014";

  return (
    <Card padding="var(--space-5)" style={{ opacity: removing ? 0.5 : 1, transition: "opacity 0.15s" }}>
      {/* Top row */}
      <div style={{ marginBottom: "var(--space-3)" }}>
        <div
          className="text-subheading"
          style={{
            fontWeight: 600,
            color: "var(--color-text-primary)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {frag.name}
        </div>
        <div className="text-secondary" style={{ marginTop: 2 }}>
          {frag.house}
        </div>
      </div>

      {/* Middle: label+value pairs */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        {(
          [
            { label: "Avg Price", value: avgPrice },
            { label: "Type", value: type },
            { label: "Fragrance Profile", value: profile },
          ] as const
        ).map(({ label, value }) => (
          <div key={label} style={{ minWidth: 0, flex: "1 1 0" }}>
            <div className="text-label">{label}</div>
            <div className="text-body">{value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <CardFooter className="justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMoveToCollection(frag)}
          disabled={removing}
        >
          <Plus size={13} aria-hidden="true" />
          Add to Collection
        </Button>

        {confirming ? (
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--color-danger,#dc2626)]"
              onClick={() => {
                onRemove(frag);
                setConfirming(false);
              }}
            >
              Remove
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-[var(--color-danger,#dc2626)]"
            onClick={() => setConfirming(true)}
          >
            Remove
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ── Inner page (uses useSearchParams, must be inside Suspense) ─

function WishlistInner() {
  const { user } = useUser();
  const { fragrances, communityFrags, isLoaded, removeFrag, editFrag } = useData();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = (searchParams.get("sort") as SortKey) || "name_asc";
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const setSort = useCallback(
    (v: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (v && v !== "name_asc") {
        params.set("sort", v);
      } else {
        params.delete("sort");
      }
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  if (!user) return null;

  const wishlist = fragrances.filter(
    (f) => f.userId === user.id && WISHLIST_STATUSES.has(f.status),
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cfMap = useMemo(() => {
    const m = new Map<string, CommunityFrag | null>();
    wishlist.forEach((f) => m.set(f.id, getCF(f, communityFrags)));
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrances, communityFrags, user.id]);

  const sorted = useMemo(() => {
    return [...wishlist].sort((a, b) => {
      switch (sort) {
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_asc": {
          const pa = parsePrice(cfMap.get(a.id)?.avgPrice ?? null);
          const pb = parsePrice(cfMap.get(b.id)?.avgPrice ?? null);
          return pa - pb;
        }
        case "price_desc": {
          const pa = parsePrice(cfMap.get(a.id)?.avgPrice ?? null);
          const pb = parsePrice(cfMap.get(b.id)?.avgPrice ?? null);
          return pb - pa;
        }
        case "newest":
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        case "oldest":
          return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        default:
          return a.name.localeCompare(b.name);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrances, sort, cfMap]);

  async function handleMoveToCollection(frag: UserFragrance) {
    setRemoving((prev) => new Set(prev).add(frag.id));
    try {
      await editFrag({ ...frag, status: "CURRENT" });
      toast("Moved to collection");
    } finally {
      setRemoving((prev) => {
        const s = new Set(prev);
        s.delete(frag.id);
        return s;
      });
    }
  }

  async function handleRemove(frag: UserFragrance) {
    setRemoving((prev) => new Set(prev).add(frag.id));
    try {
      await removeFrag(frag.id);
      toast("Fragrance removed.");
    } finally {
      setRemoving((prev) => {
        const s = new Set(prev);
        s.delete(frag.id);
        return s;
      });
    }
  }

  return (
    <>
      <AddFragranceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultStatus="WANT_TO_BUY"
      />

      <Topbar title="Wishlist" />

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
            <h1 className="text-page-title">Wishlist</h1>
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} aria-hidden="true" />
              Add to Wishlist
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
            <div style={{ flex: 1 }}>
              <div style={{ width: "220px" }}>
                <Select
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={setSort}
                  placeholder="Sort by"
                />
              </div>
            </div>
            {isLoaded && (
              <span className="text-secondary" style={{ flexShrink: 0 }}>
                {sorted.length} {sorted.length === 1 ? "fragrance" : "fragrances"}
              </span>
            )}
          </div>

          {/* Content */}
          {wishlist.length === 0 ? (
            <EmptyState
              icon={<Heart size={48} />}
              title="Your wishlist is empty"
              description="Save fragrances you want to explore."
              action={
                <Button variant="primary" onClick={() => setAddOpen(true)}>
                  <Plus size={15} aria-hidden="true" />
                  Add to Wishlist
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
              {sorted.map((frag) => (
                <WishlistCard
                  key={frag.id}
                  frag={frag}
                  cf={cfMap.get(frag.id) ?? null}
                  onMoveToCollection={handleMoveToCollection}
                  onRemove={handleRemove}
                  removing={removing.has(frag.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function WishlistPage() {
  return (
    <Suspense>
      <WishlistInner />
    </Suspense>
  );
}
