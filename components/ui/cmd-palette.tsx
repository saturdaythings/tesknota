"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabPill } from "@/components/ui/tab-pill";
import { MONTHS, shortFragType } from "@/lib/frag-utils";
import type { UserFragrance, UserCompliment, FragranceStatus, FragranceType, BottleSize, Relation, ComplimenterGender, WishlistPriority } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

type StepType = "search" | "pick" | "select" | "multiselect" | "text" | "textarea" | "monthyear" | "confirm";

interface SelectOption { v: string; l: string }

interface FlowStep {
  id: string;
  type: StepType;
  label: string;
  hint?: string;
  optional?: boolean;
  options?: SelectOption[];
  multiOptions?: string[];
  asPills?: boolean;
  skipIf?: (answers: Record<string, unknown>) => boolean;
}

type FlowKey = "frag-add" | "frag-edit" | "comp-add" | "comp-edit";

interface PalState {
  open: boolean;
  flow: FlowKey | null;
  step: number;
  answers: Record<string, unknown>;
  editTarget: UserFragrance | UserCompliment | null;
}

// ── Flow definitions ──────────────────────────────────────────────────────────

const STATUS_OPTIONS: SelectOption[] = [
  { v: "CURRENT", l: "Current Collection" },
  { v: "PREVIOUSLY_OWNED", l: "Previously Owned" },
  { v: "FINISHED", l: "Finished" },
  { v: "WANT_TO_BUY", l: "Want to Buy" },
  { v: "WANT_TO_SMELL", l: "Want to Smell" },
  { v: "DONT_LIKE", l: "Have Smelled — Don't Like" },
];

const RATING_OPTIONS: SelectOption[] = [
  { v: "1", l: "1 star" }, { v: "2", l: "2 stars" }, { v: "3", l: "3 stars" },
  { v: "4", l: "4 stars" }, { v: "5", l: "5 stars" },
];

const STATUS_RATING_OPTIONS: SelectOption[] = [
  { v: "Obsessed", l: "Obsessed" }, { v: "Love", l: "Love" },
  { v: "Like", l: "Like" }, { v: "Just OK", l: "Just OK" },
  { v: "Don't Like", l: "Don't Like" }, { v: "WTF", l: "WTF" },
];

const SIZE_OPTIONS = ["Sample", "Travel", "Full Bottle", "Decant"];

const TYPE_OPTIONS: SelectOption[] = [
  "Extrait de Parfum", "Eau de Parfum", "Eau de Toilette",
  "Cologne", "Perfume Concentré", "Body Spray", "Perfume Oil", "Other"
].map((v) => ({ v, l: v }));

const PRIORITY_OPTIONS: SelectOption[] = [
  { v: "HIGH", l: "High" },
  { v: "MEDIUM", l: "Medium" },
  { v: "LOW", l: "Low" },
];

const RELATION_OPTIONS: SelectOption[] = [
  "Stranger", "Friend", "Colleague / Client", "Family", "Significant Other", "Other"
].map((v) => ({ v, l: v }));

const GENDER_OPTIONS: SelectOption[] = [
  { v: "Female", l: "Female" }, { v: "Male", l: "Male" },
];

const MONTH_OPTIONS = MONTHS.map((m, i) => ({ v: String(i + 1).padStart(2, "0"), l: m }));
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => ({ v: y, l: y }));
const PURCHASE_YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => ({ v: y, l: y }));

function isWishlist(answers: Record<string, unknown>): boolean {
  const s = answers.status as string;
  return s === "WANT_TO_BUY" || s === "WANT_TO_SMELL";
}

