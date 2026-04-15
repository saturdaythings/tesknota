"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Topbar } from "@/components/layout/Topbar";
import { FragForm } from "@/components/ui/frag-form";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { appendFrag, enrichFragranceCommunityData } from "@/lib/data/mutations";
import { useToast } from "@/components/ui/toast";
import type { CommunityFrag, FragranceStatus, FragranceType, BottleSize, UserFragrance } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_VALUES = ["CURRENT", "PREVIOUSLY_OWNED", "WANT_TO_BUY", "WANT_TO_SMELL", "DONT_LIKE", "WANT_TO_IDENTIFY", "FINISHED"];
const TYPE_VALUES = ["Extrait de Parfum", "Eau de Parfum", "Eau de Toilette", "Cologne", "Perfume Concentré", "Body Spray", "Perfume Oil", "Other"];
const SIZE_VALUES = ["Sample", "Travel", "Full Bottle", "Decant"];
const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── XLSX template download ────────────────────────────────────────────────────

const INSTRUCTIONS = [
  ["tesknota — Fragrance Import Template"],
  [""],
  ["HOW TO USE THIS FILE"],
  ["Fill in the 'Import Data' sheet with your fragrance data, one row per fragrance."],
  ["You can fill this in manually, or give this file (and these instructions) to an AI tool to populate for you."],
  [""],
  ["REQUIRED FIELDS"],
  ["Name", "The fragrance name. Required for every row."],
  ["House", "The brand / house (e.g. Chanel, Dior, Maison Francis Kurkdjian). Required."],
  [""],
  ["PERSONAL DATA (your collection info)"],
  ["Status", `One of: ${STATUS_VALUES.join(", ")}`],
  ["Type", `One of: ${TYPE_VALUES.join(", ")}`],
  ["Sizes", `One or more of: ${SIZE_VALUES.join(", ")} — separate multiple with semicolons (e.g. Full Bottle;Decant)`],
  ["Personal Rating", "Your personal rating: 1, 2, 3, 4, or 5"],
  ["Where Bought", "e.g. Sephora, Fragrantica, eBay"],
  ["Purchase Month", "Month abbreviation (Jan, Feb, Mar...) or number (01, 02, 03...)"],
  ["Purchase Year", "4-digit year, e.g. 2023"],
  ["Purchase Price", "e.g. $120 or 120"],
  ["Personal Notes", "Your impressions, memories, context — free text"],
  [""],
  ["COMMUNITY DATA (fragrance facts — shared across all users)"],
  ["Top Notes", "Top notes separated by semicolons, e.g. Bergamot;Lemon;Pink Pepper"],
  ["Middle Notes", "Heart notes separated by semicolons"],
  ["Base Notes", "Base notes separated by semicolons"],
  ["Accords", "Main accords separated by semicolons, e.g. Woody;Musky;Floral"],
  ["Avg Price", "Average retail price, e.g. $250 or ~$250"],
  ["Community Rating", "Rating out of 10, e.g. 8.5"],
  ["Parfumo Rating", "Parfumo.com rating if known"],
  ["Longevity", "e.g. Long-lasting, Moderate, Weak"],
  ["Sillage", "e.g. Enormous, Heavy, Moderate, Soft, Intimate"],
  [""],
  ["NOTES"],
  ["- Community data fields update the shared fragrance database. If a fragrance already exists, only non-empty fields will be updated."],
  ["- If Status is blank, it defaults to CURRENT."],
  ["- Rows with no Name are ignored."],
  ["- You can leave any column blank — only Name and House are required."],
  ["- For AI assistance: ask your AI tool to fill in the 'Import Data' sheet based on your fragrance collection."],
  ["  A good prompt: 'Fill in each row using the column instructions in the Instructions sheet. For community data, use your knowledge of the fragrance.'"],
];

const DATA_HEADERS = [
  "Name", "House", "Status", "Type", "Sizes",
  "Personal Rating (1-5)", "Where Bought", "Purchase Month", "Purchase Year", "Purchase Price", "Personal Notes",
  "Top Notes", "Middle Notes", "Base Notes", "Accords",
  "Avg Price", "Community Rating", "Parfumo Rating", "Longevity", "Sillage",
];

