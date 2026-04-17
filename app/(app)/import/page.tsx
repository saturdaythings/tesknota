"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { usePathname } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContent } from "@/components/layout/PageContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabPill } from "@/components/ui/tab-pill";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { appendFrag } from "@/lib/data/mutations";
import { useToast } from "@/components/ui/toast";
import type { FragranceStatus, FragranceType, BottleSize, UserFragrance, CommunityFrag } from "@/types";

// ── Constants ──────────────────────────────────────────────

const STATUS_VALUES = ["CURRENT", "PREVIOUSLY_OWNED", "WANT_TO_BUY", "WANT_TO_SMELL", "DONT_LIKE", "WANT_TO_IDENTIFY", "FINISHED"];
const TYPE_VALUES = ["Extrait de Parfum", "Eau de Parfum", "Eau de Toilette", "Cologne", "Perfume Concentré", "Body Spray", "Perfume Oil", "Other"];
const SIZE_VALUES = ["Sample", "Travel", "Full Bottle", "Decant"];
const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Template download ──────────────────────────────────────

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

// ── CSV parse helpers ──────────────────────────────────────

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

type MappingKey = "name" | "brand" | "status" | "size" | "rating" | "price" | "notes";
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
  const colIdx = (header: string): number => header ? headers.indexOf(header) : -1;

  const nameIdx = colIdx(mapping.name);
  const brandIdx = colIdx(mapping.brand);
  const statusIdx = colIdx(mapping.status);
  const sizeIdx = colIdx(mapping.size);
  const ratingIdx = colIdx(mapping.rating);
  const priceIdx = colIdx(mapping.price);
  const notesIdx = colIdx(mapping.notes);

  const topIdx = hi("topnote") >= 0 ? hi("topnote") : hi("top");
  const midIdx = hi("middlenote") >= 0 ? hi("middlenote") : hi("middle");
  const baseIdx = hi("basenote") >= 0 ? hi("basenote") : hi("base");
  const accordIdx = hi("accord");
  const avgPriceIdx = hi("avgprice") >= 0 ? hi("avgprice") : hi("averageprice");
  const commRatingIdx = hi("communityrating");
  const parfumoIdx = hi("parfumorating");
  const longevityIdx = hi("longevity");
  const sillageIdx = hi("sillage");
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
      const status = STATUS_VALUES.includes(rawStatus) ? (rawStatus as FragranceStatus) : "CURRENT";
      const rawType = get(row, typeIdx);
      const type = TYPE_VALUES.includes(rawType) ? (rawType as FragranceType) : null;
      const rawSizes = get(row, sizeIdx);
      const sizes = rawSizes ? (splitList(rawSizes).filter((s) => SIZE_VALUES.includes(s)) as BottleSize[]) : [];
      const rawRating = get(row, ratingIdx);
      const personalRating = rawRating ? Math.min(5, Math.max(1, parseInt(rawRating) || 0)) || null : null;
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
          wb.SheetNames.find((n) => n.toLowerCase().includes("import") || n.toLowerCase().includes("data")) ??
          wb.SheetNames.find((n) => !n.toLowerCase().includes("instruction")) ??
          wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const aoa: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }) as string[][];
        let headerIdx = 0;
        for (let i = 0; i < Math.min(aoa.length, 10); i++) {
          const first = (aoa[i][0] ?? "").toString().toLowerCase().trim();
          if (first === "name" || first === "fragrance name" || first === "fragrance") {
            headerIdx = i;
            break;
          }
        }
        const headers = aoa[headerIdx].map((h) => String(h)).filter(Boolean);
        const rawRows = aoa.slice(headerIdx + 1).map((r) => r.map(String));
        resolve({ headers, rawRows });
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ── URL parse helper ──────────────────────────────────────

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

// ── Frag builder ──────────────────────────────────────────

