"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import { PageContent } from "@/components/layout/PageContent";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TabPill } from "@/components/ui/tab-pill";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { fetchProfile, fetchDiscountCodes } from "@/lib/data/index";
import { upsertProfile, addDiscountCode, deleteDiscountCode } from "@/lib/data/mutations";
import { getCompCount } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import type { Profile, DiscountCode } from "@/types";

// ── Toggle ─────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "var(--radius-full)",
        background: checked ? "var(--color-navy)" : "var(--color-row-divider)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 150ms",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "23px" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-cream)",
          transition: "left 150ms",
        }}
      />
    </button>
  );
}

// ── Section heading ────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: "var(--space-3)" }}>
      <div
        className="font-sans uppercase"
        style={{ fontSize: "var(--text-sm)", color: "var(--color-navy)", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-2)" }}
      >
        {title}
      </div>
      <div style={{ height: "1px", background: "var(--color-row-divider)" }} />
    </div>
  );
}

// ── CSV export ─────────────────────────────────────────────────

function esc(v: unknown): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// ── Main ───────────────────────────────────────────────────────

const TABS = ["Personal Info", "Social & Codes", "Privacy", "Data"] as const;
type Tab = typeof TABS[number];

export default function ProfilePage() {
  const { user, signOut } = useUser();
  const { fragrances, compliments } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "true";

  const [tab, setTab] = useState<Tab>("Personal Info");
  const [showOnboarding, setShowOnboarding] = useState(onboarding);

  // Profile data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [friendCount, setFriendCount] = useState(0);

  // Personal Info fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [showPwFields, setShowPwFields] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalErr, setPersonalErr] = useState("");

  // Social & Codes
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [socialSaving, setSocialSaving] = useState(false);

  // Privacy
  const [showCollection, setShowCollection] = useState(true);
  const [showFollowers, setShowFollowers] = useState(true);
  const [showFollowing, setShowFollowing] = useState(true);
  const [showSocialHandles, setShowSocialHandles] = useState(true);
  const [showDiscountCodes, setShowDiscountCodes] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [privacySaving, setPrivacySaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [p, dc] = await Promise.all([
      fetchProfile(user.id),
      fetchDiscountCodes(user.id),
    ]);
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id)
      .eq("status", "accepted");
    setFriendCount(count ?? 0);
    if (p) {
      setProfile(p);
      setFirstName(p.firstName ?? "");
      setLastName(p.lastName ?? "");
      setUsername(p.username ?? "");
      setEmail(p.email ?? "");
      setCity(p.city ?? "");
      setState(p.state ?? "");
      setCountry(p.country ?? "");
      setInstagram(p.instagramHandle ?? "");
      setTiktok(p.tiktokHandle ?? "");
      setYoutube(p.youtubeHandle ?? "");
      setShowCollection(p.showCollection);
      setShowFollowers(p.showFollowers);
      setShowFollowing(p.showFollowing);
      setShowSocialHandles(p.showSocialHandles);
      setShowDiscountCodes(p.showDiscountCodes);
    }
    setCodes(dc);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const myFrags = fragrances.filter((f) => f.userId === user?.id);
  const myComps = compliments.filter((c) => c.userId === user?.id);
  const collectionCount = myFrags.filter((f) => f.status === "CURRENT").length;
  const wishlistCount = myFrags.filter((f) => f.status === "WANT_TO_BUY" || f.status === "WANT_TO_SMELL").length;

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || user?.name || "";
  const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  async function savePersonal() {
    if (!user || !profile) return;
    setPersonalErr("");
    setPersonalSaving(true);
    try {
      if (showPwFields) {
        if (newPassword !== confirmPassword) { setPersonalErr("Passwords do not match."); return; }
        if (newPassword) {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw new Error(error.message);
        }
      }
      await upsertProfile({
        ...profile,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        username: username.trim() || null,
        email: email.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: country.trim() || null,
      });
      setShowPwFields(false);
      setNewPassword("");
      setConfirmPassword("");
      await load();
    } catch (e) {
      setPersonalErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setPersonalSaving(false);
    }
  }

  async function saveSocial() {
    if (!user || !profile) return;
    setSocialSaving(true);
    try {
      await upsertProfile({
        ...profile,
        instagramHandle: instagram.trim() || null,
        tiktokHandle: tiktok.trim() || null,
        youtubeHandle: youtube.trim() || null,
      });
      await load();
    } finally {
      setSocialSaving(false);
    }
  }

  async function handleAddCode() {
    if (!user || !newCode.trim()) return;
    await addDiscountCode({
      id: "",
      userId: user.id,
      place: newPlace.trim() || null,
      code: newCode.trim(),
      notes: newNotes.trim() || null,
      createdAt: "",
    });
    setNewPlace("");
    setNewCode("");
    setNewNotes("");
    await load();
  }

  async function handleRemoveCode(id: string) {
    await deleteDiscountCode(id);
    await load();
  }

  async function savePrivacy() {
    if (!user || !profile) return;
    setPrivacySaving(true);
    try {
      await upsertProfile({
        ...profile,
        showCollection,
        showFollowers,
        showFollowing,
        showSocialHandles,
        showDiscountCodes,
      });
      await load();
    } finally {
      setPrivacySaving(false);
    }
  }

  function exportCSV() {
    const fragRows = [
      ["Name", "House", "Status", "Personal Rating", "Compliments"],
      ...myFrags.map((f) => [
        esc(f.name), esc(f.house), STATUS_LABELS[f.status],
        String(f.personalRating ?? ""), String(getCompCount(f.fragranceId || f.id, myComps)),
      ]),
    ];
    const compRows: string[][] = [
      [],
      ["Fragrance", "Secondary", "Relation", "Gender", "Month", "Year", "Location", "Notes"],
      ...myComps.map((c) => [
        esc(c.primaryFrag), esc(c.secondaryFrag ?? ""), c.relation ?? "",
        c.gender ?? "", c.month ?? "", c.year ?? "", esc(c.location ?? ""), esc(c.notes ?? ""),
      ]),
    ];
    const csv = [...fragRows, ...compRows].map((r) => r.join(",")).join("\n");
    const name = user?.name?.toLowerCase() ?? "export";
    const date = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "tesknota-export-" + name + "-" + date + ".csv";
    a.click();
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--color-cream-dark)",
    border: "1px solid var(--color-row-divider)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-6)",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-sm)",
    color: "var(--color-navy)",
    display: "block",
    marginBottom: "var(--space-1)",
  };

  const privacyRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "var(--size-row-min)",
    borderBottom: "1px solid var(--color-row-divider)",
  };

  return (
    <>
      <Topbar title="Profile" />
      <PageContent>
        <div
          className="flex gap-[var(--space-8)]"
          style={{ alignItems: "flex-start" }}
        >
          {/* LEFT COLUMN */}
          <div className="hidden md:flex flex-col gap-[var(--space-4)]" style={{ width: "280px", flexShrink: 0 }}>

            {/* Identity card */}
            <div style={cardStyle}>
              {/* Avatar */}
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-navy)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "var(--space-3)",
                }}
              >
                <span className="font-serif italic" style={{ fontSize: "var(--text-lg)", color: "var(--color-cream)" }}>
                  {initials}
                </span>
              </div>

              {/* Name */}
              <div className="font-serif italic" style={{ fontSize: "var(--text-lg)", color: "var(--color-navy)", marginBottom: "var(--space-1)" }}>
                {fullName || "\u2014"}
              </div>

              {/* Username */}
              {profile?.username && (
                <div className="font-sans" style={{ fontSize: "var(--text-sm)", color: "var(--color-meta-text)", marginBottom: "var(--space-1)" }}>
                  @{profile.username}
                </div>
              )}

              {/* Location */}
              {(profile?.city || profile?.state || profile?.country) && (
                <div className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)", marginBottom: "var(--space-3)" }}>
                  {[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}
                </div>
              )}

              {/* Social handles */}
              {(profile?.instagramHandle || profile?.tiktokHandle || profile?.youtubeHandle) && (
                <div className="flex flex-wrap gap-1 mb-[var(--space-3)]">
                  {profile.instagramHandle && (
                    <Button variant="ghost">@{profile.instagramHandle}</Button>
                  )}
                  {profile.tiktokHandle && (
                    <Button variant="ghost">@{profile.tiktokHandle}</Button>
                  )}
                  {profile.youtubeHandle && (
                    <Button variant="ghost">@{profile.youtubeHandle}</Button>
                  )}
                </div>
              )}

              <Button variant="primary" className="w-full" onClick={() => setTab("Personal Info")}>
                Edit Profile
              </Button>
            </div>

            {/* Stats 2x2 grid */}
            <div className="grid grid-cols-2 gap-[var(--space-3)]">
              {[
                { label: "Collection", value: collectionCount },
                { label: "Compliments", value: myComps.length },
                { label: "Wishlist", value: wishlistCount },
                { label: "Friends", value: friendCount },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--color-cream-dark)",
                    border: "1px solid var(--color-row-divider)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4)",
                  }}
                >
                  <div
                    className="font-sans uppercase"
                    style={{ fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", color: "var(--color-meta-text)", marginBottom: "var(--space-1)" }}
                  >
                    {label}
                  </div>
                  <div className="font-serif" style={{ fontSize: "var(--text-lg)", color: "var(--color-navy)" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 min-w-0 flex flex-col gap-[var(--space-4)]">

            {/* Onboarding banner */}
            {showOnboarding && (
              <div
                style={{
                  ...cardStyle,
                  padding: "var(--space-4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                }}
              >
                <span className="font-sans" style={{ fontSize: "var(--text-sm)", color: "var(--color-navy)" }}>
                  Welcome to t&#281;sknota — fill in your profile to get started.
                </span>
                <Button variant="ghost" onClick={() => setShowOnboarding(false)}>✕</Button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <TabPill key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
              ))}
            </div>

            {/* Tab: Personal Info */}
            {tab === "Personal Info" && (
              <div style={cardStyle}>
                <div className="flex flex-col gap-[var(--space-3)]">
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Username</label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State / Province" />
                  </div>
                  <div>
                    <label style={labelStyle}>Country</label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                  </div>

                  {/* Change password */}
                  <div>
                    <Button variant="primary" onClick={() => setShowPwFields((v) => !v)}>
                      Change Password
                    </Button>
                    {showPwFields && (
                      <div className="flex flex-col gap-[var(--space-3)] mt-[var(--space-3)]">
                        <div>
                          <label style={labelStyle}>New Password</label>
                          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                        </div>
                        <div>
                          <label style={labelStyle}>Confirm Password</label>
                          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
                        </div>
                      </div>
                    )}
                  </div>

                  {personalErr && (
                    <p className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-destructive)" }}>{personalErr}</p>
                  )}

                  <div className="flex items-center justify-between pt-[var(--space-2)]">
                    <Button variant="destructive" onClick={handleSignOut}>Sign Out</Button>
                    <Button variant="primary" onClick={savePersonal} disabled={personalSaving}>
                      {personalSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Social & Codes */}
            {tab === "Social & Codes" && (
              <div style={cardStyle}>
                <div className="flex flex-col gap-[var(--space-4)]">
                  <SectionHeading title="Social Handles" />
                  <div className="flex flex-col gap-[var(--space-3)]">
                    <div>
                      <label style={labelStyle}>Instagram</label>
                      <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" />
                    </div>
                    <div>
                      <label style={labelStyle}>TikTok</label>
                      <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@handle" />
                    </div>
                    <div>
                      <label style={labelStyle}>YouTube</label>
                      <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="@handle" />
                    </div>
                  </div>

                  <SectionHeading title="Discount Codes" />

                  {/* Code list */}
                  {codes.length > 0 && (
                    <div>
                      {codes.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-[var(--space-3)]"
                          style={{ minHeight: "var(--size-row-min)", borderBottom: "1px solid var(--color-row-divider)" }}
                        >
                          <span className="font-sans flex-1 truncate" style={{ fontSize: "var(--text-sm)", color: "var(--color-navy)" }}>
                            {c.place || "\u2014"}
                          </span>
                          <span className="font-sans" style={{ fontSize: "var(--text-sm)", color: "var(--color-navy)", minWidth: "120px" }}>
                            {c.code || "\u2014"}
                          </span>
                          <span className="font-sans flex-1 truncate" style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                            {c.notes || ""}
                          </span>
                          <Button variant="ghost" onClick={() => handleRemoveCode(c.id)}>Remove</Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add code row */}
                  <div className="flex gap-[var(--space-2)] flex-wrap">
                    <Input
                      value={newPlace}
                      onChange={(e) => setNewPlace(e.target.value)}
                      placeholder="Place"
                      className="flex-1 min-w-[100px]"
                    />
                    <Input
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="Code"
                      className="flex-1 min-w-[100px]"
                    />
                    <Input
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Notes"
                      className="flex-1 min-w-[100px]"
                    />
                    <Button variant="primary" onClick={handleAddCode} disabled={!newCode.trim()}>
                      Add Code
                    </Button>
                  </div>

                  <div className="flex justify-end pt-[var(--space-2)]">
                    <Button variant="primary" onClick={saveSocial} disabled={socialSaving}>
                      {socialSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Privacy */}
            {tab === "Privacy" && (
              <div style={cardStyle}>
                <div className="flex flex-col gap-0">
                  {[
                    { label: "Show my collection to friends", value: showCollection, set: setShowCollection },
                    { label: "Show my followers count", value: showFollowers, set: setShowFollowers },
                    { label: "Show my following count", value: showFollowing, set: setShowFollowing },
                    { label: "Show social handles on my profile", value: showSocialHandles, set: setShowSocialHandles },
                    { label: "Show discount codes to friends", value: showDiscountCodes, set: setShowDiscountCodes },
                    { label: "Allow friend requests", value: allowFriendRequests, set: setAllowFriendRequests },
                  ].map(({ label, value, set }) => (
                    <div key={label} style={privacyRowStyle}>
                      <span className="font-sans" style={{ fontSize: "var(--text-sm)", color: "var(--color-navy)" }}>{label}</span>
                      <Toggle checked={value} onChange={set} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-[var(--space-4)]">
                  <Button variant="primary" onClick={savePrivacy} disabled={privacySaving}>
                    {privacySaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}

            {/* Tab: Data */}
            {tab === "Data" && (
              <div style={cardStyle}>
                <div className="flex flex-col gap-[var(--space-4)]">
                  <Button variant="primary" className="w-full" onClick={exportCSV}>
                    Export my data as CSV
                  </Button>
                  <p className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                    Your user ID: {user?.id ?? "\u2014"}
                  </p>

                  <div style={{ height: "1px", background: "var(--color-row-divider)" }} />

                  <div>
                    <div
                      className="font-sans uppercase"
                      style={{ fontSize: "var(--text-sm)", color: "var(--color-navy)", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-2)" }}
                    >
                      Help improve our data
                    </div>
                    <p className="font-sans" style={{ fontSize: "var(--text-sm)", color: "var(--color-meta-text)" }}>
                      See incorrect community data on a fragrance? Flag it from the fragrance detail view and our team will review it.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </PageContent>
    </>
  );
}
