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
        "Hey — you have " + pending.length + " unfinished entr" +
        (pending.length === 1 ? "y" : "ies") + ". Want to go through them now?",
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
      "Resuming incomplete " + (entry.type || "entry") +
      ". Captured: " + (entry.parsed_json ? JSON.stringify(entry.parsed_json) : "nothing yet") +
      ". Missing: " + (missing.join(", ") || "unknown") +
      ". Please ask for the first missing field."
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
        body: JSON.stringify({
          userId: user?.id ?? "",
          userName: user?.name ?? "there",
          message: text,
        }),
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
        if (!error) {
          await loadPending();
          addMsg("Saved as draft — I'll remind you to finish it later.", "bot");
        }
      } else if (a.type === "completePendingEntry" && a.payload?.id) {
        await supabase
          .from("pending_entries")
          .update({ status: "complete" })
          .eq("id", a.payload.id);
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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) closeDrawer();
    }
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
          className="mx-4 mb-3 flex items-center justify-between cursor-pointer bg-[var(--warm3)] border border-[var(--warm)] px-4 py-2.5 font-[var(--mono)] text-xs text-[var(--ink2)] tracking-[0.04em]"
        >
          <span>You have {pending.length} unfinished entr{pending.length === 1 ? "y" : "ies"} — tap to finish</span>
        </div>
      )}

      <button
        onClick={openDrawer}
        aria-label="Open assistant"
        className="fixed bottom-[26px] right-[84px] w-11 h-11 rounded-full bg-[var(--warm)] border-none cursor-pointer flex items-center justify-center z-[400] shadow-[0_4px_16px_rgba(var(--warm-ch),0.32)] hover:bg-[var(--warm2)] hover:scale-105 transition-all duration-150"
        style={{ bottom: "calc(26px + env(safe-area-inset-bottom, 0px))", right: "calc(84px + env(safe-area-inset-right, 0px))" }}
      >
        {loading ? (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[var(--blue3)] animate-spin"><path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2zm0 2a8 8 0 1 0 0 16A8 8 0 0 0 12 4zm0 2a6 6 0 0 1 0 12A6 6 0 0 1 12 6z" opacity=".3"/><path d="M12 4a8 8 0 0 1 8 8h-2a6 6 0 0 0-6-6V4z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[var(--blue3)]"><path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.61 1.35 4.94 3.47 6.52L4 20l4.13-1.65A10.7 10.7 0 0 0 12 19.5c5.52 0 10-3.92 10-8.75C22 5.92 17.52 2 12 2z"/></svg>
        )}
        {hasPending && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[var(--rose-tk)] rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 bg-[rgba(var(--near-black-ch),0.5)] z-[500]" onClick={closeDrawer} />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 h-[80vh] max-h-[600px] bg-[var(--off)] border-t border-[var(--b2)] z-[501] flex flex-col transition-transform duration-[280ms] ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="AI assistant"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--b2)] shrink-0">
          <div className="font-[var(--serif)] text-base italic text-[var(--ink)]">assistant</div>
          <button onClick={closeDrawer} className="text-xl text-[var(--ink3)] hover:text-[var(--ink)] bg-none border-none cursor-pointer px-2 py-1" aria-label="Close">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] px-3.5 py-2.5 font-[var(--body)] text-[13px] leading-relaxed ${
                m.role === "bot"
                  ? "self-start bg-[var(--off2)] text-[var(--ink)] rounded-[2px_12px_12px_2px]"
                  : "self-end bg-[var(--blue)] text-white rounded-[12px_2px_2px_12px]"
              }`}
            >
              {m.text}
            </div>
          ))}
          {buttons && (
            <div className="flex flex-wrap gap-2 self-start">
              {buttons.map((b, i) => (
                <button
                  key={i}
                  onClick={b.action}
                  className="bg-[var(--off2)] border border-[var(--b2)] text-[var(--ink2)] font-[var(--mono)] text-xs tracking-[0.06em] px-3.5 py-1.5 cursor-pointer rounded-full hover:bg-[var(--warm3)] hover:border-[var(--warm)] transition-all"
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => { clearButtons(); addMsg(chip, "user"); handleMessage(chip); }}
                className="bg-[var(--off2)] border border-[var(--b2)] text-[var(--ink2)] font-[var(--mono)] text-xs tracking-[0.06em] px-3.5 py-1.5 cursor-pointer rounded-full hover:bg-[var(--warm3)] hover:border-[var(--warm)] transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div className="px-5 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2 border-t border-[var(--b2)] shrink-0 flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your fragrances..."
            className="flex-1 px-3 py-2.5 border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] placeholder:text-[var(--ink4)] focus:outline-none focus:border-[var(--blue)]"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-[var(--blue)] text-white font-[var(--mono)] text-xs tracking-[0.08em] uppercase disabled:opacity-40 hover:bg-[var(--blue2)] transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
