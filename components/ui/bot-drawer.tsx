"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import { useToast } from "@/components/ui/toast";
import { createPendingTask, createPendingEntry, createNotification } from "@/lib/data/mutations";
import { LogComplimentModal } from "@/components/compliments/log-compliment-modal";
import { AddFragranceModal } from "@/components/collection/add-fragrance-modal";
import type { ComplimentPrefill } from "@/components/compliments/log-compliment-modal";

const AI_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL ?? "";

// ── Types ────────────────────────────────────────────────────

interface BotMessage { role: "bot" | "user"; text: string }
interface BotButton { label: string; action: () => void }
interface PendingEntry {
  id: string;
  user_id: string;
  type: string;
  status: string;
  parsed_json: Record<string, unknown> | null;
  missing_fields: string[];
  created_at: string;
}

interface ParsedVoice {
  type: "compliment" | "collection";
  fragName: string | null;
  house: string | null;
  relation?: string;
  gender?: string;
  location?: string;
  city?: string;
  country?: string;
  notes?: string;
  month?: string;
  year?: string;
  fragInDb: boolean;
}

// ── Voice parsing ────────────────────────────────────────────

const COLLECTION_TRIGGERS = /\b(bought|purchase[d]?|acqui[a-z]+|got|picked up|ordered|received|gifted myself|my new)\b/i;
const RELATION_MAP: Record<string, string> = {
  stranger: "Stranger",
  strangers: "Stranger",
  friend: "Friend",
  friends: "Friend",
  colleague: "Colleague / Client",
  coworker: "Colleague / Client",
  client: "Colleague / Client",
  family: "Family",
  mom: "Family",
  dad: "Family",
  sister: "Family",
  brother: "Family",
  partner: "Significant Other",
  "significant other": "Significant Other",
  husband: "Significant Other",
  wife: "Significant Other",
  boyfriend: "Significant Other",
  girlfriend: "Significant Other",
};
const GENDER_TRIGGERS = {
  male: /\b(guy|man|he|him|male|dude)\b/i,
  female: /\b(woman|girl|she|her|female|lady)\b/i,
};

function parseVoice(text: string): ParsedVoice {
  const isCollection = COLLECTION_TRIGGERS.test(text);

  // Extract frag name — heuristic: after "wearing", "bought", "got", etc.
  const fragMatch =
    text.match(/(?:wearing|had on|sprayed|bought|got|picked up|acquired|received)\s+(?:my\s+)?(.+?)(?:\s+(?:today|when|and|while|the|a\s+compliment|compliment)|\.|,|$)/i) ??
    text.match(/(?:^|\.\s*)(.+?)\s+(?:got|earned|received)\s+(?:a\s+)?compliment/i);
  const fragName = fragMatch?.[1]?.trim() ?? null;

  // Relation
  let relation: string | undefined;
  const lcText = text.toLowerCase();
  for (const [key, val] of Object.entries(RELATION_MAP)) {
    if (lcText.includes(key)) { relation = val; break; }
  }

  // Gender
  let gender: string | undefined;
  if (GENDER_TRIGGERS.male.test(text)) gender = "Male";
  else if (GENDER_TRIGGERS.female.test(text)) gender = "Female";

  // Location / city
  const locMatch = text.match(/(?:at|in|from)\s+((?:[A-Z][a-z]+\s?){1,3})/);
  const location = locMatch?.[1]?.trim();

  // Month/year
  const now = new Date();
  const month = String(now.getMonth() + 1);
  const year = String(now.getFullYear());

  return {
    type: isCollection ? "collection" : "compliment",
    fragName,
    house: null,
    relation,
    gender,
    location,
    city: location,
    country: undefined,
    notes: text,
    month,
    year,
    fragInDb: true, // will be checked async
  };
}

// ── Confirmation card ────────────────────────────────────────

