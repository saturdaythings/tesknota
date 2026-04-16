"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FragForm } from "@/components/ui/frag-form";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { appendFrag, enrichFragranceCommunityData } from "@/lib/data/mutations";
import type { FragranceStatus, FragranceType, BottleSize, UserFragrance, CommunityFrag } from "@/types";

// ── Constants (preserved) ─────────────────────────────────

const STATUS_VALUES = ["CURRENT", "PREVIOUSLY_OWNED", "WANT_TO_BUY", "WANT_TO_SMELL", "DONT_LIKE", "WANT_TO_IDENTIFY", "FINISHED"];
const TYPE_VALUES = ["Extrait de Parfum", "Eau de Parfum", "Eau de Toilette", "Cologne", "Perfume Concentré", "Body Spray", "Perfume Oil", "Other"];
const SIZE_VALUES = ["Sample", "Travel", "Full Bottle", "Decant"];
const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Template download (preserved) ────────────────────────

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
  ["Sizes", `One or more of: ${SIZE_VALUES.join(", ")} — separate multiple with semicolons`],
  ["Personal Rating", "Your personal rating: 1, 2, 3, 4, or 5"],
  ["Where Bought", "e.g. Sephora, Fragrantica, eBay"],
  ["Purchase Month", "Month abbreviation (Jan, Feb, Mar...) or number (01, 02, 03...)"],
  ["Purchase Year", "4-digit year, e.g. 2023"],
  ["Purchase Price", "e.g. $120 or 120"],
  ["Personal Notes", "Your impressions, memories, context — free text"],
  [""],
  ["COMMUNITY DATA (fragrance facts)"],
  ["Top Notes", "Top notes separated by semicolons"],
  ["Middle Notes", "Heart notes separated by semicolons"],
  ["Base Notes", "Base notes separated by semicolons"],
  ["Accords", "Main accords separated by semicolons"],
  ["Avg Price", "Average retail price, e.g. $250"],
  ["Community Rating", "Rating out of 10, e.g. 8.5"],
  ["Parfumo Rating", "Parfumo.com rating if known"],
  ["Longevity", "e.g. Long-lasting, Moderate, Weak"],
  ["Sillage", "e.g. Enormous, Heavy, Moderate, Soft, Intimate"],
];

const DATA_HEADERS = [
  "Name", "House", "Status", "Type", "Sizes",
  "Personal Rating (1-5)", "Where Bought", "Purchase Month", "Purchase Year", "Purchase Price", "Personal Notes",
  "Top Notes", "Middle Notes", "Base Notes", "Accords",
  "Avg Price", "Community Rating", "Parfumo Rating", "Longevity", "Sillage",
];

const EXAMPLE_ROW = [
  "Baccarat Rouge 540", "Maison Francis Kurkdjian", "CURRENT", "Eau de Parfum", "Full Bottle",
  "5", "Sephora", "Mar", "2023", "$320", "My signature scent",
  "Saffron;Jasmine", "Amberwood;Ambergris", "Fir Resin;Cedar", "Woody;Sweet;Musky",
  "~$250", "8.9", "8.7", "Long-lasting", "Enormous",
];

function downloadXLSXTemplate() {
  const wb = XLSX.utils.book_new();
  const wsInstructions = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);
  wsInstructions["!cols"] = [{ wch: 28 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");
  const wsData = XLSX.utils.aoa_to_sheet([DATA_HEADERS, EXAMPLE_ROW]);
  wsData["!cols"] = DATA_HEADERS.map((h) => ({
    wch: Math.max(h.length + 2, h.includes("Notes") ? 30 : 18),
  }));
  XLSX.utils.book_append_sheet(wb, wsData, "Import Data");
  XLSX.writeFile(wb, "tesknota-import-template.xlsx");
}

// ── Parse helpers (preserved) ────────────────────────────

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
  rowError?: string;
}

// ── Column mapping types ──────────────────────────────────

type MappingKey = "name" | "brand" | "status" | "size" | "rating" | "price" | "notes";

