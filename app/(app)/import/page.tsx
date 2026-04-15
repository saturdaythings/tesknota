"use client";

import { useState, useRef } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { SectionHeader } from "@/components/ui/section-header";
import { FragForm } from "@/components/ui/frag-form";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { appendFrag } from "@/lib/data/mutations";
import { useToast } from "@/components/ui/toast";
import type { CommunityFrag, FragranceStatus, FragranceType, BottleSize, UserFragrance } from "@/types";

// ── CSV template ──────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  "Name", "House", "Status", "Type", "Sizes", "Personal Rating (1-5)",
  "Where Bought", "Purchase Month", "Purchase Year", "Purchase Price", "Personal Notes",
];

const CSV_EXAMPLE_ROW = [
  "Baccarat Rouge 540", "Maison Francis Kurkdjian", "CURRENT", "Eau de Parfum",
  "Full Bottle", "5", "Sephora", "Mar", "2023", "$320", "My signature scent",
];

const STATUS_VALUES = ["CURRENT", "PREVIOUSLY_OWNED", "WANT_TO_BUY", "WANT_TO_SMELL", "DONT_LIKE", "WANT_TO_IDENTIFY", "FINISHED"];
const TYPE_VALUES = ["Extrait de Parfum", "Eau de Parfum", "Eau de Toilette", "Cologne", "Perfume Concentré", "Body Spray", "Perfume Oil", "Other"];
const SIZE_VALUES = ["Sample", "Travel", "Full Bottle", "Decant"];
const MONTH_ABBRS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function downloadTemplate() {
  const notes = [
    `# Status values: ${STATUS_VALUES.join(", ")}`,
    `# Type values: ${TYPE_VALUES.join(", ")}`,
    `# Sizes: ${SIZE_VALUES.join(", ")} (separate multiple with semicolons)`,
    `# Month: ${MONTH_ABBRS.join(", ")} or 01-12`,
    "#",
    `# ${CSV_HEADERS.join(",")}`,
    CSV_EXAMPLE_ROW.map((v) => v.includes(",") ? `"${v}"` : v).join(","),
  ].join("\n");

  const blob = new Blob([notes], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tesknota-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── CSV parser ────────────────────────────────────────────────────────────────

interface ParsedRow {
  name: string;
  house: string;
  status: FragranceStatus;
  type: FragranceType | null;
  sizes: BottleSize[];
  personalRating: number | null;
  whereBought: string | null;
  purchaseMonth: string | null;
  purchaseYear: string | null;
  purchasePrice: string | null;
  personalNotes: string;
  error?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === "," && !inQuote) { result.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text: string): { rows: ParsedRow[]; skipped: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
  if (lines.length === 0) return { rows: [], skipped: 0 };

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const nameIdx = headers.findIndex((h) => h === "name");
  const houseIdx = headers.findIndex((h) => h === "house");
  const statusIdx = headers.findIndex((h) => h === "status");
  const typeIdx = headers.findIndex((h) => h === "type");
  const sizesIdx = headers.findIndex((h) => h.includes("size"));
  const ratingIdx = headers.findIndex((h) => h.includes("rating"));
  const whereBoughtIdx = headers.findIndex((h) => h.includes("bought") || h.includes("where"));
  const monthIdx = headers.findIndex((h) => h.includes("month"));
  const yearIdx = headers.findIndex((h) => h.includes("year"));
  const priceIdx = headers.findIndex((h) => h.includes("price"));
  const notesIdx = headers.findIndex((h) => h.includes("note"));

  const rows: ParsedRow[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const get = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx] : "").trim();

    const name = get(nameIdx);
    const house = get(houseIdx);
    if (!name) { skipped++; continue; }

    const rawStatus = get(statusIdx).toUpperCase();
    const status = STATUS_VALUES.includes(rawStatus) ? rawStatus as FragranceStatus : "CURRENT";

    const rawType = get(typeIdx);
    const type = TYPE_VALUES.includes(rawType) ? rawType as FragranceType : null;

    const rawSizes = get(sizesIdx);
    const sizes = rawSizes
      ? rawSizes.split(/[;,|]/).map((s) => s.trim()).filter((s) => SIZE_VALUES.includes(s)) as BottleSize[]
      : [];

    const rawRating = get(ratingIdx);
    const personalRating = rawRating ? Math.min(5, Math.max(1, parseInt(rawRating) || 0)) || null : null;

    const rawMonth = get(monthIdx);
    // Accept "Jan"-"Dec" or "01"-"12"
    let purchaseMonth: string | null = null;
    if (rawMonth) {
      const abbIdx = MONTH_ABBRS.findIndex((m) => m.toLowerCase() === rawMonth.toLowerCase().slice(0, 3));
      if (abbIdx >= 0) purchaseMonth = MONTH_ABBRS[abbIdx];
      else if (/^\d{1,2}$/.test(rawMonth)) purchaseMonth = MONTH_ABBRS[parseInt(rawMonth) - 1] ?? null;
      else purchaseMonth = rawMonth;
    }

    rows.push({
      name,
      house,
      status,
      type,
      sizes,
      personalRating,
      whereBought: get(whereBoughtIdx) || null,
      purchaseMonth,
      purchaseYear: get(yearIdx) || null,
      purchasePrice: get(priceIdx) || null,
      personalNotes: get(notesIdx),
    });
  }

  return { rows, skipped };
}