function ConfirmCard({
  parsed,
  onAddDetails,
  onSaveLater,
}: {
  parsed: ParsedVoice;
  onAddDetails: () => void;
  onSaveLater: () => void;
}) {
  const rows: Array<{ label: string; value: string }> = [];
  if (parsed.type === "compliment") {
    if (parsed.fragName) rows.push({ label: "Fragrance", value: parsed.fragName });
    if (parsed.relation) rows.push({ label: "From", value: parsed.relation });
    if (parsed.gender) rows.push({ label: "Gender", value: parsed.gender });
    if (parsed.location) rows.push({ label: "Location", value: parsed.location });
    rows.push({ label: "Date", value: `${parsed.month}/${parsed.year}` });
  } else {
    if (parsed.fragName) rows.push({ label: "Fragrance", value: parsed.fragName });
    if (parsed.house) rows.push({ label: "House", value: parsed.house });
  }

  return (
    <div style={{
      background: "var(--color-cream-dark)",
      border: "1px solid var(--color-row-divider)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-4)",
      maxWidth: "85%",
      alignSelf: "flex-start",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)",
    }}>
      <div style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-xs)",
        color: "var(--color-meta-text)",
        letterSpacing: "var(--tracking-base)",
        textTransform: "uppercase",
      }}>
        {parsed.type === "compliment" ? "Compliment detected" : "Collection add detected"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", gap: "var(--space-3)", alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", minWidth: 72 }}>
              {r.label}
            </span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-navy)" }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
      {!parsed.fragInDb && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", fontStyle: "italic" }}>
          This fragrance isn&apos;t in our database yet — we will look it up and add it.
        </div>
      )}
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <Button variant="primary" onClick={onAddDetails}>Add details now</Button>
        <Button variant="secondary" onClick={onSaveLater}>Save for later</Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export function BotDrawer() {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [buttons, setButtons] = useState<BotButton[] | null>(null);
  const [pendingVoice, setPendingVoice] = useState<ParsedVoice | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [pending, setPending] = useState<PendingEntry[]>([]);

  // Modals
  const [complimentOpen, setComplimentOpen] = useState(false);
  const [complimentPrefill, setComplimentPrefill] = useState<ComplimentPrefill | undefined>();
  const [fragOpen, setFragOpen] = useState(false);
  const [fragInitialName, setFragInitialName] = useState<string | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const addMsg = useCallback((text: string, role: "bot" | "user") => {
    setMessages((prev) => [...prev, { role, text }]);
  }, []);
  const showButtons = useCallback((btns: BotButton[]) => setButtons(btns), []);
  const clearButtons = useCallback(() => setButtons(null), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingVoice]);

  const loadPending = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pending_entries")
      .select("*")
      .neq("status", "complete")
      .neq("status", "discarded")
      .order("created_at");
    setPending((data as PendingEntry[]) ?? []);
  }, [user]);

  useEffect(() => { loadPending(); }, [loadPending]);

  function openDrawer() {
    triggerRef.current = document.activeElement as HTMLElement;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
    if (messages.length === 0 && pending.length > 0) {
      addMsg(
        "Hey — you have " + pending.length + " unfinished entr" + (pending.length === 1 ? "y" : "ies") + ". Want to go through them now?",
        "bot"
      );
      showButtons([
        { label: "Yes, let's do it", action: () => { clearButtons(); resolvePending(); } },
        { label: "Not right now", action: () => { clearButtons(); addMsg("No problem — I'm here whenever you're ready.", "bot"); } },
      ]);
    }
  }

  function closeDrawer() {
    setOpen(false);
    try { triggerRef.current?.focus(); } catch {}
    triggerRef.current = null;
  }

  function resolvePending() {
    if (!pending.length) { addMsg("All caught up — no pending entries!", "bot"); return; }
    const entry = pending.reduce((a, b) => (a.created_at || "") < (b.created_at || "") ? a : b);
    const missing = entry.missing_fields ?? [];
    addMsg("Let me pull up your oldest entry...", "bot");
    handleMessage(
      "Resuming incomplete " + (entry.type || "entry") + ". Captured: " +
      (entry.parsed_json ? JSON.stringify(entry.parsed_json) : "nothing yet") +
      ". Missing: " + (missing.join(", ") || "unknown") + ". Please ask for the first missing field."
    );
  }

  // ── Voice input ──────────────────────────────────────────

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = typeof window !== "undefined" && (w.SpeechRecognition || w.webkitSpeechRecognition);
    if (!SR) {
      addMsg("Voice input isn't supported in this browser.", "bot");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript;
      setListening(false);
      addMsg(transcript, "user");
      handleVoice(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }

  async function handleVoice(transcript: string) {
    const parsed = parseVoice(transcript);

    // Check if frag is in community DB
    if (parsed.fragName) {
      const { data } = await supabase
        .from("fragrances")
        .select("id")
        .ilike("name", `%${parsed.fragName}%`)
        .limit(1);
      parsed.fragInDb = !!(data && data.length > 0);

      if (!parsed.fragInDb && user) {
        await createPendingEntry(parsed.fragName, parsed.house, user.id);
      }
    }

    setPendingVoice(parsed);
  }

  async function handleAddDetails() {
    if (!pendingVoice) return;
    setPendingVoice(null);
    if (pendingVoice.type === "collection") {
      setFragInitialName(pendingVoice.fragName ?? undefined);
      setFragOpen(true);
    } else {
      setComplimentPrefill({
        fragName: pendingVoice.fragName ?? undefined,
        relation: pendingVoice.relation,
        gender: pendingVoice.gender,
        location: pendingVoice.location,
        city: pendingVoice.city,
        country: pendingVoice.country,
        notes: pendingVoice.notes,
        month: pendingVoice.month,
        year: pendingVoice.year,
      });
      setComplimentOpen(true);
    }
  }

  async function handleSaveLater() {
    if (!pendingVoice || !user) return;
    setPendingVoice(null);
    const taskType = pendingVoice.type === "collection" ? "voice_add" : "fill_compliment";
    const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    try {
      const { id } = await createPendingTask(user.id, taskType, JSON.stringify(pendingVoice), dueAt);
      await createNotification(
        user.id,
        "pending_task",
        "Finish your " + (pendingVoice.type === "collection" ? "fragrance add" : "compliment"),
        pendingVoice.fragName ? `Don't forget to add details for ${pendingVoice.fragName}.` : "You have an unfinished entry.",
        null,
      );
      toast("Saved — we will remind you in 48 hours.", "success");
      void id;
    } catch {
      toast("Failed to save — try again.", "error");
    }
  }

  // ── Text chat ─────────────────────────────────────────────

  async function handleMessage(text: string) {
    if (!AI_WORKER_URL) {
      addMsg("Bot coming soon — the AI worker hasn't been deployed yet.", "bot");
      return;
    }
    if (/https?:\/\/.*(tiktok|youtube|youtu\.be|instagram|vimeo)/i.test(text)) {
      addMsg("I can't watch videos — tell me the fragrance name and I'll look it up right now.", "bot");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(AI_WORKER_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id ?? "", userName: user?.name ?? "there", message: text }),
      });
      const data = await res.json();
      addMsg(data.reply || "...", "bot");
      if (data.actions?.length) executeActions(data.actions);
    } catch (e: unknown) {
      addMsg("Error: " + (e instanceof Error ? e.message : "unknown"), "bot");
    } finally {
      setLoading(false);
    }
  }

  async function executeActions(actions: Array<{ type: string; payload: Record<string, unknown> }>) {
    for (const a of actions) {
      if (a.type === "appendPendingEntry" && a.payload) {
        const { error } = await supabase.from("pending_entries").insert({
          user_id: user?.id ?? "",
          type: a.payload.type ?? "unknown",
          status: "pending",
          raw_transcript: a.payload.rawTranscript ?? null,
          parsed_json: a.payload.parsedJson ?? null,
          missing_fields: a.payload.missingFields ?? [],
        });
        if (!error) { await loadPending(); addMsg("Saved as draft — I'll remind you to finish it later.", "bot"); }
      } else if (a.type === "completePendingEntry" && a.payload?.id) {
        await supabase.from("pending_entries").update({ status: "complete" }).eq("id", a.payload.id);
        await loadPending();
        addMsg("Entry completed.", "bot");
      }
    }
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    clearButtons();
    addMsg(text, "user");
    handleMessage(text);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && open) closeDrawer(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const hasPending = pending.length > 0;
  const QUICK_CHIPS = [
    "Add a fragrance",
    "Log a compliment",
    "What should I wear today?",
    "Tell me about a fragrance",
  ];

  return (
    <>
      {/* Pending banner */}
      {hasPending && !open && (
        <div
          onClick={openDrawer}
          style={{
            margin: "0 var(--space-4) var(--space-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            background: "var(--color-sand-light)",
            border: "1px solid var(--color-cream-dark)",
            padding: "10px var(--space-4)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-xs)",
            color: "var(--color-navy)",
            letterSpacing: "var(--tracking-xs)",
          }}
        >
          <span>You have {pending.length} unfinished entr{pending.length === 1 ? "y" : "ies"} — tap to finish</span>
        </div>
      )}

      {/* FAB trigger */}
      <Button
        variant="ghost"
        onClick={openDrawer}
        aria-label="Open assistant"
        style={{
          position: "fixed",
          bottom: "calc(26px + env(safe-area-inset-bottom, 0px))",
          right: "calc(84px + env(safe-area-inset-right, 0px))",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "var(--color-sand-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          boxShadow: "var(--shadow-sm)",
          transition: "opacity 150ms",
          color: "var(--color-navy)",
        }}
      >
        {loading ? (
          <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "var(--color-navy)" }} className="animate-spin">
            <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2zm0 2a8 8 0 1 0 0 16A8 8 0 0 0 12 4zm0 2a6 6 0 0 1 0 12A6 6 0 0 1 12 6z" opacity=".3"/>
            <path d="M12 4a8 8 0 0 1 8 8h-2a6 6 0 0 0-6-6V4z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "var(--color-navy)" }}>
            <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.61 1.35 4.94 3.47 6.52L4 20l4.13-1.65A10.7 10.7 0 0 0 12 19.5c5.52 0 10-3.92 10-8.75C22 5.92 17.52 2 12 2z"/>
          </svg>
        )}
        {hasPending && (
          <span style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            width: "8px",
            height: "8px",
            background: "var(--color-destructive)",
            borderRadius: "50%",
          }} className="animate-pulse" />
        )}
      </Button>

      {/* Backdrop */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--color-navy-backdrop)", zIndex: 500 }}
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI assistant"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "80vh",
          maxHeight: "600px",
          background: "var(--color-cream)",
          borderTop: "1px solid var(--color-cream-dark)",
          zIndex: 501,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 280ms ease-out",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px var(--space-5)",
          borderBottom: "1px solid var(--color-cream-dark)",
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-note)", fontStyle: "italic", color: "var(--color-navy)" }}>
            assistant
          </div>
          <Button
            variant="ghost"
            onClick={closeDrawer}
            aria-label="Close"
            className="h-auto"
            style={{ fontSize: "var(--text-lg)", color: "var(--color-meta-text)", padding: "var(--space-1) var(--space-2)", lineHeight: 1 }}
          >
            ×
          </Button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4) var(--space-5)", display: "flex", flexDirection: "column", gap: "10px" }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                lineHeight: "var(--leading-relaxed)",
                alignSelf: m.role === "bot" ? "flex-start" : "flex-end",
                background: m.role === "bot" ? "var(--color-cream-dark)" : "var(--color-navy)",
                color: m.role === "bot" ? "var(--color-navy)" : "var(--color-cream)",
                borderRadius: m.role === "bot" ? "2px 12px 12px 2px" : "12px 2px 2px 12px",
              }}
            >
              {m.text}
            </div>
          ))}
          {pendingVoice && (
            <ConfirmCard
              parsed={pendingVoice}
              onAddDetails={handleAddDetails}
              onSaveLater={handleSaveLater}
            />
          )}
          {buttons && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignSelf: "flex-start" }}>
              {buttons.map((b, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  onClick={b.action}
                  className="h-auto"
                  style={{
                    background: "var(--color-cream-dark)",
                    border: "1px solid var(--color-meta-text)",
                    color: "var(--color-navy)",
                    fontSize: "var(--text-xs)",
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    transition: "all 150ms",
                  }}
                >
                  {b.label}
                </Button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips */}
        {messages.length === 0 && !pendingVoice && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", padding: "0 var(--space-5) var(--space-3)" }}>
            {QUICK_CHIPS.map((chip) => (
              <Button
                key={chip}
                variant="ghost"
                onClick={() => { clearButtons(); addMsg(chip, "user"); handleMessage(chip); }}
                className="h-auto"
                style={{
                  background: "var(--color-cream-dark)",
                  border: "1px solid var(--color-cream-dark)",
                  color: "var(--color-navy)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-xs)",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  transition: "all 150ms",
                }}
              >
                {chip}
              </Button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div style={{
          padding: "var(--space-2) var(--space-5)",
          paddingBottom: "calc(var(--space-4) + env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid var(--color-cream-dark)",
          flexShrink: 0,
          display: "flex",
          gap: "var(--space-2)",
          alignItems: "center",
        }}>
          {/* Mic button */}
          <Button
            variant="ghost"
            onClick={startListening}
            aria-label={listening ? "Stop listening" : "Start voice input"}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid var(--color-meta-text)",
              background: listening ? "var(--color-navy)" : "var(--color-cream)",
              color: listening ? "var(--color-cream)" : "var(--color-navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 150ms, color 150ms",
            }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 8a1 1 0 0 1 1 1 8 8 0 0 1-7 7.93V22h-2v-2.07A8 8 0 0 1 4 12a1 1 0 1 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z"/>
            </svg>
          </Button>

          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={listening ? "Listening..." : "Ask anything about your fragrances..."}
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={send}
            disabled={!input.trim() || loading}
          >
            Send
          </Button>
        </div>
      </div>

      {/* Modals opened from voice confirm */}
      <LogComplimentModal
        open={complimentOpen}
        onClose={() => { setComplimentOpen(false); setComplimentPrefill(undefined); }}
        prefill={complimentPrefill}
      />
      <AddFragranceModal
        open={fragOpen}
        onClose={() => { setFragOpen(false); setFragInitialName(undefined); }}
        initialName={fragInitialName}
      />
    </>
  );
}
