"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { SectionHeader } from "@/components/ui/section-header";
import { FragForm } from "@/components/ui/frag-form";
import { useData } from "@/lib/data-context";
import type { CommunityFrag, FragranceStatus } from "@/types";

type AddTarget = "CURRENT" | "WANT_TO_BUY" | "WANT_TO_SMELL";

export default function ImportPage() {
  const { communityFrags } = useData();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<FragranceStatus>("CURRENT");
  const [prefillFrag, setPrefillFrag] = useState<CommunityFrag | null>(null);

  const results = search.trim().length >= 2
    ? communityFrags.filter(
        (cf) =>
          cf.fragranceName.toLowerCase().includes(search.toLowerCase()) ||
          cf.fragranceHouse.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 20)
    : [];

  function openAddForm(cf: CommunityFrag, target: AddTarget) {
    setPrefillFrag(cf);
    setFormStatus(target);
    setFormOpen(true);
  }

  return (
    <>
      {formOpen && (
        <FragFormWithPrefill
          open={formOpen}
          onClose={() => setFormOpen(false)}
          prefill={prefillFrag}
          status={formStatus}
        />
      )}
      <Topbar category="Manage" title="Import" />
      <main className="flex-1 overflow-y-auto p-[26px]">
        <SectionHeader title="Search Fragrance Database" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or house..."
          className="w-full max-w-[460px] px-3 py-[9px] mb-5 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
        />

        {search.trim().length >= 2 && results.length === 0 && (
          <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">No matches.</div>
        )}

        {results.length > 0 && (
          <div className="border border-[var(--b2)] max-w-[600px]">
            {results.map((cf) => (
              <div
                key={cf.fragranceId}
                className="flex items-center justify-between px-4 py-3 border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)]"
              >
                <div className="min-w-0 mr-4">
                  <div className="font-[var(--body)] text-sm text-[var(--ink)]">
                    {cf.fragranceName}
                  </div>
                  <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">
                    {cf.fragranceHouse}
                    {cf.avgPrice ? ` · ${cf.avgPrice.replace(/~/g, "")}` : ""}
                    {cf.communityRating ? ` · ${cf.communityRating}/10` : ""}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openAddForm(cf, "WANT_TO_BUY")}
                    className="font-[var(--mono)] text-[11px] tracking-[0.06em] px-3 py-[5px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors whitespace-nowrap"
                  >
                    Wishlist
                  </button>
                  <button
                    onClick={() => openAddForm(cf, "CURRENT")}
                    className="font-[var(--mono)] text-[11px] tracking-[0.06em] px-3 py-[5px] border border-[var(--blue)] text-[var(--blue)] hover:bg-[var(--blue-tint,rgba(0,80,140,0.06))] transition-colors whitespace-nowrap"
                  >
                    Add to Collection
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

// Thin wrapper so FragForm gets correct prefill from CommunityFrag
function FragFormWithPrefill({
  open,
  onClose,
  prefill,
  status,
}: {
  open: boolean;
  onClose: () => void;
  prefill: CommunityFrag | null;
  status: FragranceStatus;
}) {
  const editing = prefill
    ? {
        id: "",
        fragranceId: prefill.fragranceId,
        userId: "u1" as const,
        name: prefill.fragranceName,
        house: prefill.fragranceHouse,
        status,
        sizes: ["Full Bottle" as const],
        type: null,
        personalRating: null,
        statusRating: null,
        personalLong: null,
        personalSill: null,
        whereBought: null,
        purchaseDate: null,
        purchaseMonth: null,
        purchaseYear: null,
        purchasePrice: null,
        isDupe: false,
        dupeFor: "",
        personalNotes: "",
        createdAt: "",
      }
    : null;

  return (
    <FragForm
      open={open}
      onClose={onClose}
      editing={editing}
      forceStatus={status}
    />
  );
}