const MAPPING_FIELDS: { key: MappingKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "brand", label: "Brand" },
  { key: "status", label: "Status" },
  { key: "size", label: "Size" },
  { key: "rating", label: "Rating" },
  { key: "price", label: "Price" },
  { key: "notes", label: "Notes" },
];

type ColumnMapping = Record<MappingKey, string>;

function autoDetectMapping(headers: string[]): ColumnMapping {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const find = (...terms: string[]): string => {
    for (const term of terms) {
      const h = headers.find((hdr) => norm(hdr).includes(norm(term)));
      if (h) return h;
    }
    return "";
  };
  return {
    name: find("name", "fragrance"),
    brand: find("house", "brand"),
    status: find("status"),
    size: find("size"),
    rating: find("personalrating", "rating"),
    price: find("purchaseprice", "price"),
    notes: find("personalnotes", "notes"),
  };
}

function buildRows(headers: string[], rawRows: string[][], mapping: ColumnMapping): ParsedRow[] {
  const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hi = (search: string) => headers.findIndex((h) => norm(h).includes(norm(search)));

  const colIdx = (header: string): number =>
    header ? headers.indexOf(header) : -1;

  const nameIdx = colIdx(mapping.name);
  const brandIdx = colIdx(mapping.brand);
  const statusIdx = colIdx(mapping.status);
  const sizeIdx = colIdx(mapping.size);
  const ratingIdx = colIdx(mapping.rating);
  const priceIdx = colIdx(mapping.price);
  const notesIdx = colIdx(mapping.notes);

  // Auto-detect community fields
  const topIdx = hi("topnote") >= 0 ? hi("topnote") : hi("top");
  const midIdx = hi("middlenote") >= 0 ? hi("middlenote") : hi("middle");
  const baseIdx = hi("basenote") >= 0 ? hi("basenote") : hi("base");
  const accordIdx = hi("accord");
  const avgPriceIdx = hi("avgprice") >= 0 ? hi("avgprice") : hi("averageprice");
  const commRatingIdx = hi("communityrating");
  const parfumoIdx = hi("parfumorating");
  const longevityIdx = hi("longevity");
  const sillageIdx = hi("sillage");
  // Also try auto-detect for month/year/type/whereBought
  const monthIdx = hi("month");
  const yearIdx = hi("year");
  const typeIdx = hi("type");
  const whereIdx = hi("bought") >= 0 ? hi("bought") : hi("where");

  const get = (row: string[], i: number) =>
    (i >= 0 && i < row.length ? row[i] : "").trim();

  return rawRows
    .filter((r) => r.some((c) => String(c).trim()))
    .map((row) => {
      const name = get(row, nameIdx);
      const rowError = !name ? "Name is required" : undefined;

      const rawStatus = get(row, statusIdx).toUpperCase();
      const status = STATUS_VALUES.includes(rawStatus)
        ? (rawStatus as FragranceStatus)
        : "CURRENT";

      const rawType = get(row, typeIdx);
      const type = TYPE_VALUES.includes(rawType) ? (rawType as FragranceType) : null;

      const rawSizes = get(row, sizeIdx);
      const sizes = rawSizes
        ? (splitList(rawSizes).filter((s) => SIZE_VALUES.includes(s)) as BottleSize[])
        : [];

      const rawRating = get(row, ratingIdx);
      const personalRating = rawRating
        ? Math.min(5, Math.max(1, parseInt(rawRating) || 0)) || null
        : null;

      const topNotes = splitList(get(row, topIdx));
      const middleNotes = splitList(get(row, midIdx));
      const baseNotes = splitList(get(row, baseIdx));
      const accords = splitList(get(row, accordIdx));
      const avgPrice = get(row, avgPriceIdx);
      const communityRating = get(row, commRatingIdx);
      const parfumoRating = get(row, parfumoIdx);
      const longevity = get(row, longevityIdx);
      const sillage = get(row, sillageIdx);

      return {
        name,
        house: get(row, brandIdx),
        status,
        type,
        sizes,
        personalRating,
        whereBought: get(row, whereIdx) || null,
        purchaseMonth: normalizeMonth(get(row, monthIdx)) || null,
        purchaseYear: get(row, yearIdx) || null,
        purchasePrice: get(row, priceIdx) || null,
        personalNotes: get(row, notesIdx),
        topNotes, middleNotes, baseNotes, accords,
        avgPrice, communityRating, parfumoRating, longevity, sillage,
        hasCommunityData: !!(
          topNotes.length || middleNotes.length || baseNotes.length ||
          accords.length || avgPrice || communityRating || parfumoRating ||
          longevity || sillage
        ),
        rowError,
      };
    });
}

