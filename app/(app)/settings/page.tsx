"use client";

import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContent } from "@/components/layout/PageContent";
import { FragSearch } from "@/components/ui/frag-search";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { STATUS_LABELS } from "@/types";
import { getCompCount } from "@/lib/frag-utils";

function esc(v: unknown): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export default function SettingsPage() {
  const { user, signOut } = useUser();
  const { fragrances, compliments } = useData();
  const router = useRouter();

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  function exportCSV() {
    const myFrags = fragrances.filter((f) => f.userId === user?.id);
    const myComps = compliments.filter((c) => c.userId === user?.id);
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

  return (
    <>
      <Topbar title="Settings" actions={<FragSearch />} />
      <PageContent maxWidth="560px">

        <SectionHeader title="Account" />
        {user && (
          <div className="border border-[var(--color-sand-light)] bg-[var(--color-cream-dark)] mb-4">
            <div className="px-5 py-4 border-b border-[var(--color-cream-dark)]">
              <div className="font-mono uppercase mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', letterSpacing: 'var(--tracking-md)' }}>
                Name
              </div>
              <div className="font-serif italic" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-navy)' }}>
                {user.name}
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="font-mono text-xs text-[var(--color-meta-text)] tracking-[var(--tracking-md)] uppercase mb-1">
                User ID
              </div>
              <div className="font-mono text-xs text-[var(--color-notes-text)] break-all">
                {user.id}
              </div>
            </div>
          </div>
        )}

        <Button variant="destructive" onClick={handleSignOut} className="mb-10">
          Sign out
        </Button>

        <SectionHeader title="Data" />
        <div className="border border-[var(--color-sand-light)] bg-[var(--color-cream-dark)] mb-6">
          <div className="px-5 py-4 border-b border-[var(--color-cream-dark)]">
            <div className="font-sans text-[length:var(--text-sm)] text-[var(--color-navy)] mb-1">
              Export your data
            </div>
            <div className="font-mono text-xs text-[var(--color-meta-text)]">
              Downloads your fragrances and compliment history as a CSV file.
            </div>
          </div>
          <div className="px-5 py-4">
            <Button variant="primary" onClick={exportCSV}>Export CSV</Button>
          </div>
        </div>

        <SectionHeader title="Admin" />
        <div className="border border-[var(--color-sand-light)] bg-[var(--color-cream-dark)]">
          <div className="px-5 py-4 border-b border-[var(--color-cream-dark)]">
            <div className="font-sans text-[length:var(--text-sm)] text-[var(--color-navy)] mb-1">
              System dashboard
            </div>
            <div className="font-mono text-xs text-[var(--color-meta-text)]">
              API spend, usage analytics, error logs, and data audit.
            </div>
          </div>
          <div className="px-5 py-4">
            <Button variant="primary" onClick={() => router.push("/admin")}>Open Admin</Button>
          </div>
        </div>

      </PageContent>
    </>
  );
}