function cfToFrag(cf: CommunityFrag, userId: string, status: FragranceStatus): UserFragrance {
  return {
    id: "import-" + Date.now(),
    fragranceId: cf.fragranceId,
    userId,
    name: cf.fragranceName,
    house: cf.fragranceHouse,
    status,
    sizes: [],
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
    createdAt: new Date().toISOString(),
    wishlistPriority: null,
  };
}

// ── Tab 1: Paste a Link ───────────────────────────────────

interface ResultCardProps {
  cf: CommunityFrag;
  onAddCollection: () => void;
  onAddWishlist: () => void;
}

function ResultCard({ cf, onAddCollection, onAddWishlist }: ResultCardProps) {
  const pills: string[] = [
    ...(cf.fragranceAccords ?? []).slice(0, 3),
  ].filter(Boolean);

  return (
    <div style={{
      background: "var(--color-cream-dark)",
      border: "1px solid var(--color-row-divider)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-4)",
      marginTop: "var(--space-4)",
    }}>
      <div style={{
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: "var(--text-lg)",
        color: "var(--color-navy)",
        marginBottom: "var(--space-1)",
      }}>
        {cf.fragranceName}
      </div>
      <div style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-label)",
        letterSpacing: "var(--tracking-wide)",
        textTransform: "uppercase",
        color: "var(--color-meta-text)",
        marginBottom: "var(--space-3)",
      }}>
        {cf.fragranceHouse}
      </div>
      {pills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginBottom: "var(--space-3)" }}>
          {pills.map((p) => (
            <span key={p} style={{
              background: "var(--color-row-hover)",
              borderRadius: "var(--radius-full)",
              padding: "var(--space-half) var(--space-2)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-xs)",
              color: "var(--color-navy)",
            }}>
              {p}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <Button variant="secondary" onClick={onAddWishlist}>Add to Wishlist</Button>
        <Button variant="primary" onClick={onAddCollection}>Add to Collection</Button>
      </div>
    </div>
  );
}

interface LinkTabProps {
  userId: string;
  communityFrags: CommunityFrag[];
  onAddFrag: (f: UserFragrance) => Promise<void>;
}

function LinkTab({ userId, communityFrags, onAddFrag }: LinkTabProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommunityFrag | "not-found" | null>(null);
  const [queueInput, setQueueInput] = useState("");
  const [queue, setQueue] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

  function findCf(name: string, house: string): CommunityFrag | undefined {
    return (
      communityFrags.find((cf) => norm(cf.fragranceName) === norm(name) && norm(cf.fragranceHouse) === norm(house)) ??
      communityFrags.find((cf) => norm(cf.fragranceName) === norm(name))
    );
  }

  function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    // Simulate async (URL parse is sync but keep loading UX)
    setTimeout(() => {
      const parsed = parseFragranceUrl(url.trim());
      if (!parsed) {
        setLoading(false);
        setResult("not-found");
        toast("Could not fetch metadata for that URL.", "error");
        return;
      }
      const cf = findCf(parsed.name, parsed.house);
      setLoading(false);
      if (!cf) {
        setResult("not-found");
        toast("Could not fetch metadata for that URL.", "error");
      } else {
        setResult(cf);
      }
    }, 400);
  }

  async function handleAdd(cf: CommunityFrag, status: FragranceStatus) {
    const frag = cfToFrag(cf, userId, status);
    try {
      const { id, fragranceId } = await appendFrag(frag);
      await onAddFrag({ ...frag, id, fragranceId: fragranceId ?? null });
      toast(status === "WANT_TO_BUY" ? "Added to wishlist." : "Added to collection.", "success");
      setResult(null);
      setUrl("");
    } catch {
      toast("Could not add fragrance.", "error");
    }
  }

  function addToQueue() {
    const name = queueInput.trim();
    if (!name || queue.includes(name)) return;
    setQueue((q) => [...q, name]);
    setQueueInput("");
  }

  async function handleImportSelected() {
    if (!queue.length || importing) return;
    setImporting(true);
    let added = 0;
    for (const name of queue) {
      const cf = communityFrags.find((c) => norm(c.fragranceName) === norm(name)) ??
        communityFrags.find((c) => norm(c.fragranceName).includes(norm(name)));
      if (cf) {
        const frag = cfToFrag(cf, userId, "CURRENT");
        try {
          const { id, fragranceId } = await appendFrag(frag);
          await onAddFrag({ ...frag, id, fragranceId: fragranceId ?? null });
          added++;
        } catch { /* skip */ }
      }
    }
    setImporting(false);
    setQueue([]);
    toast(`${added} fragrance${added !== 1 ? "s" : ""} imported.`, "success");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Section 1: URL fetch */}
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="https://www.fragrantica.com/perfume/..."
          />
        </div>
        <Button
          variant="primary"
          onClick={handleFetch}
          disabled={loading}
          style={{ whiteSpace: "nowrap", letterSpacing: "var(--tracking-wide)" }}
        >
          FETCH METADATA
        </Button>
      </div>

      {loading && (
        <div style={{
          minHeight: "var(--size-row-min)",
          background: "var(--color-row-hover)",
          borderBottom: "1px solid var(--color-row-divider)",
          borderRadius: "var(--radius-md)",
        }} />
      )}

      {!loading && result && result !== "not-found" && (
        <ResultCard
          cf={result}
          onAddCollection={() => handleAdd(result, "CURRENT")}
          onAddWishlist={() => handleAdd(result, "WANT_TO_BUY")}
        />
      )}

      {/* Section 2: Bulk search queue */}
      <div style={{ marginTop: "var(--space-6)" }}>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-ui)",
          color: "var(--color-navy)",
          paddingBottom: "var(--space-2)",
          borderBottom: "1px solid var(--color-row-divider)",
          marginBottom: "var(--space-3)",
        }}>
          Bulk search queue
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <Input
              value={queueInput}
              onChange={(e) => setQueueInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addToQueue()}
              placeholder="Type fragrance name to queue for import..."
            />
          </div>
          <Button variant="secondary" onClick={addToQueue} style={{ whiteSpace: "nowrap" }}>
            Add to Queue
          </Button>
        </div>

        {queue.length > 0 && (
          <div style={{ marginTop: "var(--space-3)" }}>
            {queue.map((name) => (
              <div key={name} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: "var(--size-row-min)",
                borderBottom: "1px solid var(--color-row-divider)",
              }}>
                <span style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "var(--text-note)",
                  color: "var(--color-navy)",
                }}>
                  {name}
                </span>
                <Button variant="ghost" onClick={() => setQueue((q) => q.filter((n) => n !== name))}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
          <Button
            variant="primary"
            disabled={queue.length === 0 || importing}
            onClick={handleImportSelected}
            style={{ letterSpacing: "var(--tracking-wide)" }}
          >
            IMPORT SELECTED
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Scan a Bottle ──────────────────────────────────

interface ScanTabProps {
  userId: string;
  communityFrags: CommunityFrag[];
  onAddFrag: (f: UserFragrance) => Promise<void>;
}

function ScanTab({ userId, communityFrags, onAddFrag }: ScanTabProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [scanSearch, setScanSearch] = useState("");

  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}${pathname}?mobile=1`
    : `${pathname}?mobile=1`;

  const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      toast("Camera access denied or unavailable.", "error");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  function handlePhotoSelect(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  async function handleScanImage() {
    if (!photoFile) return;
    toast("Image scan not yet available.", "error");
  }

  const searchResults = scanSearch.trim().length >= 2
    ? communityFrags.filter(
        (cf) =>
          cf.fragranceName.toLowerCase().includes(scanSearch.toLowerCase()) ||
          cf.fragranceHouse.toLowerCase().includes(scanSearch.toLowerCase())
      ).slice(0, 20)
    : [];

  async function handleAdd(cf: CommunityFrag) {
    const frag = cfToFrag(cf, userId, "CURRENT");
    try {
      const { id, fragranceId } = await appendFrag(frag);
      await onAddFrag({ ...frag, id, fragranceId: fragranceId ?? null });
      toast("Added to collection.", "success");
    } catch {
      toast("Could not add fragrance.", "error");
    }
  }

  const columnStyle: React.CSSProperties = {
    background: "var(--color-cream-dark)",
    border: "1px solid var(--color-row-divider)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-6)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--space-3)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="scan-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--space-4)",
      }}>
        {/* Column 1: Webcam */}
        <div style={columnStyle}>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)" }}>
            Open Webcam
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
            POINT AT BOTTLE LABEL
          </span>
          {!cameraActive && (
            <Button variant="secondary" onClick={openCamera} style={{ width: "100%", letterSpacing: "var(--tracking-wide)" }}>
              OPEN CAMERA
            </Button>
          )}
          {cameraActive && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", borderRadius: "var(--radius-md)" }}
              />
              <Button variant="ghost" onClick={stopCamera} style={{ width: "100%" }}>
                Stop Camera
              </Button>
            </>
          )}
        </div>

        {/* Column 2: QR code */}
        <div style={columnStyle}>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)" }}>
            Scan with Phone
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
            OPEN ON MOBILE
          </span>
          <QRCodeSVG value={qrUrl} size={120} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", textAlign: "center", wordBreak: "break-all" }}>
            {qrUrl}
          </span>
        </div>

        {/* Column 3: Upload photo */}
        <div style={columnStyle}>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)" }}>
            Upload Photo
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
            FROM CAMERA ROLL
          </span>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} style={{ width: "100%", letterSpacing: "var(--tracking-wide)" }}>
            CHOOSE PHOTO
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handlePhotoSelect(e.target.files)}
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              style={{ width: "100%", borderRadius: "var(--radius-md)", objectFit: "cover", maxHeight: "160px" }}
            />
          )}
          {photoFile && (
            <Button variant="primary" onClick={handleScanImage} style={{ width: "100%", letterSpacing: "var(--tracking-wide)" }}>
              SCAN IMAGE
            </Button>
          )}
        </div>
      </div>

      {/* Search row */}
      <div style={{ marginTop: "var(--space-2)" }}>
        <Input
          value={scanSearch}
          onChange={(e) => setScanSearch(e.target.value)}
          placeholder="Or search by name..."
        />
        {searchResults.length > 0 && (
          <div style={{ marginTop: "var(--space-2)" }}>
            {searchResults.map((cf) => (
              <div key={cf.fragranceId} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: "var(--size-row-min)",
                borderBottom: "1px solid var(--color-row-divider)",
                gap: "var(--space-3)",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)" }}>
                    {cf.fragranceName}
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
                    {cf.fragranceHouse}
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => handleAdd(cf)}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 3: CSV ────────────────────────────────────────────

interface CsvTabProps {
  userId: string;
  onAddFrag: (f: UserFragrance) => Promise<void>;
}

function CsvTab({ userId, onAddFrag }: CsvTabProps) {
  const { toast } = useToast();
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleFile(file: File) {
    try {
      const { headers, rawRows } = await parseFileRaw(file);
      const mapping = autoDetectMapping(headers);
      const parsed = buildRows(headers, rawRows, mapping);
      setFileName(file.name);
      setRows(parsed);
    } catch {
      toast("Could not read file. Please check the format.", "error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleImportAll() {
    if (!rows || importing) return;
    setImporting(true);
    const valid = rows.filter((r) => !r.rowError && r.name);
    let added = 0;
    const run = async () => {
      for (let i = 0; i < valid.length; i++) {
        const row = valid[i];
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
          wishlistPriority: null,
        };
        try {
          const { id, fragranceId } = await appendFrag(frag);
          await onAddFrag({ ...frag, id, fragranceId: fragranceId ?? null });
          added++;
        } catch { /* skip */ }
      }
      setImporting(false);
      toast(`${added} fragrance${added !== 1 ? "s" : ""} imported.`, "success");
      setRows(null);
      setFileName(null);
    };
    run();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Drop zone */}
      <div
        ref={dropRef}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--color-navy)" : "var(--color-row-divider)"}`,
          borderRadius: "var(--radius-lg)",
          background: dragging ? "var(--color-row-hover)" : "var(--color-cream-dark)",
          padding: "var(--space-10) var(--space-4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-2)",
          cursor: "pointer",
          transition: "border-color 150ms, background 150ms",
        }}
        className="max-sm:!p-[var(--space-4)]"
      >
        <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)" }}>
          Drop your CSV here
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
          OR CLICK TO BROWSE · .CSV · .XLSX · .XLS
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {fileName && rows && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)" }}>
          {fileName} · {rows.length} row{rows.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Field names + download */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)" }}>
          NAME · BRAND · STATUS · RATING · NOTES
        </span>
        <Button variant="secondary" onClick={downloadXLSXTemplate}>
          DOWNLOAD TEMPLATE
        </Button>
      </div>

      {/* Preview table */}
      {rows && rows.length > 0 && (
        <div>
          {rows.map((row, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1.5fr 0.5fr 2fr",
              gap: "var(--space-2)",
              alignItems: "center",
              minHeight: "var(--size-row-min)",
              borderBottom: "1px solid var(--color-row-divider)",
              padding: "var(--space-2) 0",
              background: row.rowError ? "color-mix(in srgb, var(--color-destructive) 10%, transparent)" : "transparent",
            }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.name || "—"}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.house || "—"}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-navy)" }}>
                {row.status}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-navy)" }}>
                {row.personalRating ?? "—"}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.personalNotes || "—"}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
            <Button
              variant="primary"
              onClick={handleImportAll}
              disabled={importing || rows.filter((r) => !r.rowError && r.name).length === 0}
              style={{ letterSpacing: "var(--tracking-wide)" }}
            >
              IMPORT ALL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