function parseFileRaw(file: File): Promise<{ headers: string[]; rawRows: string[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const sheetName =
          wb.SheetNames.find((n) =>
            n.toLowerCase().includes("import") || n.toLowerCase().includes("data"),
          ) ??
          wb.SheetNames.find((n) => !n.toLowerCase().includes("instruction")) ??
          wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        const aoa: string[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          raw: false,
          defval: "",
        }) as string[][];

        let headerIdx = 0;
        for (let i = 0; i < Math.min(aoa.length, 10); i++) {
          const first = (aoa[i][0] ?? "").toString().toLowerCase().trim();
          if (first === "name" || first === "fragrance name" || first === "fragrance") {
            headerIdx = i;
            break;
          }
        }

        const headers = aoa[headerIdx].map((h) => String(h)).filter(Boolean);
        const rawRows = aoa
          .slice(headerIdx + 1)
          .map((r) => r.map(String));

        resolve({ headers, rawRows });
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ── Import runner (preserved logic) ──────────────────────

async function runImport(
  rows: ParsedRow[],
  userId: string,
  addFrag: (f: UserFragrance) => Promise<void>,
  onProgress: (n: number) => void,
): Promise<string[]> {
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.rowError || !row.name) {
      errors.push(`Row ${i + 1}: ${row.rowError ?? "no name"}`);
      onProgress(i + 1);
      continue;
    }
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
      await addFrag({ ...frag, id, fragranceId: fragranceId ?? null });
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
      errors.push(row.name + ": " + (e instanceof Error ? e.message : "failed"));
    }
    onProgress(i + 1);
  }
  return errors;
}

// ── Upload zone ────────────────────────────────────────────

interface UploadZoneProps {
  onFile: (file: File) => void;
}

function UploadZone({ onFile }: UploadZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <Card
      padding="var(--space-8)"
      style={{
        border: `2px dashed ${dragging ? "var(--color-accent)" : "var(--color-border)"}`,
        background: dragging ? "var(--color-accent-subtle)" : "var(--color-bg)",
        boxShadow: "none",
        transition: "border-color var(--transition-base), background var(--transition-base)",
        cursor: "pointer",
      }}
      className="text-center"
      onClick={() => fileRef.current?.click()}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-4)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload size={40} aria-hidden="true" style={{ color: "var(--color-text-muted)" }} />
        <div>
          <div className="text-subheading" style={{ marginBottom: "var(--space-1)" }}>
            Drop your file here
          </div>
          <div className="text-secondary">or</div>
        </div>
        <Button
          variant="secondary"
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
        >
          Browse Files
        </Button>
        <span className="text-meta" style={{ color: "var(--color-text-muted)" }}>
          Supports .xlsx and .csv files
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.csv"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </Card>
  );
}

// ── Column mapping ─────────────────────────────────────────

interface MappingCardProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (key: MappingKey, value: string) => void;
  onPreview: () => void;
}

function MappingCard({ headers, mapping, onChange, onPreview }: MappingCardProps) {
  const headerOptions = [
    ...headers.map((h) => ({ value: h, label: h })),
  ];

  return (
    <Card padding="var(--space-6)">
      <h2 className="text-subheading" style={{ marginBottom: "var(--space-5)" }}>
        Map Your Columns
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        {MAPPING_FIELDS.map(({ key, label }) => (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
            }}
          >
            <span
              className="text-label"
              style={{ width: 80, flexShrink: 0 }}
            >
              {label}
            </span>
            <div style={{ flex: 1, maxWidth: 320 }}>
              <Select
                options={headerOptions}
                value={mapping[key]}
                onChange={(v) => onChange(key, v)}
                placeholder="Skip this field"
              />
            </div>
          </div>
        ))}
      </div>
      <Button variant="primary" onClick={onPreview}>
        Preview Import
      </Button>
    </Card>
  );
}