const FRAG_ADD_STEPS: FlowStep[] = [
  { id: "search", type: "search", label: "Which fragrance?", hint: "Search by name or house" },
  { id: "status", type: "select", label: "Status?", options: STATUS_OPTIONS },
  { id: "personalRating", type: "select", label: "Your personal rating?", options: RATING_OPTIONS, skipIf: isWishlist, optional: true },
  { id: "statusRating", type: "select", label: "How do you feel about it?", options: STATUS_RATING_OPTIONS, asPills: true, skipIf: isWishlist, optional: true },
  { id: "sizes", type: "multiselect", label: "Size owned", multiOptions: SIZE_OPTIONS, skipIf: isWishlist, optional: true },
  { id: "type", type: "select", label: "Type / concentration?", options: TYPE_OPTIONS, optional: true },
  { id: "wishlistPriority", type: "select", label: "Priority?", options: PRIORITY_OPTIONS, skipIf: (a) => !isWishlist(a), optional: true },
  { id: "purchaseMonth", type: "select", label: "Purchase month?", options: MONTH_OPTIONS, skipIf: isWishlist, optional: true },
  { id: "purchaseYear", type: "select", label: "Purchase year?", options: PURCHASE_YEAR_OPTIONS, skipIf: isWishlist, optional: true },
  { id: "personalNotes", type: "textarea", label: "Personal notes?", hint: "Your impressions, context, memories...", optional: true },
  { id: "confirm", type: "confirm", label: "Save fragrance?" },
];

const FRAG_EDIT_STEPS: FlowStep[] = [
  { id: "pick", type: "pick", label: "Which fragrance to edit?" },
  ...FRAG_ADD_STEPS.slice(1),
];

const COMP_ADD_STEPS: FlowStep[] = [
  { id: "pick", type: "pick", label: "Which fragrance were you wearing?" },
  { id: "month", type: "select", label: "Month?", options: MONTH_OPTIONS },
  { id: "year", type: "select", label: "Year?", options: YEAR_OPTIONS },
  { id: "relation", type: "select", label: "Who gave the compliment?", options: RELATION_OPTIONS },
  { id: "gender", type: "select", label: "Their gender?", options: GENDER_OPTIONS, optional: true },
  { id: "location", type: "text", label: "Where?", hint: "Venue or occasion", optional: true },
  { id: "notes", type: "textarea", label: "Any notes?", hint: "Context, reaction, moment...", optional: true },
  { id: "confirm", type: "confirm", label: "Log compliment?" },
];

const COMP_EDIT_STEPS: FlowStep[] = [
  { id: "pickComp", type: "pick", label: "Which compliment to edit?" },
  ...COMP_ADD_STEPS.slice(1),
];

const FLOWS: Record<FlowKey, FlowStep[]> = {
  "frag-add": FRAG_ADD_STEPS,
  "frag-edit": FRAG_EDIT_STEPS,
  "comp-add": COMP_ADD_STEPS,
  "comp-edit": COMP_EDIT_STEPS,
};

