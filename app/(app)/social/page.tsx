"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContent } from "@/components/layout/PageContent";
import { FragranceCell } from "@/components/ui/fragrance-cell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabPill } from "@/components/ui/tab-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFilterBar } from "@/components/ui/page-filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { StatBox, StatsGrid } from "@/components/ui/stat-box";
import { AccordCloud } from "@/components/ui/accord-cloud";
import { FragDetail } from "@/components/ui/frag-detail";
import { CompareView } from "@/components/analytics/comparative-view";
import { FlaskConical, MessageCircle, Star, Users } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { searchProfiles, fetchFollows, fetchProfile } from "@/lib/data/index";
import { loadAllData } from "@/lib/data";
import {
  sendFollowRequest,
  updateFollowStatus,
  setFollowStarred,
  createNotification,
} from "@/lib/data/mutations";
import { supabase } from "@/lib/supabase";
import { MONTHS, getAccords, monthNum } from "@/lib/frag-utils";
import type { FragranceStatus } from "@/types";
import { StatusBadge } from "@/components/ui/frag-row";
import {
  applySort,
  SORT_FIELD_OPTIONS,
  RATING_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type SortField,
  type SortDir,
} from "@/lib/collection-utils";
import type { UserFragrance, UserCompliment, CommunityFrag, Follow, Profile } from "@/types";

// ── Shared styles ──────────────────────────────────────────────

const cellStyle = {
  fontSize: "var(--text-xs)",
  letterSpacing: "var(--tracking-md)",
  color: "var(--color-navy)",
} as const;

const metaStyle = {
  fontSize: "var(--text-xs)",
  letterSpacing: "var(--tracking-md)",
  color: "var(--color-meta-text)",
} as const;

const headerCellStyle = {
  padding: "0 var(--space-4)",
  fontSize: "var(--text-xxs)",
  fontWeight: "var(--font-weight-medium)",
  letterSpacing: "var(--tracking-md)",
  color: "var(--color-navy)",
} as const;

const headerRowStyle = {
  display: "grid",
  gridTemplateColumns: "subgrid",
  gridColumn: "1 / -1",
  background: "var(--color-cream-dark)",
  borderBottom: "1px solid var(--color-row-divider)",
  height: "var(--space-10)",
  alignItems: "center",
} as const;

const dataRowStyle = {
  display: "grid",
  gridTemplateColumns: "subgrid",
  gridColumn: "1 / -1",
  alignItems: "center",
  minHeight: "var(--space-16)",
  borderBottom: "1px solid var(--color-row-divider)",
} as const;

const countLabel = {
  fontSize: "var(--text-xs)",
  fontWeight: "var(--font-weight-medium)",
  letterSpacing: "var(--tracking-md)",
  color: "var(--color-meta-text)",
  marginBottom: "var(--space-4)",
} as const;

const COLLECTION_STATUS_OPTIONS = [
  { value: "any", label: "Any status" },
  ...STATUS_FILTER_OPTIONS.filter((o) => o.value !== "all"),
];

const WISHLIST_PRIORITY_OPTIONS = [
  { value: "any", label: "Any priority" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const WISHLIST_STATUS_OPTIONS = [
  { value: "any", label: "Any status" },
  { value: "WANT_TO_BUY", label: "Want to Buy" },
  { value: "WANT_TO_SMELL", label: "Want to Smell" },
  { value: "WANT_TO_IDENTIFY", label: "Identify Later" },
];

const COMP_SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "fragrance", label: "Fragrance" },
];

type FriendTab = "collection" | "compliments" | "wishlist" | "incommon" | "analytics";
const FRIEND_TABS: { label: string; value: FriendTab }[] = [
  { label: "Collection", value: "collection" },
  { label: "Compliments", value: "compliments" },
  { label: "Wishlist", value: "wishlist" },
  { label: "In Common", value: "incommon" },
  { label: "Analytics", value: "analytics" },
];

// ── Avatar helper ──────────────────────────────────────────────

function initials(p: Profile): string {
  const parts = [p.firstName, p.lastName].filter(Boolean);
  if (parts.length) return parts.map((w) => w![0]).join("").toUpperCase();
  return (p.username?.[0] ?? "?").toUpperCase();
}

function Avatar({ profile, size = 32 }: { profile: Profile; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        background: "var(--color-cream-dark)",
        border: "1px solid var(--color-row-divider)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        className="font-sans"
        style={{ fontSize: "var(--text-xs)", color: "var(--color-navy)" }}
      >
        {initials(profile)}
      </span>
    </div>
  );
}