// ── Preview table ─────────────────────────────────────────

interface PreviewCardProps {
  rows: ParsedRow[];
  totalRows: number;
  onBack: () => void;
  onImport: () => void;
}

function PreviewCard({ rows, totalRows, onBack, onImport }: PreviewCardProps) {
  const preview = rows.slice(0, 5);
  const validCount = rows.filter((r) => !r.rowError).length;

  return (
    <Card padding="var(--space-6)">
      <h2 className="text-subheading" style={{ marginBottom: "var(--space-4)" }}>
        Preview (first 5 rows)
      </h2>
      <div style={{ overflowX: "auto", marginBottom: "var(--space-4)" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "var(--color-surface-raised)" }}>
              {["Name", "Brand", "Status", "Rating", "Price", "Error"].map((h) => (
                <th
                  key={h}
                  className="text-label"
                  style={{
                    padding: "var(--space-3) var(--space-4)",
                    textAlign: "left",
                    fontWeight: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr
                key={i}
                style={{ borderBottom: "1px solid var(--color-border)" }}
                className="hover:bg-[var(--color-surface-raised)]"
              >
                <td className="text-body" style={{ padding: "var(--space-3) var(--space-4)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.name || "—"}
                </td>
                <td className="text-secondary" style={{ padding: "var(--space-3) var(--space-4)", whiteSpace: "nowrap" }}>
                  {row.house || "—"}
                </td>
                <td className="text-secondary" style={{ padding: "var(--space-3) var(--space-4)", whiteSpace: "nowrap" }}>
                  {row.status}
                </td>
                <td className="text-secondary" style={{ padding: "var(--space-3) var(--space-4)" }}>
                  {row.personalRating ?? "—"}
                </td>
                <td className="text-secondary" style={{ padding: "var(--space-3) var(--space-4)" }}>
                  {row.purchasePrice ?? "—"}
                </td>
                <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                  {row.rowError ? (
                    <span
                      title={row.rowError}
                      aria-label={row.rowError}
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "var(--radius-full)",
                        background: "var(--color-danger)",
                        cursor: "help",
                      }}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-secondary" style={{ marginBottom: "var(--space-4)" }}>
        {validCount} row{validCount !== 1 ? "s" : ""} will be imported
        {totalRows > 5 ? ` (showing first 5 of ${totalRows})` : ""}
      </p>
      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={onImport} disabled={validCount === 0}>
          Import {validCount} Fragrance{validCount !== 1 ? "s" : ""}
        </Button>
      </div>
    </Card>
  );
}

// ── Progress card ─────────────────────────────────────────

function ProgressCard({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Card padding="var(--space-6)">
      <div
        style={{
          height: 8,
          background: "var(--color-surface-raised)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
          marginBottom: "var(--space-3)",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "var(--color-accent)",
            borderRadius: "var(--radius-full)",
            width: `${pct}%`,
            transition: "width var(--transition-slow)",
          }}
        />
      </div>
      <p className="text-secondary">Importing... {done} of {total}</p>
    </Card>
  );
}

// ── Done card ─────────────────────────────────────────────

function DoneCard({
  added,
  errors,
  onReset,
}: {
  added: number;
  errors: string[];
  onReset: () => void;
}) {
  const router = useRouter();
  return (
    <Card padding="var(--space-6)">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "var(--space-4)",
        }}
      >
        <CheckCircle
          size={32}
          aria-hidden="true"
          style={{ color: "var(--color-success)" }}
        />
        <h2 className="text-subheading">
          Import complete — {added} fragrance{added !== 1 ? "s" : ""} added.
        </h2>
        {errors.length > 0 && (
          <div
            style={{
              background: "var(--color-danger-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3) var(--space-4)",
              width: "100%",
            }}
          >
            <p
              className="text-secondary"
              style={{ color: "var(--color-danger)", marginBottom: "var(--space-2)" }}
            >
              {errors.length} row{errors.length !== 1 ? "s" : ""} failed:
            </p>
            {errors.map((e, i) => (
              <p key={i} className="text-meta" style={{ color: "var(--color-danger)" }}>
                {e}
              </p>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <Button variant="primary" onClick={() => router.push("/collection")}>
            View Collection
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Import Another File
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Error card ────────────────────────────────────────────

function ErrorCard({ onReset }: { onReset: () => void }) {
  return (
    <Card padding="var(--space-6)">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "var(--space-4)",
        }}
      >
        <AlertTriangle
          size={32}
          aria-hidden="true"
          style={{ color: "var(--color-danger)" }}
        />
        <p className="text-secondary">
          Could not read file. Please check format.
        </p>
        <Button variant="secondary" onClick={onReset}>
          Try Again
        </Button>
      </div>
    </Card>
  );
}

// ── Search tab ────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: 460,
  padding: "9px 12px",
  border: "1px solid var(--color-sand-light)",
  background: "#FFFFFF",
  fontFamily: "var(--font-sans)",
  fontSize: "14px",
  color: "var(--color-navy)",
  outline: "none",
  borderRadius: 0,
};

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

  const editing = prefillFrag ? {
    id: "", fragranceId: prefillFrag.fragranceId, userId,
    name: prefillFrag.fragranceName, house: prefillFrag.fragranceHouse,
    status: formStatus, sizes: ["Full Bottle" as const], type: null,
    personalRating: null, statusRating: null, whereBought: null,
    purchaseDate: null, purchaseMonth: null, purchaseYear: null,
    purchasePrice: null, isDupe: false, dupeFor: "",
    personalNotes: "", createdAt: "",
  } : null;

  return (
    <>
      {formOpen && editing && (
        <FragForm open onClose={() => setFormOpen(false)} editing={editing} forceStatus={formStatus} />
      )}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or house..."
        style={INPUT_STYLE}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-sand-light)"; }}
      />
      {search.trim().length >= 2 && results.length === 0 && (
        <p className="text-secondary" style={{ marginTop: "var(--space-3)" }}>No matches.</p>
      )}
      {results.length > 0 && (
        <div
          style={{
            border: "1px solid var(--color-sand-light)",
            maxWidth: 460,
            marginTop: "var(--space-4)",
          }}
        >
          {results.map((cf) => (
            <div
              key={cf.fragranceId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(217,206,188,0.5)",
              }}
              className="hover:bg-[var(--color-cream)]"
            >
              <div style={{ minWidth: 0, marginRight: 16, flex: 1 }}>
                <div className="text-body" style={{ fontSize: 14 }}>{cf.fragranceName}</div>
                <div className="text-secondary">
                  {cf.fragranceHouse}
                  {cf.avgPrice ? ` · ${cf.avgPrice.replace(/~/g, "")}` : ""}
                  {cf.communityRating ? ` · ${cf.communityRating}/10` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => { setPrefillFrag(cf); setFormStatus("WANT_TO_BUY"); setFormOpen(true); }}
                  style={{
                    fontFamily: "var(--font-sans)", fontSize: 12, padding: "5px 12px",
                    border: "1px solid var(--color-sand-light)", background: "transparent",
                    color: "var(--color-navy-mid)", cursor: "pointer", borderRadius: 2,
                    whiteSpace: "nowrap", transition: "border-color 120ms, color 120ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-sand-light)"; e.currentTarget.style.color = "var(--color-navy-mid)"; }}
                >
                  Wishlist
                </button>
                <button
                  onClick={() => { setPrefillFrag(cf); setFormStatus("CURRENT"); setFormOpen(true); }}
                  style={{
                    fontFamily: "var(--font-sans)", fontSize: 12, padding: "5px 12px",
                    border: "1px solid var(--color-accent)", background: "transparent",
                    color: "var(--color-accent)", cursor: "pointer", borderRadius: 2,
                    whiteSpace: "nowrap", transition: "background 120ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-subtle)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
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

// ── Link tab ───────────────────────────────────────────────

function parseFragranceUrl(url: string): { name: string; house: string } | null {
  try {
    const parts = new URL(url).pathname.replace(/^\/+|\/+$/g, "").split("/");
    const toWords = (slug: string) =>
      slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (parts[0] === "perfume" && parts.length >= 3) {
      return {
        house: toWords(parts[1]),
        name: toWords(parts[2].replace(/\.html$/, "").replace(/-\d+$/, "")),
      };
    }
    if (parts[0] === "fragrance" && parts.length >= 3) {
      return { house: toWords(parts[1]), name: toWords(parts[2]) };
    }
  } catch { /* not a valid URL */ }
  return null;
}

function LinkTab({ userId }: { userId: string }) {
  const { communityFrags } = useData();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<CommunityFrag | "not-found" | null>(null);
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

  const editing = prefillFrag ? {
    id: "", fragranceId: prefillFrag.fragranceId, userId,
    name: prefillFrag.fragranceName, house: prefillFrag.fragranceHouse,
    status: formStatus, sizes: ["Full Bottle" as const], type: null,
    personalRating: null, statusRating: null, whereBought: null,
    purchaseDate: null, purchaseMonth: null, purchaseYear: null,
    purchasePrice: null, isDupe: false, dupeFor: "",
    personalNotes: "", createdAt: "",
  } : null;

  return (
    <>
      {formOpen && editing && (
        <FragForm open onClose={() => setFormOpen(false)} editing={editing} forceStatus={formStatus} />
      )}
      <div style={{ display: "flex", gap: 8, maxWidth: 520, marginBottom: "var(--space-4)" }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          placeholder="https://www.fragrantica.com/perfume/..."
          style={{ ...INPUT_STYLE, maxWidth: "none", flex: 1 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-sand-light)"; }}
        />
        <button
          onClick={handleFetch}
          style={{
            fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500,
            padding: "9px 16px", border: "1px solid var(--color-sand-light)",
            background: "transparent", color: "var(--color-navy-mid)", cursor: "pointer",
            borderRadius: 2, whiteSpace: "nowrap", transition: "border-color 120ms, color 120ms",
            letterSpacing: "0.06em",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-sand-light)"; e.currentTarget.style.color = "var(--color-navy-mid)"; }}
        >
          Fetch
        </button>
      </div>

      {result === "not-found" && (
        <p className="text-secondary" style={{ color: "var(--color-danger)", marginBottom: "var(--space-4)" }}>
          Not found in database. Try Search Database tab.
        </p>
      )}
      {result && result !== "not-found" && (
        <div
          style={{
            border: "1px solid var(--color-sand-light)",
            padding: "16px",
            maxWidth: 460,
            marginBottom: "var(--space-5)",
          }}
        >
          <div className="text-secondary" style={{ marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>
            {result.fragranceHouse}
          </div>
          <div className="text-body" style={{ marginBottom: 4 }}>{result.fragranceName}</div>
          <div className="text-secondary" style={{ marginBottom: 12 }}>
            {[result.communityRating ? result.communityRating + "/10" : "", result.avgPrice ? result.avgPrice.replace(/~/g, "") : ""].filter(Boolean).join(" · ")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setPrefillFrag(result as CommunityFrag); setFormStatus("WANT_TO_BUY"); setFormOpen(true); }}
              style={{
                fontFamily: "var(--font-sans)", fontSize: 12, padding: "5px 12px",
                border: "1px solid var(--color-sand-light)", background: "transparent",
                color: "var(--color-navy-mid)", cursor: "pointer", borderRadius: 2,
                transition: "border-color 120ms, color 120ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-sand-light)"; e.currentTarget.style.color = "var(--color-navy-mid)"; }}
            >
              Wishlist
            </button>
            <button
              onClick={() => { setPrefillFrag(result as CommunityFrag); setFormStatus("CURRENT"); setFormOpen(true); }}
              style={{
                fontFamily: "var(--font-sans)", fontSize: 12, padding: "5px 12px",
                border: "1px solid var(--color-accent)", background: "transparent",
                color: "var(--color-accent)", cursor: "pointer", borderRadius: 2,
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-subtle)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Add to Collection
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────

type ImportTabId = "search" | "link" | "file";
type PageState = "idle" | "mapping" | "preview" | "importing" | "done" | "error";

const TAB_ITEMS: { id: ImportTabId; label: string }[] = [
  { id: "search", label: "Search Database" },
  { id: "link", label: "Paste a Link" },
  { id: "file", label: "Import File" },
];

export default function ImportPage() {
  const { user } = useUser();
  const { addFrag } = useData();

  const [activeTab, setActiveTab] = useState<ImportTabId>("search");
  const [state, setState] = useState<PageState>("idle");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: "", brand: "", status: "", size: "", rating: "", price: "", notes: "",
  });
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [addedCount, setAddedCount] = useState(0);

  async function handleFile(file: File) {
    try {
      const { headers: h, rawRows: rr } = await parseFileRaw(file);
      const autoMapping = autoDetectMapping(h);
      setHeaders(h);
      setRawRows(rr);
      setMapping(autoMapping);
      setState("mapping");
    } catch {
      setState("error");
    }
  }

  function handleMappingChange(key: MappingKey, value: string) {
    setMapping((prev) => ({ ...prev, [key]: value }));
  }

  function handlePreview() {
    const built = buildRows(headers, rawRows, mapping);
    setRows(built);
    setState("preview");
  }

  async function handleImport() {
    if (!user) return;
    setState("importing");
    setProgress(0);
    const validRows = rows.filter((r) => !r.rowError && r.name);
    const errs = await runImport(
      validRows,
      user.id,
      addFrag,
      (n) => setProgress(n),
    );
    setImportErrors(errs);
    setAddedCount(validRows.length - errs.length);
    setState("done");
  }

  function reset() {
    setHeaders([]);
    setRawRows([]);
    setMapping({ name: "", brand: "", status: "", size: "", rating: "", price: "", notes: "" });
    setRows([]);
    setProgress(0);
    setImportErrors([]);
    setAddedCount(0);
    setState("idle");
  }

  return (
    <>
      <Topbar title="Import" />
      <main style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto",
            padding: "var(--space-8)",
          }}
          className="max-sm:px-[var(--space-4)] max-sm:py-[var(--space-4)]"
        >
          {/* Page header */}
          <h1 className="text-page-title" style={{ marginBottom: "var(--space-6)" }}>
            Add Fragrances
          </h1>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--color-sand-light)",
              marginBottom: "var(--space-6)",
              overflowX: "auto",
            }}
          >
            {TAB_ITEMS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); if (t.id !== "file") setState("idle"); }}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "10px 18px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === t.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                  color: activeTab === t.id ? "var(--color-accent)" : "var(--color-navy-mid)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  marginBottom: -1,
                  transition: "color 120ms, border-color 120ms",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search tab */}
          {activeTab === "search" && (
            <SearchTab userId={user?.id ?? ""} />
          )}

          {/* Link tab */}
          {activeTab === "link" && (
            <LinkTab userId={user?.id ?? ""} />
          )}

          {/* File import tab */}
          {activeTab === "file" && (
            <>
              {state === "idle" && (
                <>
                  <p className="text-secondary" style={{ marginBottom: "var(--space-6)" }}>
                    Need a template?{" "}
                    <button
                      onClick={downloadXLSXTemplate}
                      style={{
                        background: "none", border: "none", padding: 0,
                        color: "var(--color-accent)", cursor: "pointer",
                        textDecoration: "underline", fontSize: "inherit", fontFamily: "inherit",
                      }}
                    >
                      Download .xlsx template
                    </button>
                  </p>
                  <UploadZone onFile={handleFile} />
                </>
              )}
              {state === "mapping" && (
                <MappingCard
                  headers={headers}
                  mapping={mapping}
                  onChange={handleMappingChange}
                  onPreview={handlePreview}
                />
              )}
              {state === "preview" && (
                <PreviewCard
                  rows={rows}
                  totalRows={rows.length}
                  onBack={() => setState("mapping")}
                  onImport={handleImport}
                />
              )}
              {state === "importing" && (
                <ProgressCard done={progress} total={rows.filter((r) => !r.rowError && r.name).length} />
              )}
              {state === "done" && (
                <DoneCard added={addedCount} errors={importErrors} onReset={reset} />
              )}
              {state === "error" && <ErrorCard onReset={reset} />}
            </>
          )}
        </div>
      </main>
    </>
  );
}