const MENU_ITEMS: { key: FlowKey; label: string; hint: string }[] = [
  { key: "frag-add", label: "Add Fragrance", hint: "Add to your collection or wishlist" },
  { key: "frag-edit", label: "Edit Fragrance", hint: "Update an existing entry" },
  { key: "comp-add", label: "Log Compliment", hint: "Record a compliment you received" },
  { key: "comp-edit", label: "Edit Compliment", hint: "Update an existing compliment" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const FIELD_ID = "cmd-pal-field";

function genFragId(): string {
  return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function genCompId(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function activeSteps(flow: FlowKey, answers: Record<string, unknown>): FlowStep[] {
  return FLOWS[flow].filter((s) => !s.skipIf || !s.skipIf(answers));
}

// ── Main component ────────────────────────────────────────────────────────────

export function CmdPalette() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, addFrag, editFrag, addComp, editComp } = useData();
  const { toast } = useToast();

  const [pal, setPal] = useState<PalState>({
    open: false, flow: null, step: 0, answers: {}, editTarget: null,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");

  const myFrags = fragrances.filter((f) => f.userId === (user?.id ?? "u1"));
  const myComps = compliments.filter((c) => c.userId === (user?.id ?? "u1"));

  // Auto-focus input on step change
  useEffect(() => {
    if (pal.open) {
      setTimeout(() => (document.getElementById(FIELD_ID) as HTMLElement)?.focus(), 60);
    }
  }, [pal.step, pal.flow, pal.open]);

  // Cmd+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPal((p) => p.open ? { ...p, open: false } : { open: true, flow: null, step: 0, answers: {}, editTarget: null });
        setSearchQuery("");
        setSelectedMulti([]);
        setTextValue("");
      }
      if (e.key === "Escape") {
        setPal((p) => ({ ...p, open: false }));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function closePal() {
    setPal((p) => ({ ...p, open: false }));
  }

  function selectFlow(key: FlowKey) {
    setPal({ open: true, flow: key, step: 0, answers: {}, editTarget: null });
    setSearchQuery(""); setSelectedMulti([]); setTextValue("");
  }

  function getCurrentStep(): FlowStep | null {
    if (!pal.flow) return null;
    const steps = activeSteps(pal.flow, pal.answers);
    return steps[pal.step] ?? null;
  }

  function advanceStep(answers: Record<string, unknown>) {
    if (!pal.flow) return;
    const steps = activeSteps(pal.flow, answers);
    let next = pal.step + 1;
    while (next < steps.length - 1 && steps[next].skipIf?.(answers)) next++;
    if (next >= steps.length) { closePal(); return; }
    setPal((p) => ({ ...p, step: next, answers }));
    setSearchQuery(""); setSelectedMulti([]); setTextValue("");
  }

  function goBack() {
    if (pal.step > 0) {
      setPal((p) => ({ ...p, step: p.step - 1 }));
      setSearchQuery(""); setSelectedMulti([]); setTextValue("");
    } else {
      setPal((p) => ({ ...p, flow: null, step: 0, answers: {}, editTarget: null }));
    }
  }

  async function handleSave() {
    if (!user || !pal.flow) return;
    const a = pal.answers;
    try {
      if (pal.flow === "frag-add") {
        const wishlist = isWishlist(a);
        const frag: UserFragrance = {
          id: genFragId(),
          fragranceId: (a.fragranceId as string) || genFragId(),
          userId: user.id,
          name: (a.name as string) || "",
          house: (a.house as string) || "",
          status: (a.status as FragranceStatus) || "CURRENT",
          sizes: (a.sizes as BottleSize[]) || [],
          type: (a.type as FragranceType) || null,
          personalRating: a.personalRating ? parseInt(a.personalRating as string) : null,
          statusRating: null,
          whereBought: null,
          purchaseDate: !wishlist && a.purchaseMonth && a.purchaseYear
            ? `${a.purchaseMonth} ${a.purchaseYear}`
            : null,
          purchaseMonth: !wishlist ? ((a.purchaseMonth as string) || null) : null,
          purchaseYear: !wishlist ? ((a.purchaseYear as string) || null) : null,
          purchasePrice: null,
          isDupe: false,
          dupeFor: "",
          personalNotes: (a.personalNotes as string) || "",
          createdAt: new Date().toISOString(),
          wishlistPriority: wishlist ? ((a.wishlistPriority as WishlistPriority) || null) : null,
        };
        await addFrag(frag);
        toast((a.name as string) + " added", "success");
      } else if (pal.flow === "frag-edit" && pal.editTarget) {
        const orig = pal.editTarget as UserFragrance;
        const updated: UserFragrance = {
          ...orig,
          status: (a.status as FragranceStatus) ?? orig.status,
          sizes: (a.sizes as BottleSize[]) ?? orig.sizes,
          type: (a.type as FragranceType) ?? orig.type,
          personalRating: a.personalRating ? parseInt(a.personalRating as string) : orig.personalRating,
          personalNotes: (a.personalNotes as string) ?? orig.personalNotes,
        };
        await editFrag(updated);
        toast(orig.name + " updated", "success");
      } else if (pal.flow === "comp-add") {
        const fragName = (a.fragName as string) || (a.name as string) || "";
        const fragId = (a.fragId as string) || "";
        if (!fragId || !fragName) { toast("Select a fragrance first.", "error"); return; }
        const comp: UserCompliment = {
          id: genCompId(),
          userId: user.id,
          primaryFragId: fragId,
          primaryFrag: fragName || "",
          secondaryFragId: null,
          secondaryFrag: null,
          gender: (a.gender as ComplimenterGender) || null,
          relation: (a.relation as Relation) || "Friend",
          month: (a.month as string) || "",
          year: (a.year as string) || "",
          location: (a.location as string) || null,
          city: null,
          state: null,
          country: "US",
          notes: (a.notes as string) || null,
          createdAt: new Date().toISOString(),
        };
        await addComp(comp);
        toast("Compliment logged", "success");
      } else if (pal.flow === "comp-edit" && pal.editTarget) {
        const orig = pal.editTarget as UserCompliment;
        const updated: UserCompliment = {
          ...orig,
          gender: (a.gender as ComplimenterGender) ?? orig.gender,
          relation: (a.relation as Relation) ?? orig.relation,
          month: (a.month as string) ?? orig.month,
          year: (a.year as string) ?? orig.year,
          location: (a.location as string) ?? orig.location,
          notes: (a.notes as string) ?? orig.notes,
        };
        await editComp(updated);
        toast("Compliment updated", "success");
      }
    } catch (e: unknown) {
      toast("Save failed: " + (e instanceof Error ? e.message : "unknown"), "error");
    }
    closePal();
  }

  // Step value submission helpers
  function submitSelect(v: string) {
    const step = getCurrentStep();
    if (!step) return;
    advanceStep({ ...pal.answers, [step.id]: v });
  }

  function submitText() {
    const step = getCurrentStep();
    if (!step) return;
    advanceStep({ ...pal.answers, [step.id]: textValue });
  }

  function submitMultiSelect() {
    const step = getCurrentStep();
    if (!step) return;
    advanceStep({ ...pal.answers, [step.id]: selectedMulti });
  }

  function skipStep() {
    const step = getCurrentStep();
    if (!step) return;
    const val = step.type === "multiselect" ? [] : "";
    advanceStep({ ...pal.answers, [step.id]: val });
  }

  // ── Search step: filter community fragrances ──────────────────────────────
  const fragResults = communityFrags.filter((f) => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    return f.fragranceName.toLowerCase().includes(q) || f.fragranceHouse.toLowerCase().includes(q);
  }).slice(0, 8);

  function selectFragFromSearch(f: { fragranceId: string; fragranceName: string; fragranceHouse: string }) {
    const step = getCurrentStep();
    if (!step) return;
    advanceStep({ ...pal.answers, [step.id]: f.fragranceName, fragranceId: f.fragranceId, name: f.fragranceName, house: f.fragranceHouse });
  }

  function selectFragFromSearchFreetext() {
    const step = getCurrentStep();
    if (!step) return;
    advanceStep({ ...pal.answers, [step.id]: searchQuery, name: searchQuery, house: "", fragranceId: genFragId() });
  }

  // ── Pick step: list of user's frags or comps ──────────────────────────────
  function selectFragFromPick(f: UserFragrance) {
    const step = getCurrentStep();
    if (!step) return;
    const answers = { ...pal.answers, [step.id]: f.id, name: f.name, house: f.house, fragranceId: f.fragranceId, fragName: f.name, fragId: f.fragranceId || f.id };
    setPal((p) => ({ ...p, step: p.step + 1, answers, editTarget: f }));
    setSearchQuery(""); setSelectedMulti([]); setTextValue("");
  }

  function selectCompFromPick(c: UserCompliment) {
    const step = getCurrentStep();
    if (!step) return;
    const answers = { ...pal.answers, [step.id]: c.id, fragName: c.primaryFrag };
    setPal((p) => ({ ...p, step: p.step + 1, answers, editTarget: c }));
    setSearchQuery(""); setSelectedMulti([]); setTextValue("");
  }

  const pickFragQuery = searchQuery.toLowerCase();
  const pickFragResults = myFrags.filter((f) =>
    !pickFragQuery || f.name.toLowerCase().includes(pickFragQuery) || f.house.toLowerCase().includes(pickFragQuery)
  ).slice(0, 8);

  const pickCompResults = myComps.filter((c) =>
    !searchQuery || c.primaryFrag.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  const step = getCurrentStep();
  const totalSteps = pal.flow ? activeSteps(pal.flow, pal.answers).length : 0;
  const stepNum = pal.step + 1;

  if (!pal.open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[600]"
        style={{ background: 'var(--color-navy-backdrop)' }}
        onClick={closePal}
      />

      {/* Palette modal */}
      <div
        className="fixed left-1/2 top-[15vh] -translate-x-1/2 w-full max-w-[520px] bg-[var(--color-cream)] border border-[var(--color-sand-light)] z-[601]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--color-cream-dark)' }}
        >
          {pal.flow ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={goBack}>
                ← Back
              </Button>
              <span
                className="font-sans"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', letterSpacing: 'var(--tracking-sm)' }}
              >
                {stepNum} / {totalSteps}
              </span>
            </div>
          ) : (
            <div
              className="font-sans uppercase"
              style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-md)', color: 'var(--color-navy-mid)' }}
            >
              Quick add
            </div>
          )}
          <div className="flex items-center gap-3">
            <kbd
              className="font-sans"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-meta-text)',
                background: 'var(--color-cream-dark)',
                border: '1px solid var(--color-cream-dark)',
                padding: '2px 6px',
              }}
            >
              ⌘K
            </kbd>
            <Button variant="icon" size="sm" onClick={closePal} aria-label="Close">×</Button>
          </div>
        </div>

        {/* Menu (no flow selected) */}
        {!pal.flow && (
          <div className="py-1">
            {MENU_ITEMS.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                className="w-full justify-between px-5 py-3.5 h-auto min-h-0 rounded-none"
                onClick={() => selectFlow(item.key)}
              >
                <div className="text-left">
                  <div
                    className="font-sans"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}
                  >
                    {item.label}
                  </div>
                  <div
                    className="font-sans mt-0.5"
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}
                  >
                    {item.hint}
                  </div>
                </div>
                <span style={{ color: 'var(--color-meta-text)', fontSize: 'var(--text-xs)' }}>→</span>
              </Button>
            ))}
          </div>
        )}

        {/* Step content */}
        {pal.flow && step && (
          <div className="px-5 py-5">
            <div
              className="font-serif italic mb-4"
              style={{ fontSize: 'var(--text-lg)', color: 'var(--color-navy)' }}
            >
              {step.label}
            </div>

            {/* Search step */}
            {step.type === "search" && (
              <>
                <Input
                  id={FIELD_ID}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && searchQuery) selectFragFromSearchFreetext(); }}
                  placeholder={step.hint || "Search..."}
                  className="mb-2"
                />
                {fragResults.map((f) => (
                  <Button
                    key={f.fragranceId}
                    variant="ghost"
                    className="w-full justify-between px-3 py-2.5 h-auto min-h-0 rounded-none"
                    style={{ borderBottom: '1px solid var(--color-row-divider)' }}
                    onClick={() => selectFragFromSearch(f)}
                  >
                    <span className="font-sans" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>{f.fragranceName}</span>
                    <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{f.fragranceHouse}</span>
                  </Button>
                ))}
                {searchQuery && fragResults.length === 0 && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto min-h-0 px-3 py-2.5 italic font-sans"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy-mid)' }}
                    onClick={selectFragFromSearchFreetext}
                  >
                    Add &quot;{searchQuery}&quot; as new entry
                  </Button>
                )}
              </>
            )}

            {/* Pick frag step */}
            {step.type === "pick" && (pal.flow === "frag-edit" || pal.flow === "comp-add") && (
              <>
                <Input
                  id={FIELD_ID}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="mb-2"
                />
                {pickFragResults.map((f) => (
                  <Button
                    key={f.id}
                    variant="ghost"
                    className="w-full justify-between px-3 py-2.5 h-auto min-h-0 rounded-none"
                    style={{ borderBottom: '1px solid var(--color-row-divider)' }}
                    onClick={() => selectFragFromPick(f)}
                  >
                    <span className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="min-w-0 truncate font-sans" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>{f.name}</span>
                      {f.type && shortFragType(f.type) && (
                        <span style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-row-divider)', borderRadius: 'var(--radius-full)', padding: 'var(--space-half) var(--space-2)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-label)', color: 'var(--color-meta-text)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {shortFragType(f.type)}
                        </span>
                      )}
                      {f.isDupe && (
                        <span style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-navy)', borderRadius: 'var(--radius-full)', padding: 'var(--space-half) var(--space-2)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-label)', color: 'var(--color-navy)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          Dupe
                        </span>
                      )}
                    </span>
                    <span className="font-sans flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{f.house}</span>
                  </Button>
                ))}
              </>
            )}

            {/* Pick comp step */}
            {step.type === "pick" && pal.flow === "comp-edit" && (
              <>
                <Input
                  id={FIELD_ID}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search compliments..."
                  className="mb-2"
                />
                {pickCompResults.map((c) => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    className="w-full justify-between px-3 py-2.5 h-auto min-h-0 rounded-none"
                    style={{ borderBottom: '1px solid var(--color-row-divider)' }}
                    onClick={() => selectCompFromPick(c)}
                  >
                    <span className="font-sans" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>{c.primaryFrag}</span>
                    <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{MONTHS[parseInt(c.month) - 1]} {c.year}</span>
                  </Button>
                ))}
              </>
            )}

            {/* Select step */}
            {step.type === "select" && step.options && !step.asPills && (
              <div className="flex flex-col gap-1">
                {step.options.map((opt) => (
                  <Button
                    key={opt.v}
                    variant="ghost"
                    className="w-full justify-start px-4 py-3 h-auto min-h-0 rounded-none border border-[var(--color-cream-dark)] hover:border-[var(--color-accent)]"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}
                    onClick={() => submitSelect(opt.v)}
                  >
                    {opt.l}
                  </Button>
                ))}
              </div>
            )}

            {/* Select step — pill variant */}
            {step.type === "select" && step.options && step.asPills && (
              <div className="flex flex-wrap gap-2">
                {step.options.map((opt) => (
                  <TabPill
                    key={opt.v}
                    label={opt.l}
                    variant="selector"
                    active={pal.answers[step.id] === opt.v}
                    onClick={() => submitSelect(opt.v)}
                  />
                ))}
              </div>
            )}

            {/* Multiselect step */}
            {step.type === "multiselect" && step.multiOptions && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {step.multiOptions.map((opt) => (
                    <TabPill
                      key={opt}
                      label={opt}
                      active={selectedMulti.includes(opt)}
                      onClick={() => setSelectedMulti((prev) =>
                        prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]
                      )}
                    />
                  ))}
                </div>
                <Button variant="primary" size="sm" onClick={submitMultiSelect} style={{ alignSelf: 'flex-start' }}>
                  Continue
                </Button>
              </div>
            )}

            {/* Text step */}
            {step.type === "text" && (
              <>
                <Input
                  id={FIELD_ID}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitText(); }}
                  placeholder={step.hint}
                  className="mb-3"
                />
                <Button variant="primary" size="sm" onClick={submitText}>Continue</Button>
              </>
            )}

            {/* Textarea step */}
            {step.type === "textarea" && (
              <>
                <Textarea
                  id={FIELD_ID}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder={step.hint}
                  rows={4}
                  className="mb-3"
                />
                <Button variant="primary" size="sm" onClick={submitText}>Continue</Button>
              </>
            )}

            {/* Confirm step */}
            {step.type === "confirm" && (
              <div className="flex gap-3">
                <Button variant="primary" onClick={handleSave}>Save</Button>
                <Button variant="ghost" onClick={closePal}>Cancel</Button>
              </div>
            )}

            {/* Skip for optional steps */}
            {step.optional && step.type !== "confirm" && step.type !== "pick" && step.type !== "search" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={skipStep}
                className="mt-3"
                style={{ color: 'var(--color-meta-text)' }}
              >
                Skip →
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
