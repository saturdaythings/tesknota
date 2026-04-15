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
      <Topbar category="Manage" title="Settings" />
      <main className="flex-1 overflow-y-auto p-[26px]">
        <SectionHeader title="Account" />
        {user && (
          <div className="border border-[var(--b2)] p-4 mb-6 max-w-[380px]">
            <div className="font-[var(--serif)] text-lg italic text-[var(--blue)] mb-1">
              {user.name}
            </div>
            <div className="font-[var(--mono)] text-[11px] text-[var(--ink3)] tracking-[0.08em] uppercase">
              {user.id}
            </div>
          </div>
        )}
        <div className="flex gap-3 mb-10">
          <button
            onClick={handleSignOut}
            className="font-[var(--mono)] text-xs tracking-[0.08em] px-4 py-[7px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--rose-tk)] hover:text-[var(--rose-tk)] transition-colors"
          >
            Sign out
          </button>
        </div>

        <SectionHeader title="Data" />
        <div className="mb-10 max-w-[380px]">
          <p className="font-[var(--mono)] text-[11px] text-[var(--ink3)] mb-3">
            Export your fragrances and compliments as a CSV file.
          </p>
          <button
            onClick={exportCSV}
            className="font-[var(--mono)] text-xs tracking-[0.08em] px-4 py-[7px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="mt-16 pt-4 border-t border-[var(--b1)]">
          <button
            onClick={() => router.push("/admin")}
            className="font-[var(--mono)] text-[10px] tracking-[0.08em] text-[var(--ink4)] hover:text-[var(--ink3)] bg-none border-none cursor-pointer p-0 transition-colors"
          >
            ↳ admin
          </button>
        </div>
      </main>
    </>
  );
}
