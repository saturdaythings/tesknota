"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { MONTHS } from "@/lib/frag-utils";
import type { UserFragrance, UserCompliment, FragranceStatus, FragranceType, BottleSize, Relation, ComplimenterGender } from "@/types";

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

const RELATION_OPTIONS: SelectOption[] = [
  "Stranger", "Friend", "Colleague / Client", "Family", "Significant Other", "Other"
].map((v) => ({ v, l: v }));

const GENDER_OPTIONS: SelectOption[] = [
  { v: "Female", l: "Female" }, { v: "Male", l: "Male" },
];

function isWishlist(answers: Record<string, unknown>): boolean {
  const s = answers.status as string;
  return s === "WANT_TO_BUY" || s === "WANT_TO_SMELL";
}

const FRAG_ADD_STEPS: FlowStep[] = [
  { id: "search", type: "search", label: "Which fragrance?", hint: "Search by name or house" },
  { id: "status", type: "select", label: "Status?", options: STATUS_OPTIONS },
  { id: "personalRating", type: "select", label: "Your personal rating?", options: RATING_OPTIONS, skipIf: isWishlist, optional: true },
  { id: "statusRating", type: "select", label: "How do you feel about it?", options: STATUS_RATING_OPTIONS, skipIf: isWishlist, optional: true },
  { id: "sizes", type: "multiselect", label: "Size owned", multiOptions: SIZE_OPTIONS, skipIf: isWishlist, optional: true },
  { id: "type", type: "select", label: "Type / concentration?", options: TYPE_OPTIONS, optional: true },
  { id: "personalNotes", type: "textarea", label: "Personal notes?", hint: "Your impressions, context, memories...", optional: true },
  { id: "confirm", type: "confirm", label: "Save fragrance?" },
];

const FRAG_EDIT_STEPS: FlowStep[] = [
  { id: "pick", type: "pick", label: "Which fragrance to edit?" },
  ...FRAG_ADD_STEPS.slice(1),
];