// ── CSV import tab ────────────────────────────────────────────────────────────

type ImportState = "idle" | "preview" | "importing" | "done";

function CSVImportTab({ userId }: { userId: string }) {
  const { addFrag } = useData();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>("idle");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows: parsed, skipped: sk } = parseCSV(text);
      setRows(parsed);
      setSkipped(sk);
      setState("preview");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function runImport() {
    setState("importing");
    setProgress(0);
    const errs: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const frag: UserFragrance = {
        id: "csv-" + Date.now() + "-" + i,
        fragranceId: null,
        userId,
        name: row.name,
        house: row.house,
        status: row.status,
        sizes: row.sizes,
        type: row.type,
        personalRating: row.personalRating,
        statusRating: null,
        whereBought: row.whereBought,
        purchaseDate: null,
        purchaseMonth: row.purchaseMonth,
        purchaseYear: row.purchaseYear,
        purchasePrice: row.purchasePrice,
        isDupe: false,
        dupeFor: "",
        personalNotes: row.personalNotes,
        createdAt: new Date().toISOString(),
      };
      try {
        const { id, fragranceId } = await appendFrag(frag);
        addFrag({ ...frag, id, fragranceId: fragranceId ?? null });
      } catch (e: unknown) {
        errs.push(row.name + ": " + (e instanceof Error ? e.message : "failed"));
      }
      setProgress(i + 1);
    }
    setErrors(errs);
    setState("done");
    toast(rows.length - errs.length + " fragrances imported.");
  }

  function reset() {
    setRows([]);
    setSkipped(0);
    setProgress(0);
    setErrors([]);
    setState("idle");
  }

  if (state === "idle") {
    return (
      <div>
        <div className="flex gap-3 mb-6">
          <button
            onClick={downloadTemplate}
            className="font-[var(--mono)] text-[11px] tracking-[0.06em] px-4 py-2.5 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
          >
            Download blank template (.csv)
          </button>
        </div>
        <p className="font-[var(--body)] text-sm text-[var(--ink3)] mb-4 max-w-[460px]">
          Fill in the template and upload it below. Required columns: Name, House. All others are optional.
        </p>
        <div
          className="border-2 border-dashed border-[var(--b3)] max-w-[460px] p-10 flex flex-col items-center gap-3 hover:border-[var(--blue)] transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.06em]">Click to select CSV file</div>
          <div className="font-[var(--mono)] text-[10px] text-[var(--ink4)]">.csv files only</div>
        </div>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  if (state === "preview") {
    return (
      <div>
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] mb-4">
          {rows.length} rows ready to import{skipped > 0 ? ` · ${skipped} blank rows skipped` : ""}.
        </div>
        <div className="border border-[var(--b2)] max-w-[720px] mb-5 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--b2)]">
                {["Name", "House", "Status", "Type", "Rating", "Month", "Year"].map((h) => (
                  <th key={h} className="font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-[var(--ink3)] px-3 py-2 text-left font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row, i) => (
                <tr key={i} className="border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)]">
                  <td className="font-[var(--body)] text-sm text-[var(--ink)] px-3 py-2">{row.name}</td>
                  <td className="font-[var(--mono)] text-xs text-[var(--ink3)] px-3 py-2">{row.house}</td>
                  <td className="font-[var(--mono)] text-[10px] text-[var(--ink3)] px-3 py-2">{row.status}</td>
                  <td className="font-[var(--mono)] text-[10px] text-[var(--ink3)] px-3 py-2">{row.type ?? "—"}</td>
                  <td className="font-[var(--mono)] text-xs text-[var(--ink3)] px-3 py-2">{row.personalRating ?? "—"}</td>
                  <td className="font-[var(--mono)] text-[10px] text-[var(--ink3)] px-3 py-2">{row.purchaseMonth ?? "—"}</td>
                  <td className="font-[var(--mono)] text-[10px] text-[var(--ink3)] px-3 py-2">{row.purchaseYear ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 20 && (
            <div className="font-[var(--mono)] text-[10px] text-[var(--ink4)] px-3 py-2 border-t border-[var(--b1)]">
              +{rows.length - 20} more rows not shown
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={runImport}
            className="font-[var(--mono)] text-[11px] tracking-[0.06em] px-5 py-2.5 bg-[var(--blue)] text-white hover:opacity-90 transition-opacity"
          >
            Import {rows.length} fragrances
          </button>
          <button
            onClick={reset}
            className="font-[var(--mono)] text-[11px] tracking-[0.06em] px-4 py-2.5 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (state === "importing") {
    const pct = rows.length > 0 ? Math.round((progress / rows.length) * 100) : 0;
    return (
      <div className="max-w-[460px]">
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] mb-3">
          Importing... {progress} / {rows.length}
        </div>
        <div className="h-2 bg-[var(--b2)] w-full">
          <div className="h-2 bg-[var(--blue)] transition-all" style={{ width: pct + "%" }} />
        </div>
      </div>
    );
  }

  // done
  return (
    <div>
      <div className="font-[var(--mono)] text-xs text-[var(--ink)] mb-3">
        Done. {rows.length - errors.length} imported successfully{errors.length > 0 ? `, ${errors.length} failed` : ""}.
      </div>
      {errors.length > 0 && (
        <div className="border border-[var(--b3)] bg-[var(--off2)] px-3 py-2 mb-4 max-w-[460px]">
          {errors.map((e, i) => (
            <div key={i} className="font-[var(--mono)] text-[10px] text-[var(--rose-tk)] py-0.5">{e}</div>
          ))}
        </div>
      )}
      <button
        onClick={reset}
        className="font-[var(--mono)] text-[11px] tracking-[0.06em] px-4 py-2.5 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
      >
        Import another file
      </button>
    </div>
  );
}

// ── Search tab ────────────────────────────────────────────────────────────────

type AddTarget = "CURRENT" | "WANT_TO_BUY" | "WANT_TO_SMELL";

function SearchTab({ userId }: { userId: string }) {
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

  const editing = prefillFrag
    ? {
        id: "",
        fragranceId: prefillFrag.fragranceId,
        userId,
        name: prefillFrag.fragranceName,
        house: prefillFrag.fragranceHouse,
        status: formStatus,
        sizes: ["Full Bottle" as const],
        type: null,
        personalRating: null,
        statusRating: null,
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
    <>
      {formOpen && (
        <FragForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          editing={editing}
          forceStatus={formStatus}
        />
      )}
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
        <div className="border border-[var(--b2)] max-w-[460px]">
          {results.map((cf) => (
            <div
              key={cf.fragranceId}
              className="flex items-center justify-between px-4 py-3 border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)]"
            >
              <div className="min-w-0 mr-4">
                <div className="font-[var(--body)] text-sm text-[var(--ink)]">{cf.fragranceName}</div>
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
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ImportTab = "search" | "csv";

export default function ImportPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<ImportTab>("search");

  return (
    <>
      <Topbar category="Manage" title="Import" />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:p-[26px]">
        <div className="flex gap-0 border-b border-[var(--b2)] mb-6 max-w-[720px]">
          <button
            onClick={() => setActiveTab("search")}
            className={`font-[var(--mono)] text-[11px] tracking-[0.1em] uppercase px-4 py-2 border-b-2 transition-all ${activeTab === "search" ? "border-[var(--blue)] text-[var(--blue)]" : "border-transparent text-[var(--ink3)] hover:text-[var(--ink)]"}`}
          >
            Search Database
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`font-[var(--mono)] text-[11px] tracking-[0.1em] uppercase px-4 py-2 border-b-2 transition-all ${activeTab === "csv" ? "border-[var(--blue)] text-[var(--blue)]" : "border-transparent text-[var(--ink3)] hover:text-[var(--ink)]"}`}
          >
            Import CSV
          </button>
        </div>

        {activeTab === "search" && <SearchTab userId={user?.id ?? ""} />}
        {activeTab === "csv" && <CSVImportTab userId={user?.id ?? ""} />}
      </main>
    </>
  );
}