const EXAMPLE_ROW = [
  "Baccarat Rouge 540", "Maison Francis Kurkdjian", "CURRENT", "Eau de Parfum", "Full Bottle",
  "5", "Sephora", "Mar", "2023", "$320", "My signature scent — warm and sweet",
  "Saffron;Jasmine", "Amberwood;Ambergris", "Fir Resin;Cedar", "Woody;Sweet;Musky",
  "~$250", "8.9", "8.7", "Long-lasting", "Enormous",
];

function downloadXLSXTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Instructions
  const wsInstructions = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);
  wsInstructions["!cols"] = [{ wch: 28 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  // Sheet 2: Import Data
  const wsData = XLSX.utils.aoa_to_sheet([DATA_HEADERS, EXAMPLE_ROW]);
  wsData["!cols"] = DATA_HEADERS.map((h) => ({
    wch: Math.max(h.length + 2, h.includes("Notes") ? 30 : 18),
  }));
  XLSX.utils.book_append_sheet(wb, wsData, "Import Data");

  XLSX.writeFile(wb, "tesknota-import-template.xlsx");
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function splitList(raw: string): string[] {
  return raw.split(/[;|,]/).map((s) => s.trim()).filter(Boolean);
}

function normalizeMonth(m: string): string {
  if (!m) return "";
  if (/^\d{1,2}$/.test(m.trim())) {
    const n = parseInt(m.trim());
    return n >= 1 && n <= 12 ? MONTH_ABBRS[n - 1] : "";
  }
  const idx = MONTH_ABBRS.findIndex((mn) => mn.toLowerCase() === m.trim().toLowerCase().slice(0, 3));
  return idx >= 0 ? MONTH_ABBRS[idx] : "";
}

interface ParsedRow {
  // Personal
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
  // Community
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  accords: string[];
  avgPrice: string;
  communityRating: string;
  parfumoRating: string;
  longevity: string;
  sillage: string;
  hasCommunityData: boolean;
}

function parseRows(headers: string[], dataRows: string[][]): { rows: ParsedRow[]; skipped: number } {
  const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hi = (search: string) => headers.findIndex((h) => norm(h).includes(norm(search)));
  const idx = {
    name: hi("name"),
    house: hi("house"),
    status: hi("status"),
    type: hi("type"),
    sizes: hi("size"),
    rating: hi("personalrating") >= 0 ? hi("personalrating") : hi("rating"),
    whereBought: hi("bought") >= 0 ? hi("bought") : hi("where"),
    month: hi("month"),
    year: hi("year"),
    price: hi("purchaseprice") >= 0 ? hi("purchaseprice") : hi("price"),
    personalNotes: hi("personalnotes") >= 0 ? hi("personalnotes") : hi("notes"),
    topNotes: hi("topnote") >= 0 ? hi("topnote") : hi("top"),
    middleNotes: hi("middlenote") >= 0 ? hi("middlenote") : hi("middle"),
    baseNotes: hi("basenote") >= 0 ? hi("basenote") : hi("base"),
    accords: hi("accord"),
    avgPrice: hi("avgprice") >= 0 ? hi("avgprice") : hi("averageprice"),
    communityRating: hi("communityrating"),
    parfumoRating: hi("parfumorating"),
    longevity: hi("longevity"),
    sillage: hi("sillage"),
  };

  const get = (row: string[], i: number) => (i >= 0 && i < row.length ? row[i] : "").trim();

  const rows: ParsedRow[] = [];
  let skipped = 0;

  for (const row of dataRows) {
    const name = get(row, idx.name);
    if (!name) { skipped++; continue; }

    const rawStatus = get(row, idx.status).toUpperCase();
    const status = STATUS_VALUES.includes(rawStatus) ? rawStatus as FragranceStatus : "CURRENT";

    const rawType = get(row, idx.type);
    const type = TYPE_VALUES.includes(rawType) ? rawType as FragranceType : null;

    const rawSizes = get(row, idx.sizes);
    const sizes = rawSizes
      ? splitList(rawSizes).filter((s) => SIZE_VALUES.includes(s)) as BottleSize[]
      : [];

    const rawRating = get(row, idx.rating);
    const personalRating = rawRating ? Math.min(5, Math.max(1, parseInt(rawRating) || 0)) || null : null;

    const topNotes = splitList(get(row, idx.topNotes));
    const middleNotes = splitList(get(row, idx.middleNotes));
    const baseNotes = splitList(get(row, idx.baseNotes));
    const accords = splitList(get(row, idx.accords));
    const avgPrice = get(row, idx.avgPrice);
    const communityRating = get(row, idx.communityRating);
    const parfumoRating = get(row, idx.parfumoRating);
    const longevity = get(row, idx.longevity);
    const sillage = get(row, idx.sillage);

    const hasCommunityData = !!(topNotes.length || middleNotes.length || baseNotes.length || accords.length || avgPrice || communityRating || parfumoRating || longevity || sillage);

    rows.push({
      name,
      house: get(row, idx.house),
      status,
      type,
      sizes,
      personalRating,
      whereBought: get(row, idx.whereBought) || null,
      purchaseMonth: normalizeMonth(get(row, idx.month)) || null,
      purchaseYear: get(row, idx.year) || null,
      purchasePrice: get(row, idx.price) || null,
      personalNotes: get(row, idx.personalNotes),
      topNotes, middleNotes, baseNotes, accords,
      avgPrice, communityRating, parfumoRating, longevity, sillage,
      hasCommunityData,
    });
  }

  return { rows, skipped };
}

function parseFile(file: File): Promise<{ rows: ParsedRow[]; skipped: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: "binary" });

        // Find the data sheet: prefer "Import Data", fall back to first non-"Instructions" sheet
        const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes("import") || n.toLowerCase().includes("data"))
          ?? wb.SheetNames.find((n) => !n.toLowerCase().includes("instruction"))
          ?? wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        const aoa: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }) as string[][];

        // Find header row: first row where cell[0] looks like "Name" or "name"
        let headerIdx = 0;
        for (let i = 0; i < Math.min(aoa.length, 10); i++) {
          const first = (aoa[i][0] ?? "").toString().toLowerCase().trim();
          if (first === "name" || first === "fragrance name" || first === "fragrance") {
            headerIdx = i;
            break;
          }
        }

        const headers = aoa[headerIdx].map((h) => String(h));
        const dataRows = aoa.slice(headerIdx + 1).filter((r) => r.some((c) => String(c).trim())).map((r) => r.map(String));

        resolve(parseRows(headers, dataRows));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ── CSV Import tab ────────────────────────────────────────────────────────────

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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { rows: parsed, skipped: sk } = await parseFile(file);
      setRows(parsed);
      setSkipped(sk);
      setState("preview");
    } catch {
      toast("Could not parse file. Make sure it is a valid .xlsx or .csv.");
    }
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
        // Enrich community data if the user provided it
        if (fragranceId && row.hasCommunityData) {
          await enrichFragranceCommunityData(fragranceId, {
            topNotes: row.topNotes,
            middleNotes: row.middleNotes,
            baseNotes: row.baseNotes,
            accords: row.accords,
            avgPrice: row.avgPrice,
            communityRating: row.communityRating,
            parfumoRating: row.parfumoRating,
            communityLongevityLabel: row.longevity,
            communitySillageLabel: row.sillage,
          });
        }
      } catch (e: unknown) {
        errs.push(row.name + ": " + (e instanceof Error ? e.message : "failed"));
      }
      setProgress(i + 1);
    }

    setErrors(errs);
    setState("done");
    toast((rows.length - errs.length) + " fragrances imported.");
  }

  function reset() {
    setRows([]);
    setSkipped(0);
    setProgress(0);
    setErrors([]);
    setState("idle");
  }

  const communityCount = rows.filter((r) => r.hasCommunityData).length;

  if (state === "idle") {
    return (
      <div>
        <button
          onClick={downloadXLSXTemplate}
          className="font-[var(--mono)] text-xs tracking-[0.06em] px-4 py-2.5 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors mb-5"
        >
          Download template (.xlsx)
        </button>
        <p className="font-[var(--body)] text-sm text-[var(--ink3)] mb-1 max-w-[500px]">
          The template has two sheets: Instructions and Import Data. Fill it in yourself, or give the file to an AI tool and ask it to populate your collection.
        </p>
        <p className="font-[var(--body)] text-sm text-[var(--ink3)] mb-6 max-w-[500px]">
          Both .xlsx and .csv files are accepted. Required: Name and House. All other fields — including community data like top notes, accords, and sillage — are optional.
        </p>
        <div
          className="border-2 border-dashed border-[var(--b3)] max-w-[460px] p-10 flex flex-col items-center gap-3 hover:border-[var(--blue)] transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.06em]">Click to select file</div>
          <div className="font-[var(--mono)] text-xs text-[var(--ink4)]">.xlsx or .csv</div>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  if (state === "preview") {
    return (
      <div>
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] mb-1">
          {rows.length} rows ready to import{skipped > 0 ? ` · ${skipped} blank rows skipped` : ""}.
        </div>
        {communityCount > 0 && (
          <div className="font-[var(--mono)] text-xs text-[var(--blue)] mb-4">
            {communityCount} {communityCount === 1 ? "row has" : "rows have"} community data (notes, accords, ratings) — these will be written to the shared fragrance database.
          </div>
        )}
        <div className="border border-[var(--b2)] max-w-[820px] mb-5 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--b2)]">
                {["Name", "House", "Status", "Type", "Rating", "Month / Year", "Community data"].map((h) => (
                  <th key={h} className="font-[var(--mono)] text-xs tracking-[0.1em] uppercase text-[var(--ink3)] px-3 py-2 text-left font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 25).map((row, i) => (
                <tr key={i} className="border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)]">
                  <td className="font-[var(--body)] text-sm text-[var(--ink)] px-3 py-2 max-w-[180px] truncate">{row.name}</td>
                  <td className="font-[var(--mono)] text-xs text-[var(--ink3)] px-3 py-2 whitespace-nowrap">{row.house}</td>
                  <td className="font-[var(--mono)] text-xs text-[var(--ink3)] px-3 py-2 whitespace-nowrap">{row.status}</td>
                  <td className="font-[var(--mono)] text-xs text-[var(--ink3)] px-3 py-2 whitespace-nowrap">{row.type ?? "—"}</td>
                  <td className="font-[var(--mono)] text-xs text-[var(--ink3)] px-3 py-2">{row.personalRating ?? "—"}</td>
                  <td className="font-[var(--mono)] text-xs text-[var(--ink3)] px-3 py-2 whitespace-nowrap">
                    {[row.purchaseMonth, row.purchaseYear].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.hasCommunityData ? (
                      <span className="font-[var(--mono)] text-xs text-[var(--blue)]">
                        {[
                          row.topNotes.length ? "top" : "",
                          row.middleNotes.length ? "mid" : "",
                          row.baseNotes.length ? "base" : "",
                          row.accords.length ? "accords" : "",
                          row.communityRating ? "rating" : "",
                        ].filter(Boolean).join(", ")}
                      </span>
                    ) : (
                      <span className="font-[var(--mono)] text-xs text-[var(--ink4)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 25 && (
            <div className="font-[var(--mono)] text-xs text-[var(--ink4)] px-3 py-2 border-t border-[var(--b1)]">
              +{rows.length - 25} more rows not shown
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={runImport}
            className="font-[var(--mono)] text-xs tracking-[0.06em] px-5 py-2.5 bg-[var(--blue)] text-white hover:opacity-90 transition-opacity"
          >
            Import {rows.length} fragrances
          </button>
          <button
            onClick={reset}
            className="font-[var(--mono)] text-xs tracking-[0.06em] px-4 py-2.5 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
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
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] mb-3">Importing... {progress} / {rows.length}</div>
        <div className="h-2 bg-[var(--b2)] w-full">
          <div className="h-2 bg-[var(--blue)] transition-all" style={{ width: pct + "%" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="font-[var(--mono)] text-xs text-[var(--ink)] mb-3">
        Done. {rows.length - errors.length} imported{errors.length > 0 ? `, ${errors.length} failed` : ""}.
      </div>
      {errors.length > 0 && (
        <div className="border border-[var(--b3)] bg-[var(--off2)] px-3 py-2 mb-4 max-w-[460px]">
          {errors.map((e, i) => (
            <div key={i} className="font-[var(--mono)] text-xs text-[var(--rose-tk)] py-0.5">{e}</div>
          ))}
        </div>
      )}
      <button
        onClick={reset}
        className="font-[var(--mono)] text-xs tracking-[0.06em] px-4 py-2.5 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
      >
        Import another file
      </button>
    </div>
  );
}

// ── Link import tab ───────────────────────────────────────────────────────────

function parseFragranceUrl(url: string): { name: string; house: string } | null {
  try {
    const parts = new URL(url).pathname.replace(/^\/+|\/+$/g, "").split("/");
    const toWords = (slug: string) =>
      slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    // Fragrantica: /perfume/{House}/{Name-ID}.html
    if (parts[0] === "perfume" && parts.length >= 3) {
      return {
        house: toWords(parts[1]),
        name: toWords(parts[2].replace(/\.html$/, "").replace(/-\d+$/, "")),
      };
    }
    // Parfumo: /fragrance/{house}/{name}
    if (parts[0] === "fragrance" && parts.length >= 3) {
      return { house: toWords(parts[1]), name: toWords(parts[2]) };
    }
  } catch { /* not a valid URL */ }
  return null;
}

function mkEditing(cf: CommunityFrag, userId: string, status: FragranceStatus): UserFragrance {
  return {
    id: "", fragranceId: cf.fragranceId, userId,
    name: cf.fragranceName, house: cf.fragranceHouse,
    status, sizes: ["Full Bottle" as BottleSize], type: null,
    personalRating: null, statusRating: null, whereBought: null,
    purchaseDate: null, purchaseMonth: null, purchaseYear: null,
    purchasePrice: null, isDupe: false, dupeFor: "",
    personalNotes: "", createdAt: "",
  };
}

function LinkImportTab({ userId }: { userId: string }) {
  const { communityFrags } = useData();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<CommunityFrag | "not-found" | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkResults, setBulkResults] = useState<CommunityFrag[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<FragranceStatus>("CURRENT");
  const [prefillFrag, setPrefillFrag] = useState<CommunityFrag | null>(null);

  const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

  function findCf(name: string, house: string) {
    return (
      communityFrags.find((cf) => norm(cf.fragranceName) === norm(name) && norm(cf.fragranceHouse) === norm(house)) ??
      communityFrags.find((cf) => norm(cf.fragranceName) === norm(name))
    );
  }

  function handleFetch() {
    const parsed = parseFragranceUrl(url.trim());
    if (!parsed) { setResult("not-found"); return; }
    setResult(findCf(parsed.name, parsed.house) ?? "not-found");
  }

  function handleImportSelected() {
    const names = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    setBulkResults(
      names.map((n) => communityFrags.find((cf) => norm(cf.fragranceName) === norm(n))).filter(Boolean) as CommunityFrag[]
    );
  }

  function openAdd(cf: CommunityFrag, status: FragranceStatus) {
    setPrefillFrag(cf);
    setFormStatus(status);
    setFormOpen(true);
  }

  return (
    <>
      {formOpen && prefillFrag && (
        <FragForm open onClose={() => setFormOpen(false)} editing={mkEditing(prefillFrag, userId, formStatus)} forceStatus={formStatus} />
      )}
      <div className="max-w-[520px]">
        <div className="flex gap-2 mb-4">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="https://www.fragrantica.com/perfume/..."
            className="flex-1 px-3 py-[9px] border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
          />
          <button
            onClick={handleFetch}
            className="font-[var(--mono)] text-xs tracking-[0.08em] px-4 py-[9px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors whitespace-nowrap"
          >
            FETCH METADATA
          </button>
        </div>

        {result === "not-found" && (
          <div className="font-[var(--mono)] text-xs text-[var(--rose-tk)] mb-5">
            Not found in database. Try the Search Database tab.
          </div>
        )}
        {result && result !== "not-found" && (
          <div className="border border-[var(--b2)] p-4 mb-5">
            <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.08em] uppercase mb-0.5">{result.fragranceHouse}</div>
            <div className="font-[var(--body)] text-sm text-[var(--ink)] mb-1">{result.fragranceName}</div>
            <div className="font-[var(--mono)] text-xs text-[var(--ink3)] mb-3">
              {[result.communityRating ? result.communityRating + "/10" : "", result.avgPrice ? result.avgPrice.replace(/~/g, "") : ""].filter(Boolean).join(" · ")}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openAdd(result as CommunityFrag, "WANT_TO_BUY")} className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[5px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors">Wishlist</button>
              <button onClick={() => openAdd(result as CommunityFrag, "CURRENT")} className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[5px] border border-[var(--blue)] text-[var(--blue)] hover:bg-[var(--blue-tint)] transition-colors">Add to Collection</button>
            </div>
          </div>
        )}

        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.08em] uppercase mb-2 mt-6">Bulk Search Queue</div>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={"Type fragrance name to queue for import..."}
          rows={5}
          className="w-full px-3 py-2 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)] resize-none mb-3"
        />
        <button
          onClick={handleImportSelected}
          className="font-[var(--mono)] text-xs tracking-[0.08em] px-4 py-2.5 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors mb-4"
        >
          IMPORT SELECTED
        </button>

        {bulkResults.length > 0 && (
          <div className="border border-[var(--b2)]">
            {bulkResults.map((cf) => (
              <div key={cf.fragranceId} className="flex items-center justify-between px-4 py-3 border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)]">
                <div className="min-w-0 mr-4">
                  <div className="font-[var(--body)] text-sm text-[var(--ink)]">{cf.fragranceName}</div>
                  <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{cf.fragranceHouse}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openAdd(cf, "WANT_TO_BUY")} className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[5px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors">Wishlist</button>
                  <button onClick={() => openAdd(cf, "CURRENT")} className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[5px] border border-[var(--blue)] text-[var(--blue)] hover:bg-[var(--blue-tint)] transition-colors">Add</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Scan tab ──────────────────────────────────────────────────────────────────

function ScanTab({ userId }: { userId: string }) {
  const { communityFrags } = useData();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [prefillFrag, setPrefillFrag] = useState<CommunityFrag | null>(null);

  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch { /* camera unavailable */ }
  }

  function stopCamera() {
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setCameraActive(false);
  }

  const results = search.trim().length >= 2
    ? communityFrags.filter(
        (cf) => cf.fragranceName.toLowerCase().includes(search.toLowerCase()) || cf.fragranceHouse.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10)
    : [];

  return (
    <>
      {formOpen && prefillFrag && (
        <FragForm open onClose={() => setFormOpen(false)} editing={mkEditing(prefillFrag, userId, "CURRENT")} />
      )}
      <div className="max-w-[560px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Or search by name..."
          className="w-full px-3 py-[9px] mb-4 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
        />
        {results.length > 0 && (
          <div className="border border-[var(--b2)] mb-5">
            {results.map((cf) => (
              <div key={cf.fragranceId} className="flex items-center justify-between px-4 py-3 border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)]">
                <div className="min-w-0 mr-4">
                  <div className="font-[var(--body)] text-sm text-[var(--ink)]">{cf.fragranceName}</div>
                  <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{cf.fragranceHouse}</div>
                </div>
                <button onClick={() => { setPrefillFrag(cf); setFormOpen(true); }} className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[5px] border border-[var(--blue)] text-[var(--blue)] hover:bg-[var(--blue-tint)] transition-colors shrink-0">Add</button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-px bg-[var(--b2)] border border-[var(--b2)]">
          {/* Open Webcam */}
          <div className="bg-[var(--off)] p-4 flex flex-col gap-2">
            <div className="font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink)] mb-1">Open Webcam</div>
            <div className="font-[var(--mono)] text-[10px] tracking-[0.06em] uppercase text-[var(--ink4)] mb-2">Point at Bottle Label</div>
            {cameraActive ? (
              <>
                <video ref={videoRef} className="w-full aspect-video bg-black object-cover mb-2" autoPlay playsInline muted />
                <button onClick={stopCamera} className="font-[var(--mono)] text-xs tracking-[0.08em] px-3 py-2 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors">STOP CAMERA</button>
              </>
            ) : (
              <button onClick={startCamera} className="font-[var(--mono)] text-xs tracking-[0.08em] px-3 py-2 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors">OPEN CAMERA</button>
            )}
          </div>
          {/* Scan with Phone */}
          <div className="bg-[var(--off)] p-4 flex flex-col gap-2">
            <div className="font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink)] mb-1">Scan with Phone</div>
            <div className="font-[var(--mono)] text-[10px] tracking-[0.06em] uppercase text-[var(--ink4)] mb-2">Open on Mobile</div>
            <div className="w-[72px] h-[72px] bg-[var(--b1)] border border-[var(--b3)] flex items-center justify-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="2" y="2" width="16" height="16" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-[var(--ink3)]"/>
                <rect x="5" y="5" width="10" height="10" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="38" y="2" width="16" height="16" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-[var(--ink3)]"/>
                <rect x="41" y="5" width="10" height="10" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="2" y="38" width="16" height="16" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-[var(--ink3)]"/>
                <rect x="5" y="41" width="10" height="10" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="22" y="4" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="27" y="4" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="22" y="9" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="27" y="14" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="22" y="22" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="27" y="22" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="32" y="22" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="22" y="27" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="32" y="32" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="37" y="27" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="42" y="32" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="47" y="22" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="47" y="27" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="4" y="22" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="4" y="27" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="9" y="22" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="14" y="27" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="4" y="47" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="9" y="47" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="22" y="38" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="27" y="43" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="32" y="47" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="37" y="42" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="42" y="47" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
                <rect x="47" y="42" width="3" height="3" fill="currentColor" className="text-[var(--ink3)]"/>
              </svg>
            </div>
            <div className="font-[var(--mono)] text-[10px] text-[var(--ink4)]">tesknota.pages.dev</div>
          </div>
          {/* Upload Photo */}
          <div className="bg-[var(--off)] p-4 flex flex-col gap-2">
            <div className="font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink)] mb-1">Upload Photo</div>
            <div className="font-[var(--mono)] text-[10px] tracking-[0.06em] uppercase text-[var(--ink4)] mb-2">From Camera Roll</div>
            <button onClick={() => fileRef.current?.click()} className="font-[var(--mono)] text-xs tracking-[0.08em] px-3 py-2 border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors">CHOOSE PHOTO</button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" />
          </div>
        </div>
      </div>
    </>
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
                  className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[5px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors whitespace-nowrap"
                >
                  Wishlist
                </button>
                <button
                  onClick={() => openAddForm(cf, "CURRENT")}
                  className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[5px] border border-[var(--blue)] text-[var(--blue)] hover:bg-[var(--blue-tint)] transition-colors whitespace-nowrap"
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

type ImportTabId = "link" | "scan" | "search" | "csv";

const IMPORT_TABS: { id: ImportTabId; label: string }[] = [
  { id: "link", label: "Paste a Link" },
  { id: "scan", label: "Scan a Bottle" },
  { id: "search", label: "Search Database" },
  { id: "csv", label: "Import File" },
];

export default function ImportPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<ImportTabId>("link");

  return (
    <>
      <Topbar title="Import" />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:p-[26px]">
        <div className="flex gap-0 border-b border-[var(--b2)] mb-6 max-w-[820px] overflow-x-auto">
          {IMPORT_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`font-[var(--mono)] text-xs tracking-[0.1em] uppercase px-4 py-2 border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? "border-[var(--blue)] text-[var(--blue)]" : "border-transparent text-[var(--ink3)] hover:text-[var(--ink)]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "link" && <LinkImportTab userId={user?.id ?? ""} />}
        {activeTab === "scan" && <ScanTab userId={user?.id ?? ""} />}
        {activeTab === "search" && <SearchTab userId={user?.id ?? ""} />}
        {activeTab === "csv" && <CSVImportTab userId={user?.id ?? ""} />}
      </main>
    </>
  );
}
