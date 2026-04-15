"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/lib/user-context";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";

// ── Row helper for Account section ───────────────────────

function AccountRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        padding: "var(--space-4) 0",
        borderBottom: "1px solid var(--color-border)",
      }}
      className="last:border-b-0"
    >
      <span className="text-body" style={{ paddingTop: 6 }}>
        {label}
      </span>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, signOut } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwResetSent, setPwResetSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.name ?? "");
  }, [user]);

  async function saveProfile() {
    if (!user || !displayName.trim()) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ name: displayName.trim() })
        .eq("id", user.id);
      if (error) throw error;
      toast("Profile updated.", "success");
    } catch (e) {
      console.error(e);
      toast("Failed to save. Try again.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function sendPasswordReset() {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      setPwResetSent(true);
    } catch (e) {
      console.error(e);
      toast("Failed to send reset email.", "error");
    } finally {
      setSendingReset(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (!user) return null;

  const initial = (user.name ?? "?")[0].toUpperCase();

  return (
    <>
      <Topbar title="Settings" />
      <main style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "var(--space-8)",
          }}
          className="max-sm:px-[var(--space-4)] max-sm:py-[var(--space-4)]"
        >
          {/* ── Profile ── */}
          <Card padding="var(--space-6)">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardBody>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-5)",
                }}
              >
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />

                <Input
                  label="Email"
                  type="email"
                  value={user.email ?? ""}
                  disabled
                  hint="Contact support to change your email"
                />

                {/* Avatar */}
                <div>
                  <div className="text-label" style={{ marginBottom: "var(--space-2)" }}>
                    Avatar
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--radius-full)",
                      background: "var(--color-accent-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "var(--text-md)",
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      marginBottom: "var(--space-2)",
                    }}
                    aria-hidden="true"
                  >
                    {initial}
                  </div>
                  <p className="text-meta" style={{ color: "var(--color-text-muted)" }}>
                    Avatars use your display name initials
                  </p>
                </div>
              </div>
            </CardBody>
            <CardFooter style={{ justifyContent: "flex-end" }}>
              <Button
                variant="primary"
                onClick={saveProfile}
                disabled={savingProfile || !displayName.trim()}
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Divider style={{ margin: "var(--space-6) 0" }} />

          {/* ── Account ── */}
          <Card padding="var(--space-6)">
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardBody>
              <AccountRow label="Password">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "var(--space-2)",
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={sendPasswordReset}
                    disabled={sendingReset || pwResetSent}
                  >
                    {sendingReset ? "Sending..." : "Change Password"}
                  </Button>
                  {pwResetSent && (
                    <span
                      className="text-meta"
                      style={{ color: "var(--color-success)" }}
                    >
                      Password reset email sent
                    </span>
                  )}
                </div>
              </AccountRow>
              <AccountRow label="Sign Out">
                <Button variant="danger" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </AccountRow>
            </CardBody>
          </Card>

          <Divider style={{ margin: "var(--space-6) 0" }} />

          {/* ── Preferences ── */}
          <Card padding="var(--space-6)">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardBody>
              <EmptyState
                icon={<SlidersHorizontal size={32} />}
                title="More preferences coming soon"
              />
            </CardBody>
          </Card>
        </div>
      </main>
    </>
  );
}
