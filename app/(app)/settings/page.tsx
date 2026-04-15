"use client";

import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { SectionHeader } from "@/components/ui/section-header";
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
      <Topbar title="Settings" />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:p-[26px] max-w-[560px]">

        <SectionHeader title="Account" />
        {user && (
          <div className="border border-[var(--b2)] bg-[var(--off)] mb-4">
            <div className="px-5 py-4 border-b border-[var(--b1)]">
              <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-1">
                Name
              </div>
              <div className="font-[var(--serif)] text-lg text-[var(--blue)]">
                {user.name}
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-1">
                User ID
              </div>
              <div className="font-[var(--mono)] text-xs text-[var(--ink4)] break-all">
                {user.id}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="font-[var(--mono)] text-xs tracking-[0.08em] px-4 py-[9px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--rose-tk)] hover:text-[var(--rose-tk)] transition-colors mb-10"
        >
          Sign out
        </button>

        <SectionHeader title="Data" />
        <div className="border border-[var(--b2)] bg-[var(--off)] mb-6">
          <div className="px-5 py-4 border-b border-[var(--b1)]">
            <div className="font-[var(--body)] text-sm text-[var(--ink)] mb-1">
              Export your data
            </div>
            <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">
              Downloads your fragrances and compliment history as a CSV file.
            </div>
          </div>
          <div className="px-5 py-4">
            <button
              onClick={exportCSV}
              className="font-[var(--mono)] text-xs tracking-[0.08em] px-4 py-[9px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        <SectionHeader title="Admin" />
        <div className="border border-[var(--b2)] bg-[var(--off)]">
          <div className="px-5 py-4 border-b border-[var(--b1)]">
            <div className="font-[var(--body)] text-sm text-[var(--ink)] mb-1">
              System dashboard
            </div>
            <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">
              API spend, usage analytics, error logs, and data audit.
            </div>
          </div>
          <div className="px-5 py-4">
            <button
              onClick={() => router.push("/admin")}
              className="font-[var(--mono)] text-xs tracking-[0.08em] px-4 py-[9px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
            >
              Open Admin
            </button>
          </div>
        </div>

      </main>
    </>
  );
}