function profileDisplayName(p: Profile): string {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.username || p.email || "Unknown";
}

// ── Main page ──────────────────────────────────────────────────

export default function SocialPage() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded } = useData();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchRowRef = useRef<HTMLDivElement>(null);

  const [sendingFollow, setSendingFollow] = useState(false);

  const [follows, setFollows] = useState<Follow[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, Profile>>({});

  // pending requests (follows where I am the target)
  const pendingIncoming = follows.filter(
    (f) => f.followingId === user?.id && f.status === "pending"
  );

  // accepted follows (people I follow)
  const acceptedFollows = follows.filter(
    (f) => f.followerId === user?.id && f.status === "accepted"
  );
  const starredFollows = acceptedFollows.filter((f) => f.starred);
  const unstarred = acceptedFollows.filter((f) => !f.starred);

  const [selectedFollowId, setSelectedFollowId] = useState<string | null>(null);
  const selectedFollow = acceptedFollows.find((f) => f.id === selectedFollowId) ?? null;
  const selectedFriendProfile = selectedFollow
    ? friendProfiles[selectedFollow.followingId] ?? null
    : null;

  const [friendFrags, setFriendFrags] = useState<UserFragrance[]>([]);
  const [friendComps, setFriendComps] = useState<UserCompliment[]>([]);
  const [friendLoading, setFriendLoading] = useState(false);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [friendTab, setFriendTab] = useState<FriendTab>("collection");

  const loadFollows = useCallback(async () => {
    if (!user) return;
    const all = await fetchFollows(user.id);
    setFollows(all);

    // load profiles for all follows
    const ids = new Set<string>();
    all.forEach((f) => {
      if (f.followerId !== user.id) ids.add(f.followerId);
      if (f.followingId !== user.id) ids.add(f.followingId);
    });
    const profiles: Record<string, Profile> = {};
    await Promise.all(
      Array.from(ids).map(async (id) => {
        const p = await fetchProfile(id);
        if (p) profiles[id] = p;
      })
    );
    setFriendProfiles(profiles);
  }, [user]);

  useEffect(() => { loadFollows(); }, [loadFollows]);

  // Auto-select first friend
  useEffect(() => {
    if (selectedFollowId) return;
    const first = starredFollows[0] ?? unstarred[0] ?? null;
    if (first) setSelectedFollowId(first.id);
  }, [follows]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load friend data when selection changes
  useEffect(() => {
    if (!selectedFollow) return;
    setFriendLoading(true);
    loadAllData(selectedFollow.followingId).then(({ data }) => {
      setFriendFrags(data.fragrances);
      setFriendComps(data.compliments);
      setFriendLoading(false);
    });
  }, [selectedFollow?.followingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Profile search with debounce
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchProfiles(searchQuery, user.id);
      setSearchResults(results);
      setSearchLoading(false);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, user]);

  async function handleSendFollow(targetId: string) {
    if (!user) return;
    setSendingFollow(true);
    try {
      await sendFollowRequest(user.id, targetId);
      await createNotification(
        targetId,
        "follow_request",
        "New follow request",
        `${user.name ?? "Someone"} wants to follow you.`,
        "/social"
      );
      setSearchQuery("");
      setSearchResults([]);
      await loadFollows();
      toast("Follow request sent.", "success");
    } finally {
      setSendingFollow(false);
    }
  }

  async function handleAccept(follow: Follow) {
    await updateFollowStatus(follow.id, "accepted");
    await createNotification(
      follow.followerId,
      "follow_accepted",
      "Follow request accepted",
      "Your follow request was accepted.",
      "/social"
    );
    await loadFollows();
  }

  async function handleDecline(follow: Follow) {
    await updateFollowStatus(follow.id, "declined");
    await loadFollows();
  }

  async function handleStar(follow: Follow) {
    await setFollowStarred(follow.id, !follow.starred);
    await loadFollows();
  }

  async function handleUnfollow(follow: Follow) {
    await updateFollowStatus(follow.id, "archived");
    if (selectedFollowId === follow.id) setSelectedFollowId(null);
    await loadFollows();
  }

  // Already sent a follow request to a profile?
  function followStatus(profileId: string): "none" | "pending" | "accepted" {
    const f = follows.find(
      (f) => f.followerId === user?.id && f.followingId === profileId
    );
    if (!f) return "none";
    if (f.status === "accepted") return "accepted";
    if (f.status === "pending") return "pending";
    return "none";
  }

  const myFrags = fragrances.filter((f) => f.userId === user?.id);
  const myComps = compliments.filter((c) => c.userId === user?.id);

  const FF = friendFrags;
  const FC = friendComps;
  const FFOwned = FF.filter(
    (f) => f.status === "CURRENT" || f.status === "PREVIOUSLY_OWNED" || f.status === "FINISHED"
  );
  const FFWish = FF.filter(
    (f) => f.status === "WANT_TO_BUY" || f.status === "WANT_TO_SMELL"
  );
  const inCommon = useMemo(() => {
    const myCurrentNames = new Set(
      myFrags.filter((f) => f.status === "CURRENT").map((f) => f.name.toLowerCase())
    );
    return FF.filter((f) => f.status === "CURRENT" && myCurrentNames.has(f.name.toLowerCase()));
  }, [FF, myFrags]);

  const friendAccordCounts = useMemo<[string, number][]>(() => {
    const counts: Record<string, number> = {};
    FFOwned.forEach((f) => {
      getAccords(f, communityFrags).forEach((a) => {
        counts[a] = (counts[a] ?? 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [FFOwned, communityFrags]);

  const friendName = selectedFriendProfile
    ? profileDisplayName(selectedFriendProfile)
    : "Friend";

  if (!user) return null;

  return (
    <>
      {detailFrag && selectedFriendProfile && (
        <FragDetail
          open={!!detailFrag}
          onClose={() => setDetailFrag(null)}
          frag={detailFrag}
          communityFrags={communityFrags}
          compliments={FC}
          userId={selectedFriendProfile.id}
          readOnly
        />
      )}

      <Topbar title="Social" />
      <PageContent>

        {/* ── Pending requests ─────────────────────────────── */}
        {pendingIncoming.length > 0 && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <div
              className="font-sans uppercase"
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-navy)",
                letterSpacing: "var(--tracking-wide)",
                marginBottom: "var(--space-3)",
              }}
            >
              Pending requests
            </div>
            {pendingIncoming.map((f) => {
              const requester = friendProfiles[f.followerId];
              return (
                <div
                  key={f.id}
                  className="flex items-center gap-3 flex-wrap"
                  style={{
                    minHeight: "var(--size-row-min)",
                    borderBottom: "1px solid var(--color-row-divider)",
                    padding: "var(--space-2) 0",
                  }}
                >
                  {requester && <Avatar profile={requester} size={32} />}
                  <div className="flex-1 min-w-0">
                    <span className="font-serif italic" style={{ fontSize: "var(--text-note)", color: "var(--color-navy)" }}>
                      {requester ? profileDisplayName(requester) : f.followerId}
                    </span>
                    {f.requestMessage && (
                      <p className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                        {f.requestMessage}
                      </p>
                    )}
                  </div>
                  <Button variant="primary" onClick={() => handleAccept(f)}>Accept</Button>
                  <Button variant="ghost" onClick={() => handleDecline(f)}>Decline</Button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Profile search ───────────────────────────────── */}
        <div style={{ marginBottom: "var(--space-6)" }}>
          <div ref={searchRowRef} className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <div className="flex-1" style={{ position: "relative" }}>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or name..."
              />
              {searchLoading && (
                <div
                  className="font-sans"
                  style={{
                    position: "absolute",
                    right: "var(--space-3)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-meta-text)",
                  }}
                >
                  Searching...
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={() => searchRowRef.current?.querySelector('input')?.focus()}
            >
              + Add Friend
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div
              style={{
                background: "var(--color-cream)",
                border: "1px solid var(--color-row-divider)",
                marginTop: "var(--space-1)",
              }}
            >
              {searchResults.map((p) => {
                const status = followStatus(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3"
                    style={{
                      minHeight: "var(--size-row-min)",
                      borderBottom: "1px solid var(--color-row-divider)",
                      padding: "0 var(--space-3)",
                    }}
                  >
                    <Avatar profile={p} size={32} />
                    <span
                      className="font-serif italic flex-1 min-w-0 truncate"
                      style={{ fontSize: "var(--text-note)", color: "var(--color-navy)" }}
                    >
                      {profileDisplayName(p)}
                    </span>
                    {p.username && (
                      <span
                        className="font-sans"
                        style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)", flexShrink: 0 }}
                      >
                        @{p.username}
                      </span>
                    )}
                    {status === "none" && (
                      <Button
                        variant="secondary"
                        disabled={sendingFollow}
                        onClick={() => handleSendFollow(p.id)}
                      >
                        Follow
                      </Button>
                    )}
                    {status === "pending" && (
                      <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)", flexShrink: 0 }}>
                        Requested
                      </span>
                    )}
                    {status === "accepted" && (
                      <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)", flexShrink: 0 }}>
                        Following
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Friends list + friend view ───────────────────── */}
        {acceptedFollows.length === 0 ? (
          <EmptyState icon={<Users size={48} />} title="No friends yet — search above to connect" />
        ) : (
          <>
            {/* Friend selector */}
            <div style={{ marginBottom: "var(--space-4)" }}>
              <div
                className="font-sans uppercase"
                style={{
                  fontSize: "var(--text-label)",
                  letterSpacing: "var(--tracking-wide)",
                  color: "var(--color-meta-text)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Viewing
              </div>
              <div className="flex flex-wrap gap-2">
                {[...starredFollows, ...unstarred].map((f, i) => {
                  const p = friendProfiles[f.followingId];
                  const name = p ? profileDisplayName(p) : f.followingId;
                  const isSelected = selectedFollowId === f.id;
                  const divider = i === starredFollows.length && unstarred.length > 0 && starredFollows.length > 0;
                  return (
                    <div key={f.id} className="flex items-center gap-1">
                      {divider && (
                        <div style={{ width: "1px", height: "20px", background: "var(--color-row-divider)", margin: "0 var(--space-1)" }} />
                      )}
                      <Button
                        variant="tab-action"
                        active={isSelected}
                        onClick={() => setSelectedFollowId(f.id)}
                        style={{ borderRadius: "var(--radius-full)", whiteSpace: "nowrap" }}
                      >
                        {f.starred && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)" }}>★</span>}
                        {name}
                      </Button>
                      <Button
                        variant="icon"
                        onClick={() => handleStar(f)}
                        aria-label={f.starred ? "Unstar" : "Star"}
                        title={f.starred ? "Unstar" : "Star"}
                        style={{ color: f.starred ? "var(--color-accent)" : "var(--color-meta-text)" }}
                      >
                        {f.starred ? "★" : "☆"}
                      </Button>
                      <Button variant="destructive" onClick={() => handleUnfollow(f)}>
                        Unfollow
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Friend profile view */}
            {selectedFriendProfile && (
              <>
                {/* Header */}
                <div style={{ marginBottom: "var(--space-6)" }}>
                  <div className="font-serif italic" style={{ fontSize: "var(--text-lg)", color: "var(--color-navy)", lineHeight: 1.2 }}>
                    {friendName}
                  </div>
                  {selectedFriendProfile.username && (
                    <div className="font-sans" style={{ fontSize: "var(--text-sm)", color: "var(--color-meta-text)" }}>
                      @{selectedFriendProfile.username}
                    </div>
                  )}
                </div>

                {friendLoading ? (
                  <div>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          height: "var(--size-row-min)",
                          borderBottom: "1px solid var(--color-row-divider)",
                          background: "var(--color-row-hover)",
                          borderRadius: "var(--radius-md)",
                          marginBottom: "var(--space-1)",
                        }}
                      />
                    ))}
                  </div>
                ) : !selectedFriendProfile.showCollection && friendTab === "collection" ? (
                  <>
                    <div className="flex flex-wrap gap-2" style={{ marginBottom: "var(--space-6)" }}>
                      {FRIEND_TABS.map((t) => (
                        <TabPill key={t.value} label={t.label} variant="selector" active={friendTab === t.value} onClick={() => setFriendTab(t.value)} />
                      ))}
                    </div>
                    <EmptyState icon={<FlaskConical size={48} />} title="This collection is private" />
                  </>
                ) : (
                  <>
                    <StatsGrid className="mb-6">
                      <StatBox value={FFOwned.length} label="Collection" />
                      <StatBox value={FC.length} label="Compliments" />
                      <StatBox value={FFWish.length} label="Wishlist" />
                      <StatBox value={inCommon.length} label="In Common" />
                    </StatsGrid>

                    {friendAccordCounts.length > 0 && (
                      <div style={{ marginBottom: "var(--space-6)" }}>
                        <div className="font-sans uppercase" style={countLabel}>
                          Scent Signature — {friendName}&apos;s Accords
                        </div>
                        <AccordCloud accords={friendAccordCounts} />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2" style={{ marginBottom: "var(--space-6)" }}>
                      {FRIEND_TABS.map((t) => (
                        <TabPill key={t.value} label={t.label} variant="selector" active={friendTab === t.value} onClick={() => setFriendTab(t.value)} />
                      ))}
                    </div>

                    {friendTab === "collection" && (
                      <CollectionTab
                        frags={FFOwned}
                        compliments={FC}
                        communityFrags={communityFrags}
                        onFragClick={setDetailFrag}
                      />
                    )}
                    {friendTab === "compliments" && (
                      <ComplimentsTab compliments={FC} frags={FF} />
                    )}
                    {friendTab === "wishlist" && (
                      <WishlistTab frags={FFWish} communityFrags={communityFrags} />
                    )}
                    {friendTab === "incommon" && (
                      <InCommonTab
                        frags={inCommon}
                        myFrags={myFrags}
                        compliments={[...compliments, ...FC]}
                        communityFrags={communityFrags}
                        userId={user.id}
                        friendId={selectedFriendProfile.id}
                        friendName={friendName}
                      />
                    )}
                    {friendTab === "analytics" && (
                      <CompareView
                        myFrags={myFrags}
                        myComps={myComps}
                        friendFrags={FF}
                        friendComps={FC}
                        myName={user.name ?? "Me"}
                        friendName={friendName}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </PageContent>
    </>
  );
}

// ── Collection tab ─────────────────────────────────────────────

function CollectionTab({
  frags,
  compliments,
  communityFrags,
  onFragClick,
}: {
  frags: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  onFragClick: (f: UserFragrance) => void;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("fragrance");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [accordFilter, setAccordFilter] = useState("any");
  const [ratingFilter, setRatingFilter] = useState("any");
  const [statusFilter, setStatusFilter] = useState("any");

  const compMap = useMemo(() => {
    const map: Record<string, number> = {};
    compliments.forEach((c) => {
      if (c.primaryFragId) map[c.primaryFragId] = (map[c.primaryFragId] ?? 0) + 1;
    });
    return map;
  }, [compliments]);

  const accordOptions = useMemo(() => {
    const s = new Set<string>();
    frags.forEach((f) => getAccords(f, communityFrags).forEach((a) => s.add(a)));
    return [{ value: "any", label: "Any accord" }, ...Array.from(s).sort().map((a) => ({ value: a, label: a }))];
  }, [frags, communityFrags]);

  const filtered = useMemo(() => {
    let list = frags;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q));
    }
    if (accordFilter !== "any") list = list.filter((f) => getAccords(f, communityFrags).includes(accordFilter));
    if (ratingFilter !== "any") {
      list = list.filter((f) => {
        const r = f.personalRating ?? 0;
        if (ratingFilter === "5") return r === 5;
        if (ratingFilter === "4plus") return r >= 4;
        if (ratingFilter === "3plus") return r >= 3;
        if (ratingFilter === "1to2") return r >= 1 && r <= 2;
        if (ratingFilter === "unrated") return !r;
        return true;
      });
    }
    if (statusFilter !== "any") list = list.filter((f) => f.status === statusFilter);
    return applySort(list, sortField, sortDir, compMap);
  }, [frags, search, accordFilter, ratingFilter, statusFilter, sortField, sortDir, compMap, communityFrags]);

  const filtersActive = accordFilter !== "any" || ratingFilter !== "any" || statusFilter !== "any";
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageFrags = filtered.slice((page - 1) * perPage, page * perPage);
  const gridCols = "minmax(200px,1fr) max-content max-content 180px max-content";

  if (frags.length === 0) return <EmptyState icon={<FlaskConical size={48} />} title="No fragrances" />;

  return (
    <>
      <PageFilterBar
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search collection..."
        sortFields={SORT_FIELD_OPTIONS}
        sortField={sortField}
        onSortField={(v) => { setSortField(v as SortField); setPage(1); }}
        sortDir={sortDir}
        onSortDir={() => { setSortDir((d) => d === "asc" ? "desc" : "asc"); setPage(1); }}
        filters={[
          { value: accordFilter, onChange: (v) => { setAccordFilter(v); setPage(1); }, options: accordOptions },
          { value: ratingFilter, onChange: (v) => { setRatingFilter(v); setPage(1); }, options: RATING_FILTER_OPTIONS },
          { value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1); }, options: COLLECTION_STATUS_OPTIONS },
        ]}
        filtersActive={filtersActive}
        onClearFilters={() => { setAccordFilter("any"); setRatingFilter("any"); setStatusFilter("any"); }}
        perPage={perPage}
        onPerPage={(v) => { setPerPage(v); setPage(1); }}
        count={filtered.length}
        countLabel="Fragrance"
        isLoaded
      />
      <div className="hidden md:grid" style={{ gridTemplateColumns: gridCols, columnGap: "var(--space-10)" }}>
        <div style={headerRowStyle}>
          {["Fragrance", "Rating", "Status", "Accords", "Compliments"].map((l) => (
            <div key={l} className="font-sans uppercase" style={headerCellStyle}>{l}</div>
          ))}
        </div>
        {pageFrags.map((f) => {
          const comps = compliments.filter((c) => c.primaryFragId === (f.fragranceId || f.id)).length;
          const accords = getAccords(f, communityFrags).slice(0, 4).join(", ") || "—";
          return (
            <div
              key={f.id}
              onClick={() => onFragClick(f)}
              className="cursor-pointer transition-colors duration-100"
              style={dataRowStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-row-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ padding: "0 var(--space-4)", minWidth: 0 }}>
                <FragranceCell name={f.name} house={f.house} type={f.type ?? null} isDupe={f.isDupe} dupeFor={f.dupeFor || undefined} />
              </div>
              <div style={{ padding: "0 var(--space-4)" }}>
                <span className="font-sans uppercase" style={cellStyle}>{f.personalRating ? "★".repeat(f.personalRating) : "—"}</span>
              </div>
              <div style={{ padding: "0 var(--space-4)" }}>
                <StatusBadge status={f.status as FragranceStatus} />
              </div>
              <div style={{ padding: "0 var(--space-4)", minWidth: 0 }}>
                <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-navy)", lineHeight: "var(--leading-relaxed)" }}>{accords}</span>
              </div>
              <div style={{ padding: "0 var(--space-4)" }}>
                <span className="font-sans uppercase" style={{ ...cellStyle, color: comps > 0 ? "var(--color-navy)" : "var(--color-meta-text)" }}>{comps > 0 ? comps : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="md:hidden">
        {pageFrags.map((f) => {
          const comps = compliments.filter((c) => c.primaryFragId === (f.fragranceId || f.id)).length;
          const accords = getAccords(f, communityFrags).slice(0, 3).join(", ");
          return (
            <div
              key={f.id}
              onClick={() => onFragClick(f)}
              className="cursor-pointer"
              style={{ padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--color-row-divider)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-row-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <FragranceCell name={f.name} house={f.house} type={f.type ?? null} isDupe={f.isDupe} dupeFor={f.dupeFor || undefined} />
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {f.personalRating ? <span className="font-sans uppercase" style={metaStyle}>{"★".repeat(f.personalRating)}</span> : null}
                <StatusBadge status={f.status as FragranceStatus} />
                {comps > 0 ? <span className="font-sans uppercase" style={{ ...metaStyle, color: "var(--color-accent)" }}>{comps} comp{comps !== 1 ? "s" : ""}</span> : null}
                {accords ? <span className="font-sans" style={metaStyle}>{accords}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </>
  );
}

// ── Compliments tab ────────────────────────────────────────────

function ComplimentsTab({ compliments, frags }: { compliments: UserCompliment[]; frags: UserFragrance[] }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let list = compliments;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => {
        const frag = frags.find((f) => (f.fragranceId || f.id) === c.primaryFragId);
        const name = frag?.name ?? c.primaryFrag ?? "";
        return name.toLowerCase().includes(q) || (c.notes ?? "").toLowerCase().includes(q);
      });
    }
    return list.slice().sort((a, b) => {
      if (sortField === "date") {
        const aVal = parseInt(a.year) * 100 + monthNum(a.month);
        const bVal = parseInt(b.year) * 100 + monthNum(b.month);
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
      }
      const aFrag = frags.find((f) => (f.fragranceId || f.id) === a.primaryFragId);
      const bFrag = frags.find((f) => (f.fragranceId || f.id) === b.primaryFragId);
      const aName = aFrag?.name ?? a.primaryFrag ?? "";
      const bName = bFrag?.name ?? b.primaryFrag ?? "";
      const cmp = aName.localeCompare(bName);
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [compliments, frags, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);
  const gridCols = "minmax(180px,1fr) max-content max-content max-content";

  if (compliments.length === 0) return <EmptyState icon={<MessageCircle size={48} />} title="No compliments yet" />;

  return (
    <>
      <PageFilterBar
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search compliments..."
        sortFields={COMP_SORT_OPTIONS}
        sortField={sortField}
        onSortField={(v) => { setSortField(v); setPage(1); }}
        sortDir={sortDir}
        onSortDir={() => { setSortDir((d) => d === "asc" ? "desc" : "asc"); setPage(1); }}
        filtersActive={false}
        perPage={perPage}
        onPerPage={(v) => { setPerPage(v); setPage(1); }}
        count={filtered.length}
        countLabel="Compliment"
        isLoaded
      />
      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: "var(--space-10)" }}>
        <div style={headerRowStyle}>
          {["Fragrance", "Relation", "When", "Location"].map((l) => (
            <div key={l} className="font-sans uppercase" style={headerCellStyle}>{l}</div>
          ))}
        </div>
        {pageItems.map((c) => {
          const frag = frags.find((f) => (f.fragranceId || f.id) === c.primaryFragId);
          const fragName = frag?.name ?? c.primaryFrag ?? "—";
          const fragHouse = frag?.house ?? "";
          const mn = monthNum(c.month);
          const mLabel = mn >= 1 && mn <= 12 ? MONTHS[mn - 1] : c.month;
          const when = c.year ? `${mLabel} ${c.year}` : mLabel;
          const location = [c.city, c.country].filter(Boolean).join(", ") || "—";
          return (
            <div key={c.id} style={dataRowStyle}>
              <div style={{ padding: "0 var(--space-4)", minWidth: 0 }}>
                <FragranceCell name={fragName} house={fragHouse || undefined} />
              </div>
              <div style={{ padding: "0 var(--space-4)" }}>
                <span className="font-sans uppercase" style={cellStyle}>{c.relation}</span>
              </div>
              <div style={{ padding: "0 var(--space-4)" }}>
                <span className="font-sans uppercase" style={cellStyle}>{when}</span>
              </div>
              <div style={{ padding: "0 var(--space-4)" }}>
                <span className="font-sans uppercase" style={cellStyle}>{location}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </>
  );
}

// ── Wishlist tab ───────────────────────────────────────────────

const WISHLIST_SORT_OPTIONS = [
  { value: "fragrance", label: "Fragrance" },
  { value: "date_added", label: "Date Added" },
];

function WishlistTab({ frags, communityFrags }: { frags: UserFragrance[]; communityFrags: CommunityFrag[] }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("fragrance");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [priorityFilter, setPriorityFilter] = useState("any");
  const [statusFilter, setStatusFilter] = useState("any");

  const filtered = useMemo(() => {
    let list = frags;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q));
    }
    if (statusFilter !== "any") list = list.filter((f) => f.status === statusFilter);
    if (priorityFilter !== "any") list = list.filter((f) => f.wishlistPriority === priorityFilter);
    return list.slice().sort((a, b) => {
      let cmp = 0;
      if (sortField === "fragrance") cmp = a.name.localeCompare(b.name);
      else if (sortField === "date_added") cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [frags, search, priorityFilter, statusFilter, sortField, sortDir]);

  const filtersActive = statusFilter !== "any" || priorityFilter !== "any";
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageFrags = filtered.slice((page - 1) * perPage, page * perPage);
  const gridCols = "minmax(200px,1fr) max-content 180px";

  if (frags.length === 0) return <EmptyState icon={<Star size={48} />} title="No wishlist items" />;

  return (
    <>
      <PageFilterBar
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search wishlist..."
        sortFields={WISHLIST_SORT_OPTIONS}
        sortField={sortField}
        onSortField={(v) => { setSortField(v); setPage(1); }}
        sortDir={sortDir}
        onSortDir={() => { setSortDir((d) => d === "asc" ? "desc" : "asc"); setPage(1); }}
        filters={[
          { value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1); }, options: WISHLIST_STATUS_OPTIONS },
          { value: priorityFilter, onChange: (v) => { setPriorityFilter(v); setPage(1); }, options: WISHLIST_PRIORITY_OPTIONS },
        ]}
        filtersActive={filtersActive}
        onClearFilters={() => { setStatusFilter("any"); setPriorityFilter("any"); }}
        perPage={perPage}
        onPerPage={(v) => { setPerPage(v); setPage(1); }}
        count={filtered.length}
        countLabel="Item"
        isLoaded
      />
      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: "var(--space-10)" }}>
        <div style={headerRowStyle}>
          {["Fragrance", "Avg Price", "Accords"].map((l) => (
            <div key={l} className="font-sans uppercase" style={headerCellStyle}>{l}</div>
          ))}
        </div>
        {pageFrags.map((f) => {
          const accords = getAccords(f, communityFrags).slice(0, 3).join(", ") || "—";
          const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const cf = communityFrags.find((c) => norm(c.fragranceName) === norm(f.name) && norm(c.fragranceHouse) === norm(f.house));
          const price = (cf?.avgPrice ?? "").replace(/~/g, "") || "—";
          return (
            <div key={f.id} style={dataRowStyle}>
              <div style={{ padding: "0 var(--space-4)", minWidth: 0 }}>
                <FragranceCell name={f.name} house={f.house} type={f.type ?? null} isDupe={f.isDupe} dupeFor={f.dupeFor || undefined} />
              </div>
              <div style={{ padding: "0 var(--space-4)" }}>
                <span className="font-sans uppercase" style={cellStyle}>{price}</span>
              </div>
              <div style={{ padding: "0 var(--space-4)", minWidth: 0 }}>
                <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-navy)", lineHeight: "var(--leading-relaxed)" }}>{accords}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </>
  );
}

// ── In Common tab ──────────────────────────────────────────────

function InCommonTab({
  frags, myFrags, compliments, communityFrags, userId, friendId, friendName,
}: {
  frags: UserFragrance[];
  myFrags: UserFragrance[];
  compliments: UserCompliment[];
  communityFrags: CommunityFrag[];
  userId: string;
  friendId: string;
  friendName: string;
}) {
  const [page, setPage] = useState(1);
  const sorted = frags.slice().sort((a, b) => a.name.localeCompare(b.name));
  const totalPages = Math.max(1, Math.ceil(sorted.length / 25));
  const pageFrags = sorted.slice((page - 1) * 25, page * 25);
  const gridCols = "minmax(200px,1fr) 180px max-content";

  if (sorted.length === 0) return <EmptyState icon={<Users size={48} />} title="No fragrances in common yet" />;

  return (
    <>
      <div className="font-sans uppercase" style={countLabel}>
        Both own {sorted.length} {sorted.length === 1 ? "fragrance" : "fragrances"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: "var(--space-10)" }}>
        <div style={headerRowStyle}>
          {["Fragrance", "Accords", "Compliments"].map((l) => (
            <div key={l} className="font-sans uppercase" style={headerCellStyle}>{l}</div>
          ))}
        </div>
        {pageFrags.map((f) => {
          const myFrag = myFrags.find((mf) => mf.name.toLowerCase() === f.name.toLowerCase());
          const accords = getAccords(f, communityFrags).slice(0, 3).join(", ") || "—";
          const myC = compliments.filter((c) => c.userId === userId && c.primaryFragId === (myFrag?.fragranceId || myFrag?.id)).length;
          const friendC = compliments.filter((c) => c.userId === friendId && c.primaryFragId === (f.fragranceId || f.id)).length;
          const parts: string[] = [];
          if (myC > 0) parts.push(`You: ${myC}`);
          if (friendC > 0) parts.push(`${friendName}: ${friendC}`);
          return (
            <div key={f.id} style={dataRowStyle}>
              <div style={{ padding: "0 var(--space-4)", minWidth: 0 }}>
                <FragranceCell name={f.name} house={f.house} type={f.type ?? null} isDupe={f.isDupe} dupeFor={f.dupeFor || undefined} />
              </div>
              <div style={{ padding: "0 var(--space-4)", minWidth: 0 }}>
                <span className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-navy)", lineHeight: "var(--leading-relaxed)" }}>{accords}</span>
              </div>
              <div style={{ padding: "0 var(--space-4)" }}>
                <span className="font-sans uppercase" style={{ ...cellStyle, color: (myC > 0 || friendC > 0) ? "var(--color-accent)" : "var(--color-meta-text)" }}>
                  {parts.join(" · ") || "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </>
  );
}
