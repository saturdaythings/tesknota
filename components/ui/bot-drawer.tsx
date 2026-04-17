"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";

const AI_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL ?? "";

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

export function BotDrawer() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [buttons, setButtons] = useState<BotButton[] | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const addMsg = useCallback((text: string, role: "bot" | "user") => {
    setMessages((prev) => [...prev, { role, text }]);
  }, []);
  const showButtons = useCallback((btns: BotButton[]) => setButtons(btns), []);
  const clearButtons = useCallback(() => setButtons(null), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      {hasPending && !open && (
        <div
          onClick={openDrawer}
          style={{
            margin: "0 16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            background: "var(--color-sand-light)",
            border: "1px solid var(--color-cream-dark)",
            padding: "10px 16px",
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "var(--color-navy)",
            letterSpacing: "0.04em",
          }}
        >
          <span>You have {pending.length} unfinished entr{pending.length === 1 ? "y" : "ies"} — tap to finish</span>
        </div>
      )}

      {/* Trigger button — sits INSIDE the FAB stack via portal or is called externally */}
      <button
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
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
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
      </button>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--color-navy-backdrop)", zIndex: 500 }}
          onClick={closeDrawer}
        />
      )}

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
          padding: "14px 20px",
          borderBottom: "1px solid var(--color-cream-dark)",
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-note)", fontStyle: "italic", color: "var(--color-navy)" }}>
            assistant
          </div>
          <button
            onClick={closeDrawer}
            style={{ fontSize: "var(--text-lg)", color: "var(--color-meta-text)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", lineHeight: 1 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
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
          {buttons && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignSelf: "flex-start" }}>
              {buttons.map((b, i) => (
                <button
                  key={i}
                  onClick={b.action}
                  style={{
                    background: "var(--color-cream-dark)",
                    border: "1px solid var(--color-meta-text)",
                    color: "var(--color-navy)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-xs)",
                    padding: "6px 14px",
                    cursor: "pointer",
                    borderRadius: "var(--radius-full)",
                    transition: "all 150ms",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips */}
        {messages.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "0 20px 12px" }}>
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => { clearButtons(); addMsg(chip, "user"); handleMessage(chip); }}
                style={{
                  background: "var(--color-cream-dark)",
                  border: "1px solid var(--color-cream-dark)",
                  color: "var(--color-navy)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-xs)",
                  padding: "6px 14px",
                  cursor: "pointer",
                  borderRadius: "var(--radius-full)",
                  transition: "all 150ms",
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "8px 20px",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid var(--color-cream-dark)",
          flexShrink: 0,
          display: "flex",
          gap: "8px",
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your fragrances..."
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid var(--color-cream-dark)",
              background: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-ui)",
              color: "var(--color-navy)",
              outline: "none",
              borderRadius: "var(--radius-md)",
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              padding: "10px 16px",
              background: "var(--color-navy)",
              color: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-sm)",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              opacity: (!input.trim() || loading) ? 0.4 : 1,
              transition: "opacity 150ms",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