const COMP_ADD_STEPS: FlowStep[] = [
  { id: "pick", type: "pick", label: "Which fragrance were you wearing?" },
  { id: "month", type: "select", label: "Month?", options: MONTHS.map((m, i) => ({ v: String(i + 1).padStart(2, "0"), l: m })) },
  { id: "year", type: "select", label: "Year?", options: Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => ({ v: y, l: y })) },
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
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const myFrags = fragrances.filter((f) => f.userId === (user?.id ?? "u1"));
  const myComps = compliments.filter((c) => c.userId === (user?.id ?? "u1"));

  // Auto-focus input on step change
  useEffect(() => {
    if (pal.open) setTimeout(() => inputRef.current?.focus(), 60);
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

  function openPal() {
    setPal({ open: true, flow: null, step: 0, answers: {}, editTarget: null });
    setSearchQuery(""); setSelectedMulti([]); setTextValue("");
  }

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
          purchaseDate: null,
          purchaseMonth: null,
          purchaseYear: null,
          purchasePrice: null,
          isDupe: false,
          dupeFor: "",
          personalNotes: (a.personalNotes as string) || "",
          createdAt: new Date().toISOString(),
        };
        await addFrag(frag);
        toast((a.name as string) + " added");
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
        toast(orig.name + " updated");
      } else if (pal.flow === "comp-add") {
        const fragName = (a.fragName as string) || (a.name as string) || "";
        const fragId = (a.fragId as string) || "";
        if (!fragId || !fragName) { toast("Select a fragrance first."); return; }
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
          country: "",
          notes: (a.notes as string) || null,
          createdAt: new Date().toISOString(),
        };
        await addComp(comp);
        toast("Compliment logged");
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
        toast("Compliment updated");
      }
    } catch (e: unknown) {
      toast("Save failed: " + (e instanceof Error ? e.message : "unknown"));
    }
    closePal();
  }

  // Step value submission helpers
  function submitSelect(v: string) {
    const step = getCurrentStep();
    if (!step) return;
    const answers = { ...pal.answers, [step.id]: v };
    advanceStep(answers);
  }

  function submitText() {
    const step = getCurrentStep();
    if (!step) return;
    const answers = { ...pal.answers, [step.id]: textValue };
    advanceStep(answers);
  }

  function submitMultiSelect() {
    const step = getCurrentStep();
    if (!step) return;
    const answers = { ...pal.answers, [step.id]: selectedMulti };
    advanceStep(answers);
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
    const answers = { ...pal.answers, [step.id]: f.fragranceName, fragranceId: f.fragranceId, name: f.fragranceName, house: f.fragranceHouse };
    advanceStep(answers);
  }

  function selectFragFromSearchFreetext() {
    const step = getCurrentStep();
    if (!step) return;
    const answers = { ...pal.answers, [step.id]: searchQuery, name: searchQuery, house: "", fragranceId: genFragId() };
    advanceStep(answers);
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
      <div className="fixed inset-0 bg-[rgba(var(--near-black-ch),0.55)] z-[600]" onClick={closePal} />

      {/* Palette modal */}
      <div
        className="fixed left-1/2 top-[15vh] -translate-x-1/2 w-full max-w-[520px] bg-[var(--off)] border border-[var(--b3)] z-[601] shadow-[0_20px_60px_rgba(var(--blue3-ch),0.22)]"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--b2)]">
          {pal.flow ? (
            <div className="flex items-center gap-3">
              <button onClick={goBack} className="font-[var(--mono)] text-xs tracking-[0.08em] text-[var(--ink3)] hover:text-[var(--ink)] bg-none border-none cursor-pointer p-0">
                ← Back
              </button>
              <span className="font-[var(--mono)] text-xs text-[var(--ink4)] tracking-[0.08em]">
                {stepNum} / {totalSteps}
              </span>
            </div>
          ) : (
            <div className="font-[var(--mono)] text-xs tracking-[0.1em] uppercase text-[var(--ink3)]">Quick add</div>
          )}
          <div className="flex items-center gap-3">
            <kbd className="font-[var(--mono)] text-xs text-[var(--ink4)] bg-[var(--off2)] border border-[var(--b2)] px-1.5 py-0.5">⌘K</kbd>
            <button onClick={closePal} className="text-lg text-[var(--ink3)] hover:text-[var(--ink)] bg-none border-none cursor-pointer px-1" aria-label="Close">×</button>
          </div>
        </div>

        {/* Menu (no flow selected) */}
        {!pal.flow && (
          <div className="py-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => selectFlow(item.key)}
                className="w-full text-left px-5 py-3.5 flex items-center justify-between hover:bg-[var(--off2)] group transition-colors border-none bg-none cursor-pointer"
              >
                <div>
                  <div className="font-[var(--body)] text-sm text-[var(--ink)] group-hover:text-[var(--blue)]">{item.label}</div>
                  <div className="font-[var(--mono)] text-xs text-[var(--ink4)] mt-0.5">{item.hint}</div>
                </div>
                <span className="text-[var(--ink4)] group-hover:text-[var(--blue)] font-[var(--mono)] text-[12px]">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Step content */}
        {pal.flow && step && (
          <div className="px-5 py-5">
            <div className="font-[var(--serif)] text-lg italic text-[var(--ink)] mb-4">{step.label}</div>

            {/* Search step */}
            {step.type === "search" && (
              <>
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && searchQuery) selectFragFromSearchFreetext(); }}
                  placeholder={step.hint || "Search..."}
                  className="w-full px-3 py-2.5 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] placeholder:text-[var(--ink4)] focus:outline-none focus:border-[var(--blue)] mb-2"
                />
                {fragResults.map((f) => (
                  <button
                    key={f.fragranceId}
                    onClick={() => selectFragFromSearch(f)}
                    className="w-full text-left px-3 py-2.5 border-b border-[var(--b1)] hover:bg-[var(--off2)] cursor-pointer flex justify-between items-center bg-none border-x-0 border-t-0"
                  >
                    <span className="font-[var(--body)] text-sm text-[var(--ink)]">{f.fragranceName}</span>
                    <span className="font-[var(--mono)] text-xs text-[var(--ink4)]">{f.fragranceHouse}</span>
                  </button>
                ))}
                {searchQuery && fragResults.length === 0 && (
                  <button onClick={selectFragFromSearchFreetext} className="w-full text-left px-3 py-2.5 hover:bg-[var(--off2)] cursor-pointer font-[var(--body)] text-sm text-[var(--ink3)] italic bg-none border-none">
                    Add "{searchQuery}" as new entry
                  </button>
                )}
              </>
            )}

            {/* Pick frag step */}
            {step.type === "pick" && (pal.flow === "frag-edit" || pal.flow === "comp-add") && (
              <>
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2.5 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] placeholder:text-[var(--ink4)] focus:outline-none focus:border-[var(--blue)] mb-2"
                />
                {pickFragResults.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => selectFragFromPick(f)}
                    className="w-full text-left px-3 py-2.5 border-b border-[var(--b1)] hover:bg-[var(--off2)] cursor-pointer flex justify-between items-center bg-none border-x-0 border-t-0"
                  >
                    <span className="font-[var(--body)] text-sm text-[var(--ink)]">{f.name}</span>
                    <span className="font-[var(--mono)] text-xs text-[var(--ink4)]">{f.house}</span>
                  </button>
                ))}
              </>
            )}

            {/* Pick comp step */}
            {step.type === "pick" && pal.flow === "comp-edit" && (
              <>
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search compliments..."
                  className="w-full px-3 py-2.5 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] placeholder:text-[var(--ink4)] focus:outline-none focus:border-[var(--blue)] mb-2"
                />
                {pickCompResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCompFromPick(c)}
                    className="w-full text-left px-3 py-2.5 border-b border-[var(--b1)] hover:bg-[var(--off2)] cursor-pointer flex justify-between items-center bg-none border-x-0 border-t-0"
                  >
                    <span className="font-[var(--body)] text-sm text-[var(--ink)]">{c.primaryFrag}</span>
                    <span className="font-[var(--mono)] text-xs text-[var(--ink4)]">{MONTHS[parseInt(c.month) - 1]} {c.year}</span>
                  </button>
                ))}
              </>
            )}

            {/* Select step */}
            {step.type === "select" && step.options && (
              <div className="flex flex-col gap-1">
                {step.options.map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => submitSelect(opt.v)}
                    className="w-full text-left px-4 py-3 border border-[var(--b2)] bg-[var(--off)] hover:bg-[var(--off2)] hover:border-[var(--blue)] font-[var(--body)] text-sm text-[var(--ink)] cursor-pointer transition-all"
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            )}

            {/* Multiselect step */}
            {step.type === "multiselect" && step.multiOptions && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {step.multiOptions.map((opt) => {
                    const selected = selectedMulti.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelectedMulti((prev) => selected ? prev.filter((v) => v !== opt) : [...prev, opt])}
                        className={`px-4 py-2 border font-[var(--body)] text-sm cursor-pointer transition-all ${selected ? "bg-[var(--blue)] border-[var(--blue)] text-white" : "bg-[var(--off)] border-[var(--b2)] text-[var(--ink)] hover:border-[var(--blue)]"}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <button onClick={submitMultiSelect} className="self-start px-5 py-2.5 bg-[var(--blue)] text-white font-[var(--mono)] text-xs tracking-[0.08em] uppercase hover:bg-[var(--blue2)] transition-colors">
                  Continue
                </button>
              </div>
            )}

            {/* Text step */}
            {step.type === "text" && (
              <>
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitText(); }}
                  placeholder={step.hint}
                  className="w-full px-3 py-2.5 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] placeholder:text-[var(--ink4)] focus:outline-none focus:border-[var(--blue)] mb-3"
                />
                <button onClick={submitText} className="px-5 py-2.5 bg-[var(--blue)] text-white font-[var(--mono)] text-xs tracking-[0.08em] uppercase hover:bg-[var(--blue2)] transition-colors">
                  Continue
                </button>
              </>
            )}

            {/* Textarea step */}
            {step.type === "textarea" && (
              <>
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder={step.hint}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] placeholder:text-[var(--ink4)] focus:outline-none focus:border-[var(--blue)] resize-none mb-3"
                />
                <button onClick={submitText} className="px-5 py-2.5 bg-[var(--blue)] text-white font-[var(--mono)] text-xs tracking-[0.08em] uppercase hover:bg-[var(--blue2)] transition-colors">
                  Continue
                </button>
              </>
            )}

            {/* Confirm step */}
            {step.type === "confirm" && (
              <div className="flex gap-3">
                <button onClick={handleSave} className="px-6 py-2.5 bg-[var(--blue)] text-white font-[var(--mono)] text-xs tracking-[0.1em] uppercase hover:bg-[var(--blue2)] transition-colors">
                  Save
                </button>
                <button onClick={closePal} className="px-6 py-2.5 border border-[var(--b3)] font-[var(--mono)] text-xs tracking-[0.1em] uppercase text-[var(--ink3)] hover:border-[var(--ink3)] transition-colors">
                  Cancel
                </button>
              </div>
            )}

            {/* Skip for optional steps */}
            {step.optional && step.type !== "confirm" && step.type !== "pick" && step.type !== "search" && (
              <button onClick={skipStep} className="block mt-3 font-[var(--mono)] text-xs text-[var(--ink4)] hover:text-[var(--ink3)] bg-none border-none cursor-pointer p-0 tracking-[0.06em]">
                Skip →
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