type ImportTabId = "link" | "scan" | "csv";

const TABS: { id: ImportTabId; label: string; sublabel: string }[] = [
  { id: "link", label: "Paste a Link", sublabel: "FRAGRANTICA · SEPHORA · RETAILER" },
  { id: "scan", label: "Scan a Bottle", sublabel: "CAMERA · BARCODE · LABEL" },
  { id: "csv", label: "CSV", sublabel: ".CSV · .XLSX · .XLS" },
];

export default function ImportPage() {
  const { user } = useUser();
  const { addFrag, communityFrags } = useData();
  const [activeTab, setActiveTab] = useState<ImportTabId>("link");

  return (
    <>
      <Topbar title="Import" />
      <PageContent>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-notes-text)", marginBottom: "var(--space-4)" }}>
          Add fragrances without re-entering data. Paste a URL, scan a bottle, or drop a CSV — metadata pulls and you confirm before anything saves.
        </p>

        {/* Tab switcher */}
        <div style={{
          display: "flex",
          gap: "var(--space-4)",
          borderBottom: "1px solid var(--color-row-divider)",
          marginBottom: "var(--space-6)",
        }}>
          {TABS.map((tab) => (
            <TabPill
              key={tab.id}
              label={tab.label}
              sublabel={tab.sublabel}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant="underline"
            />
          ))}
        </div>

        {activeTab === "link" && (
          <LinkTab
            userId={user?.id ?? ""}
            communityFrags={communityFrags}
            onAddFrag={addFrag}
          />
        )}

        {activeTab === "scan" && (
          <ScanTab
            userId={user?.id ?? ""}
            communityFrags={communityFrags}
            onAddFrag={addFrag}
          />
        )}

        {activeTab === "csv" && (
          <CsvTab
            userId={user?.id ?? ""}
            onAddFrag={addFrag}
          />
        )}
      </PageContent>

      <style>{`
        @media (max-width: 640px) {
          .scan-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
