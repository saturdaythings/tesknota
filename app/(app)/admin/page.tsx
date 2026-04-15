"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiLog {
  timestamp: string;
  feature: string;
  userId: string;
  status: string;
  tokensIn: string;
  tokensOut: string;
  costUsd: string;
  latencyMs: string;
  error?: string;
  errorMessage?: string;
}

interface ActivityLog {
  timestamp: string;
  userId: string;
  actionType: string;
}

interface AdminUser {
  id?: string;
  userId?: string;
  name?: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
}

interface DQFrag {
  id: string;
  name: string;
  house: string;
  missingAccords: boolean;
  missingNotes: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const COST_INPUT_PER_1M = 0.25;
const COST_OUTPUT_PER_1M = 1.25;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function computeCost(row: ApiLog): number {
  if (row.costUsd && parseFloat(row.costUsd) > 0) return parseFloat(row.costUsd);
  const tokIn = parseFloat(row.tokensIn) || 0;
  const tokOut = parseFloat(row.tokensOut) || 0;
  return (tokIn / 1_000_000) * COST_INPUT_PER_1M + (tokOut / 1_000_000) * COST_OUTPUT_PER_1M;
}

function userName(uid: string, users: AdminUser[]): string {
  const u = users.find((u) => u.id === uid || u.userId === uid);
  return u?.name ?? u?.displayName ?? uid;
}

function isError(l: ApiLog): boolean {
  if (!l.status) return false;
  const s = String(l.status);
  return s[0] !== "2" && s !== "ok" && s !== "success" && s !== "200";
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((sorted.length * p) / 100) - 1;
  return sorted[Math.max(0, idx)];
}

function fmtLat(ms: number): string {
  if (ms >= 1000) return (ms / 1000).toFixed(1) + "s";
  return Math.round(ms) + "ms";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BigNumGrid({ items }: { items: { val: string; label: string; sub?: string; valClass?: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--adm-border)] border border-[var(--adm-border)] mb-6">
      {items.map((item) => (
        <div key={item.label} className="bg-[var(--adm-bg)] p-5">
          <div className={`font-[var(--adm-mono)] text-[28px] font-medium leading-none mb-1 ${item.valClass ?? "text-[var(--adm-fg)]"}`}>
            {item.val}
          </div>
          <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] tracking-[0.08em] mt-1">
            {item.label}
          </div>
          {item.sub && (
            <div className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] mt-1">{item.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function SecHead({ title, right }: { title: string; right?: string }) {
  return (
    <div className="flex justify-between items-baseline border-b border-[var(--adm-fg)] pb-1.5 mb-4">
      <div className="font-[var(--adm-serif)] text-base font-normal italic text-[var(--adm-fg)]">{title}</div>
      {right && (
        <div className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] tracking-[0.1em] uppercase">{right}</div>
      )}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={h}
                className="font-[var(--adm-mono)] text-[10px] tracking-[0.14em] uppercase text-[var(--adm-fg4)] px-3 py-2 border-b border-[var(--adm-fg)] text-left font-normal"
                style={i === headers.length - 1 ? { textAlign: "right" } : {}}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-[var(--adm-bg2)]">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="font-[var(--adm-mono)] text-xs text-[var(--adm-fg2)] px-3 py-[10px] border-b border-[var(--adm-border2)]"
                  style={ci > 0 ? { textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--adm-fg)", fontWeight: 500 } : {}}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Spend tab ────────────────────────────────────────────────────────────────

function SpendTab({ apiLogs, users }: { apiLogs: ApiLog[]; users: AdminUser[] }) {
  const now = new Date();
  const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const todayStr = now.toISOString().slice(0, 10);

  let monthCost = 0, todayCost = 0, monthCalls = 0;
  const dailyCosts: Record<string, number> = {};
  const endpointAgg: Record<string, { calls: number; cost: number; tokensIn: number; tokensOut: number }> = {};
  const userAgg: Record<string, { calls: number; cost: number; features: Record<string, number>; dailyCosts: Record<string, number> }> = {};

  for (const l of apiLogs) {
    const c = computeCost(l);
    const ts = l.timestamp || "";
    const dateStr = ts.slice(0, 10);
    if (ts.slice(0, 7) === thisMonth) { monthCost += c; monthCalls++; }
    if (dateStr === todayStr) todayCost += c;
    dailyCosts[dateStr] = (dailyCosts[dateStr] || 0) + c;
    const feat = l.feature || "unknown";
    if (!endpointAgg[feat]) endpointAgg[feat] = { calls: 0, cost: 0, tokensIn: 0, tokensOut: 0 };
    endpointAgg[feat].calls++;
    endpointAgg[feat].cost += c;
    endpointAgg[feat].tokensIn += parseFloat(l.tokensIn) || 0;
    endpointAgg[feat].tokensOut += parseFloat(l.tokensOut) || 0;
    const uid = l.userId || "?";
    if (!userAgg[uid]) userAgg[uid] = { calls: 0, cost: 0, features: {}, dailyCosts: {} };
    userAgg[uid].calls++;
    userAgg[uid].cost += c;
    userAgg[uid].features[feat] = (userAgg[uid].features[feat] || 0) + 1;
    userAgg[uid].dailyCosts[dateStr] = (userAgg[uid].dailyCosts[dateStr] || 0) + c;
  }

  const avgPerMsg = monthCalls > 0 ? monthCost / monthCalls : 0;

  // Build last 30 days
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    return { date: d, cost: dailyCosts[d.toISOString().slice(0, 10)] || 0 };
  });
  const maxCost = Math.max(...days30.map((d) => d.cost), 0.001);

  const epRows = Object.entries(endpointAgg)
    .sort((a, b) => b[1].cost - a[1].cost)
    .map(([k, ep]) => {
      const avgTok = Math.round((ep.tokensIn + ep.tokensOut) / ep.calls);
      return [k, String(ep.calls), "~" + avgTok.toLocaleString(), "$" + (ep.cost / ep.calls).toFixed(4), "$" + ep.cost.toFixed(2)];
    });

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <BigNumGrid items={[
        { val: "$" + monthCost.toFixed(2), label: "Month to date" },
        { val: "$" + todayCost.toFixed(2), label: "Today", sub: monthCalls + " API calls this month" },
        { val: "$" + avgPerMsg.toFixed(4), label: "Avg per message" },
        { val: String(monthCalls), label: "Total calls (" + now.toLocaleString("en-US", { month: "short" }) + ")" },
      ]} />

      <div className="mb-9">
        <SecHead title="Daily spend, last 30 days" right="Hover for detail" />
        <div className="flex items-end gap-px h-28 mb-1">
          {days30.map((d, i) => {
            const pct = (d.cost / maxCost) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                <div
                  className="w-full bg-[var(--adm-fg)] group-hover:bg-[var(--adm-red)] transition-colors cursor-crosshair relative"
                  style={{ height: Math.max(pct, 1) + "%", minHeight: "1px" }}
                >
                  <div className="hidden group-hover:block absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-[var(--adm-fg)] text-[var(--adm-bg)] font-[var(--adm-mono)] text-[10px] px-2 py-1 whitespace-nowrap z-10">
                    {d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${d.cost.toFixed(3)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)]">
          {[0, 7, 14, 21, 29].map((i) => (
            <span key={i}>{days30[i].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          ))}
        </div>
      </div>

      {epRows.length > 0 && (
        <div className="mb-9">
          <SecHead title="Cost by endpoint" right={monthLabel} />
          <DataTable headers={["Endpoint", "Calls", "Avg Tokens", "Avg Cost", "Total"]} rows={epRows} />
        </div>
      )}

      {Object.keys(userAgg).length > 0 && (
        <div className="mb-9">
          <SecHead title="Cost by user" right={monthLabel} />
          <div className={`grid gap-px bg-[var(--adm-border)] border border-[var(--adm-border)]`} style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(userAgg).length, 4)}, 1fr)` }}>
            {Object.entries(userAgg).map(([uid, ua]) => {
              const avgU = ua.calls > 0 ? ua.cost / ua.calls : 0;
              let topFeat = "", topCount = 0;
              for (const [f, c] of Object.entries(ua.features)) { if (c > topCount) { topCount = c; topFeat = f; } }
              let heaviestDay = "", heaviestCost = 0;
              for (const [d, c] of Object.entries(ua.dailyCosts)) { if (c > heaviestCost) { heaviestCost = c; heaviestDay = d; } }
              const heavyLabel = heaviestDay
                ? new Date(heaviestDay + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " — $" + heaviestCost.toFixed(2)
                : "—";
              const stats = [
                { l: "Total calls", v: String(ua.calls) },
                { l: "Total spend", v: "$" + ua.cost.toFixed(2) },
                { l: "Avg per message", v: "$" + avgU.toFixed(4) },
                { l: "Most used", v: topFeat + " (" + topCount + ")" },
                { l: "Heaviest day", v: heavyLabel },
              ];
              return (
                <div key={uid} className="bg-[var(--adm-bg)] p-5">
                  <div className="font-[var(--adm-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--adm-fg4)] mb-3 pb-1.5 border-b border-[var(--adm-border2)]">
                    {userName(uid, users)}
                  </div>
                  {stats.map((s) => (
                    <div key={s.l} className="flex justify-between py-1.5 border-b border-[var(--adm-border2)] last:border-0">
                      <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)]">{s.l}</span>
                      <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg)] font-medium">{s.v}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Usage tab ────────────────────────────────────────────────────────────────

function UsageTab({ apiLogs, activityLogs, users }: { apiLogs: ApiLog[]; activityLogs: ActivityLog[]; users: AdminUser[] }) {
  const now = new Date();
  const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

  const monthApiCalls = apiLogs.filter((l) => (l.timestamp || "").slice(0, 7) === thisMonth).length;
  let fragsAdded = 0, complimentsLogged = 0;
  const activeUsers: Record<string, boolean> = {};
  const userActionCounts: Record<string, Record<string, number>> = {};

  for (const l of activityLogs) {
    const ts = l.timestamp || "";
    if (ts.slice(0, 7) === thisMonth) {
      if (l.actionType === "fragrance_add" || l.actionType === "add_fragrance") fragsAdded++;
      if (l.actionType === "compliment_add" || l.actionType === "add_compliment" || l.actionType === "log_compliment") complimentsLogged++;
      const uid = l.userId || "?";
      if (!userActionCounts[uid]) userActionCounts[uid] = {};
      userActionCounts[uid][l.actionType] = (userActionCounts[uid][l.actionType] || 0) + 1;
    }
    if (new Date(ts) >= weekAgo) activeUsers[l.userId || "?"] = true;
  }

  // Activity heatmap (last 4 weeks)
  const TIME_BUCKETS = [
    { label: "6 am", start: 6, end: 9 },
    { label: "9 am", start: 9, end: 12 },
    { label: "12 pm", start: 12, end: 15 },
    { label: "3 pm", start: 15, end: 18 },
    { label: "6 pm", start: 18, end: 21 },
    { label: "9 pm", start: 21, end: 24 },
  ];
  const fourWeeksAgo = new Date(now.getTime() - 28 * 86_400_000);
  const heatData: Record<string, number> = {};
  const allTimestamps = [...apiLogs.map((l) => l.timestamp), ...activityLogs.map((l) => l.timestamp)].filter(Boolean);
  for (const ts of allTimestamps) {
    const d = new Date(ts);
    if (d < fourWeeksAgo) continue;
    const dow = d.getDay();
    const hr = d.getHours();
    const bi = TIME_BUCKETS.findIndex((b) => hr >= b.start && hr < b.end);
    if (bi < 0) continue;
    const key = dow + "-" + bi;
    heatData[key] = (heatData[key] || 0) + 1;
  }
  const heatMax = Math.max(...Object.values(heatData), 1);
  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

  // Feature usage table
  const allActions: Record<string, boolean> = {};
  const allUserIds = Object.keys(userActionCounts).sort();
  for (const uid of allUserIds) {
    for (const a of Object.keys(userActionCounts[uid])) allActions[a] = true;
  }
  const actionList = Object.keys(allActions).sort();

  // Session patterns
  const userEvents: Record<string, number[]> = {};
  for (const l of activityLogs) {
    if (!l.timestamp) continue;
    const d = new Date(l.timestamp);
    if (d < thirtyDaysAgo) continue;
    const uid = l.userId || "?";
    if (!userEvents[uid]) userEvents[uid] = [];
    userEvents[uid].push(d.getTime());
  }

  const heatLevels = ["bg-[var(--adm-bg2)]", "bg-[var(--adm-bg3)]", "bg-[#C8C8C8]", "bg-[#888]", "bg-[#444]", "bg-[var(--adm-fg)]"];

  return (
    <div>
      <BigNumGrid items={[
        { val: String(monthApiCalls), label: "API Calls (" + now.toLocaleString("en-US", { month: "short" }) + ")" },
        { val: String(fragsAdded), label: "Fragrances Added" },
        { val: String(complimentsLogged), label: "Compliments Logged" },
        { val: String(Object.keys(activeUsers).length), label: "Active Users (7d)" },
      ]} />

      <div className="mb-9">
        <SecHead title="Activity heatmap" right="Messages per hour, last 4 weeks" />
        <div className="grid" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", gap: "2px" }}>
          <div />
          {DAY_ORDER.map((d) => (
            <div key={d} className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] text-center pb-1">{DAY_NAMES[d]}</div>
          ))}
          {TIME_BUCKETS.map((tb, bi) => (
            <>
              <div key={tb.label} className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] flex items-center">{tb.label}</div>
              {DAY_ORDER.map((di) => {
                const count = heatData[di + "-" + bi] || 0;
                const level = count > 0 ? Math.min(5, Math.ceil((count / heatMax) * 5)) : 0;
                return (
                  <div key={di} className={`aspect-square min-h-3 cursor-pointer relative group ${heatLevels[level]}`}>
                    {count > 0 && (
                      <div className="hidden group-hover:block absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-[var(--adm-fg)] text-[var(--adm-bg)] font-[var(--adm-mono)] text-[10px] px-2 py-1 whitespace-nowrap z-10">
                        {DAY_NAMES[di]} {tb.label}: {count} msgs
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {actionList.length > 0 && (
        <div className="mb-9">
          <SecHead title="Feature usage breakdown" right="Last 30 days" />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="font-[var(--adm-mono)] text-[10px] tracking-[0.14em] uppercase text-[var(--adm-fg4)] px-3 py-2 border-b border-[var(--adm-fg)] text-left font-normal">Action</th>
                  {allUserIds.map((uid) => (
                    <th key={uid} className="font-[var(--adm-mono)] text-[10px] tracking-[0.14em] uppercase text-[var(--adm-fg4)] px-3 py-2 border-b border-[var(--adm-fg)] text-right font-normal">{userName(uid, users)}</th>
                  ))}
                  <th className="font-[var(--adm-mono)] text-[10px] tracking-[0.14em] uppercase text-[var(--adm-fg4)] px-3 py-2 border-b border-[var(--adm-fg)] text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {actionList.map((action) => {
                  const rowTotal = allUserIds.reduce((s, uid) => s + (userActionCounts[uid]?.[action] || 0), 0);
                  return (
                    <tr key={action} className="hover:bg-[var(--adm-bg2)]">
                      <td className="font-[var(--adm-mono)] text-xs text-[var(--adm-fg2)] px-3 py-[10px] border-b border-[var(--adm-border2)]">{action.replace(/_/g, " ")}</td>
                      {allUserIds.map((uid) => (
                        <td key={uid} className="font-[var(--adm-mono)] text-xs text-[var(--adm-fg)] font-medium px-3 py-[10px] border-b border-[var(--adm-border2)] text-right tabular-nums">{String(userActionCounts[uid]?.[action] || 0)}</td>
                      ))}
                      <td className="font-[var(--adm-mono)] text-xs text-[var(--adm-fg)] font-medium px-3 py-[10px] border-b border-[var(--adm-border2)] text-right tabular-nums">{String(rowTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {Object.keys(userEvents).length > 0 && (
        <div className="mb-9">
          <SecHead title="Session patterns" />
          <div className={`grid gap-px bg-[var(--adm-border)] border border-[var(--adm-border)]`} style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(userEvents).length, 4)}, 1fr)` }}>
            {Object.entries(userEvents).map(([uid, times]) => {
              const sorted = [...times].sort((a, b) => a - b);
              const sessions: { start: number; end: number; actions: number }[] = [];
              let sesStart = sorted[0], sesEnd = sorted[0], sesActions = 1;
              for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] - sesEnd > 30 * 60 * 1000) {
                  sessions.push({ start: sesStart, end: sesEnd, actions: sesActions });
                  sesStart = sorted[i]; sesEnd = sorted[i]; sesActions = 1;
                } else { sesEnd = sorted[i]; sesActions++; }
              }
              sessions.push({ start: sesStart, end: sesEnd, actions: sesActions });
              const totalLen = sessions.reduce((s, se) => s + (se.end - se.start), 0);
              const avgLen = sessions.length > 0 ? totalLen / sessions.length / 60000 : 0;
              const avgActions = sessions.length > 0 ? sorted.length / sessions.length : 0;
              const dayCounts = [0, 0, 0, 0, 0, 0, 0];
              for (const t of sorted) dayCounts[new Date(t).getDay()]++;
              let maxDay = 0;
              dayCounts.forEach((c, i) => { if (c > dayCounts[maxDay]) maxDay = i; });
              const hrCounts = new Array(24).fill(0);
              for (const t of sorted) hrCounts[new Date(t).getHours()]++;
              let maxHr = 0;
              hrCounts.forEach((c, i) => { if (c > hrCounts[maxHr]) maxHr = i; });
              const hrLabel = (maxHr === 0 ? "12" : maxHr > 12 ? String(maxHr - 12) : String(maxHr)) + (maxHr < 12 ? " am" : " pm");
              const lastTs = sorted[sorted.length - 1];
              const agoMs = Date.now() - lastTs;
              const agoStr = agoMs < 60000 ? "just now" : agoMs < 3_600_000 ? Math.round(agoMs / 60000) + " min ago" : agoMs < 86_400_000 ? Math.round(agoMs / 3_600_000) + " hrs ago" : Math.round(agoMs / 86_400_000) + " days ago";
              const stats = [
                { l: "Sessions (30d)", v: String(sessions.length) },
                { l: "Avg session length", v: avgLen.toFixed(1) + " min" },
                { l: "Avg actions/session", v: avgActions.toFixed(1) },
                { l: "Most active day", v: DAY_NAMES[maxDay] },
                { l: "Most active hour", v: hrLabel },
                { l: "Last seen", v: agoStr },
              ];
              return (
                <div key={uid} className="bg-[var(--adm-bg)] p-5">
                  <div className="font-[var(--adm-mono)] text-[10px] tracking-[0.2em] uppercase text-[var(--adm-fg4)] mb-3 pb-1.5 border-b border-[var(--adm-border2)]">
                    {userName(uid, users)}
                  </div>
                  {stats.map((s) => (
                    <div key={s.l} className="flex justify-between py-1.5 border-b border-[var(--adm-border2)] last:border-0">
                      <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)]">{s.l}</span>
                      <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg)] font-medium">{s.v}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Errors tab ───────────────────────────────────────────────────────────────

function ErrorsTab({ apiLogs }: { apiLogs: ApiLog[] }) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86_400_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const DAILY_LIMIT = 20;

  let errors24h = 0, errors30d = 0, success30d = 0, total30d = 0, rateLimitHits = 0;
  const latencies: Record<string, number[]> = {};
  const allLatencies: number[] = [];
  const todayByUser: Record<string, number> = {};

  for (const l of apiLogs) {
    const ts = new Date(l.timestamp);
    const isRecent = ts >= dayAgo;
    const isMonth = ts >= thirtyDaysAgo;
    if (isMonth) {
      total30d++;
      if (isError(l)) {
        errors30d++;
        if (String(l.status) === "429") rateLimitHits++;
        if (isRecent) errors24h++;
      } else {
        success30d++;
      }
      const lat = parseFloat(l.latencyMs || "0");
      if (lat > 0) {
        const feat = l.feature || "unknown";
        if (!latencies[feat]) latencies[feat] = [];
        latencies[feat].push(lat);
        allLatencies.push(lat);
      }
    }
    if (ts.toISOString().slice(0, 10) === now.toISOString().slice(0, 10)) {
      todayByUser[l.userId || "?"] = (todayByUser[l.userId || "?"] || 0) + 1;
    }
  }

  const successRate = total30d > 0 ? ((success30d / total30d) * 100).toFixed(1) + "%" : "—";
  const avgLat = allLatencies.length > 0 ? Math.round(allLatencies.reduce((s, v) => s + v, 0) / allLatencies.length) : 0;

  const errorRows = apiLogs
    .filter((l) => isError(l) && new Date(l.timestamp) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  const latRows = Object.entries(latencies)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([feat, arr]) => [feat, fmtLat(percentile(arr, 50)), fmtLat(percentile(arr, 95)), fmtLat(percentile(arr, 99))]);

  const globalToday = Object.values(todayByUser).reduce((s, c) => s + c, 0);

  return (
    <div>
      <BigNumGrid items={[
        { val: String(errors24h), label: "Errors (24h)", valClass: errors24h === 0 ? "text-[var(--adm-green)]" : "text-[var(--adm-red)]" },
        { val: successRate, label: "Success Rate (30d)", sub: total30d > 0 ? errors30d + " failures / " + total30d + " calls" : undefined },
        { val: String(rateLimitHits), label: "Rate Limit Hits" },
        { val: avgLat > 0 ? avgLat + "ms" : "—", label: "Avg Latency" },
      ]} />

      <div className="mb-9">
        <SecHead title="Rate limit status" right="Current window" />
        {Object.keys(todayByUser).length > 0 ? (
          <div className="flex flex-col gap-2">
            {Object.entries(todayByUser).map(([uid, count]) => {
              const pct = Math.min(100, (count / DAILY_LIMIT) * 100);
              return (
                <div key={uid} className="flex items-center gap-3">
                  <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] w-32 shrink-0">{uid} today</span>
                  <div className="flex-1 h-2 bg-[var(--adm-bg2)] relative">
                    <div className={`h-2 transition-all ${pct >= 80 ? "bg-[var(--adm-red)]" : "bg-[var(--adm-fg)]"}`} style={{ width: pct + "%" }} />
                  </div>
                  <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg)] tabular-nums">{count} / {DAILY_LIMIT}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-3">
              <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] w-32 shrink-0">Global calls/day</span>
              <div className="flex-1 h-2 bg-[var(--adm-bg2)] relative">
                <div className="h-2 bg-[var(--adm-fg)]" style={{ width: Math.min(100, (globalToday / 1000) * 100) + "%" }} />
              </div>
              <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg)] tabular-nums">{globalToday} / 1,000</span>
            </div>
          </div>
        ) : (
          <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] py-3">No calls today.</div>
        )}
      </div>

      <div className="mb-9">
        <SecHead title="Recent errors" right="Last 30 days" />
        {errorRows.length > 0 ? (
          <div className="flex flex-col">
            {errorRows.map((l, i) => {
              const d = new Date(l.timestamp);
              return (
                <div key={i} className="flex gap-3 px-3 py-2 border-b border-[var(--adm-border2)] font-[var(--adm-mono)] text-[11px] hover:bg-[var(--adm-bg2)]">
                  <span className="text-[var(--adm-fg4)] shrink-0">{d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  <span className="text-[var(--adm-fg3)] shrink-0">{l.feature || "—"}</span>
                  <span className="text-[var(--adm-fg2)]">{l.status} — {l.error ?? l.errorMessage ?? "Unknown error"}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] py-3">No errors in the last 30 days.</div>
        )}
      </div>

      {latRows.length > 0 && (
        <div className="mb-9">
          <SecHead title="Latency by endpoint" right="p50 / p95 / p99" />
          <DataTable headers={["Endpoint", "p50", "p95", "p99"]} rows={latRows} />
        </div>
      )}
    </div>
  );
}

// ── Audit tab ────────────────────────────────────────────────────────────────

interface AuditResult { label: string; ok: boolean; detail?: string }

function AuditTab() {
  const { fragrances, compliments } = useData();
  const [results, setResults] = useState<AuditResult[] | null>(null);

  function run() {
    const res: AuditResult[] = [];
    function check(label: string, condition: boolean, detail?: string) {
      res.push({ label, ok: condition, detail });
    }

    check("Supabase URL configured", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    check("Supabase anon key configured", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    check("fragrances loaded", fragrances.length > 0, fragrances.length + " total");
    check("compliments loaded", compliments.length >= 0, compliments.length + " total");

    const fragIds = fragrances.map((f) => f.fragranceId ?? f.id);

    const fragIssues: string[] = [];
    for (const f of fragrances) {
      if (!f.id) fragIssues.push("missing id: " + f.name);
      if (!f.name) fragIssues.push("missing name: " + f.id);
      if (!f.userId) fragIssues.push("missing userId: " + f.name);
      if (!f.status) fragIssues.push("missing status: " + f.name);
    }
    check("All fragrances have required fields", fragIssues.length === 0, fragIssues.length ? fragIssues.join(", ") : "all clean");

    const missingType = fragrances.filter((f) => !f.type);
    check("All fragrances have type set", missingType.length === 0, missingType.length ? missingType.map((f) => f.name).join(", ") : "all have type");

    const orphanedComps = compliments.filter((c) => c.primaryFragId && !fragIds.includes(c.primaryFragId));
    check("No orphaned compliments", orphanedComps.length === 0, orphanedComps.length ? orphanedComps.map((c) => c.id).join(", ") : "all linked");

    const compIssues: string[] = [];
    for (const c of compliments) {
      if (!c.id) compIssues.push("missing id");
      if (!c.primaryFrag) compIssues.push("missing frag name: " + c.id);
      if (!c.relation) compIssues.push("missing relation: " + c.id);
      if (!c.month || !c.year) compIssues.push("missing date: " + c.id);
    }
    check("All compliments have required fields", compIssues.length === 0, compIssues.length ? compIssues.join(", ") : "all clean");

    const fragKeys: Record<string, boolean> = {};
    const dupes: string[] = [];
    for (const f of fragrances) {
      const key = (f.name || "").toLowerCase().trim() + "|" + (f.type || "");
      if (fragKeys[key]) dupes.push(f.name + " (" + (f.type || "no type") + ")");
      else fragKeys[key] = true;
    }
    check("No duplicate name+type combos", dupes.length === 0, dupes.length ? dupes.join(", ") : "none found");

    setResults(res);
  }

  const pass = results?.filter((r) => r.ok).length ?? 0;
  const fail = results?.filter((r) => !r.ok).length ?? 0;

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={run}
          className="font-[var(--adm-mono)] text-[11px] tracking-[0.1em] uppercase px-5 py-2.5 bg-[var(--adm-fg)] text-[var(--adm-bg)] hover:bg-[var(--adm-fg2)] transition-colors"
        >
          Run Audit
        </button>
        {results && (
          <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] ml-4">
            {pass} passed, {fail} failed
          </span>
        )}
      </div>

      {results && (
        <div className="flex flex-col">
          {results.map((r, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2 border-b border-[var(--adm-border2)] font-[var(--adm-mono)] text-[11px] hover:bg-[var(--adm-bg2)]">
              <span className={`shrink-0 font-medium ${r.ok ? "text-[var(--adm-green)]" : "text-[var(--adm-red)]"}`}>
                {r.ok ? "PASS" : "FAIL"}
              </span>
              <span className="text-[var(--adm-fg2)]">{r.label}</span>
              {r.detail && <span className="text-[var(--adm-fg4)] ml-auto shrink-0 text-right max-w-[200px] truncate">{r.detail}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Flags tab ────────────────────────────────────────────────────────────────

interface CommunityFlag {
  id: string;
  userId: string;
  fragranceName: string;
  fragranceHouse: string;
  fieldFlagged: string;
  userNote: string | null;
  resolved: boolean;
  createdAt: string;
}

function FlagsTab({ flags, users, onResolve }: { flags: CommunityFlag[]; users: AdminUser[]; onResolve: (id: string) => void }) {
  const open = flags.filter((f) => !f.resolved);
  const resolved = flags.filter((f) => f.resolved);
  const [showResolved, setShowResolved] = useState(false);
  const displayed = showResolved ? flags : open;

  return (
    <div>
      <BigNumGrid items={[
        { val: String(open.length), label: "Open flags" },
        { val: String(resolved.length), label: "Resolved" },
        { val: String(flags.length), label: "Total" },
        { val: flags.length > 0 ? open.length === 0 ? "Clean" : "Needs review" : "—", label: "Status", valClass: open.length === 0 ? "text-[var(--adm-green)]" : "text-[var(--adm-red)]" },
      ]} />

      <div className="mb-4 flex items-center gap-4">
        <SecHead title={showResolved ? "All flags" : "Open flags"} />
        <button
          onClick={() => setShowResolved((v) => !v)}
          className="font-[var(--adm-mono)] text-[10px] tracking-[0.1em] uppercase text-[var(--adm-fg4)] hover:text-[var(--adm-fg)] transition-colors border-none bg-none cursor-pointer p-0 mb-4"
        >
          {showResolved ? "Hide resolved" : "Show resolved"}
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] py-3">
          {open.length === 0 ? "No open flags." : "No flags yet."}
        </div>
      ) : (
        <div className="flex flex-col">
          {displayed.map((f) => (
            <div key={f.id} className="flex items-start gap-3 px-3 py-3 border-b border-[var(--adm-border2)] hover:bg-[var(--adm-bg2)]">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-[var(--adm-mono)] text-xs text-[var(--adm-fg)] font-medium">{f.fragranceName}</span>
                  <span className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)]">{f.fragranceHouse}</span>
                  <span className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg3)] border border-[var(--adm-border)] px-1.5 py-0.5">{f.fieldFlagged}</span>
                </div>
                {f.userNote && (
                  <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg2)] mt-1">{f.userNote}</div>
                )}
                <div className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] mt-1">
                  {userName(f.userId, users)} &middot; {new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
              {!f.resolved && (
                <button
                  onClick={() => onResolve(f.id)}
                  className="font-[var(--adm-mono)] text-[10px] tracking-[0.08em] uppercase text-[var(--adm-green)] border border-[var(--adm-green)] px-2.5 py-1 hover:bg-[var(--adm-green)] hover:text-[var(--adm-bg)] transition-colors shrink-0"
                >
                  Resolve
                </button>
              )}
              {f.resolved && (
                <span className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-green)] shrink-0">Resolved</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab({ users, currentUserId, onToggleAdmin }: {
  users: AdminUser[];
  currentUserId: string;
  onToggleAdmin: (id: string, current: boolean) => void;
}) {
  return (
    <div>
      <BigNumGrid items={[
        { val: String(users.length), label: "Total users" },
        { val: String(users.filter((u) => u.isAdmin).length), label: "Admins" },
      ]} />
      <SecHead title="User Access" />
      <div className="flex flex-col">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-3 py-3 border-b border-[var(--adm-border2)] hover:bg-[var(--adm-bg2)]">
            <div>
              <div className="font-[var(--adm-mono)] text-xs text-[var(--adm-fg)] font-medium">{u.name ?? u.displayName ?? u.id}</div>
              <div className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] mt-0.5">{u.email}</div>
            </div>
            <div className="flex items-center gap-3">
              {u.isAdmin && (
                <span className="font-[var(--adm-mono)] text-[10px] tracking-[0.1em] uppercase text-[var(--adm-green)] border border-[var(--adm-green)] px-2 py-0.5">Admin</span>
              )}
              {u.id !== currentUserId && (
                <button
                  onClick={() => onToggleAdmin(u.id!, u.isAdmin ?? false)}
                  className="font-[var(--adm-mono)] text-[10px] tracking-[0.08em] uppercase text-[var(--adm-fg4)] border border-[var(--adm-border)] px-2.5 py-1 hover:border-[var(--adm-fg)] hover:text-[var(--adm-fg)] transition-colors"
                >
                  {u.isAdmin ? "Revoke admin" : "Grant admin"}
                </button>
              )}
              {u.id === currentUserId && (
                <span className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] italic">you</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Data Quality tab ──────────────────────────────────────────────────────────

function DataQualityTab({ frags }: { frags: DQFrag[] }) {
  const missingAccords = frags.filter((f) => f.missingAccords);
  const missingNotes = frags.filter((f) => f.missingNotes);
  const missingBoth = frags.filter((f) => f.missingAccords && f.missingNotes);
  const [filter, setFilter] = useState<"accords" | "notes" | "both">("accords");

  const displayed = filter === "accords" ? missingAccords : filter === "notes" ? missingNotes : missingBoth;

  return (
    <div>
      <BigNumGrid items={[
        { val: String(frags.length), label: "Total in library" },
        { val: String(missingAccords.length), label: "Missing accords", valClass: missingAccords.length > 0 ? "text-[var(--adm-red)]" : "text-[var(--adm-green)]" },
        { val: String(missingNotes.length), label: "Missing notes", valClass: missingNotes.length > 0 ? "text-[var(--adm-red)]" : "text-[var(--adm-green)]" },
        { val: String(missingBoth.length), label: "Missing both" },
      ]} />

      <div className="flex items-center gap-1 mb-5">
        {(["accords", "notes", "both"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-[var(--adm-mono)] text-[10px] tracking-[0.1em] uppercase px-3 py-1 border transition-colors ${filter === f ? "border-[var(--adm-fg)] bg-[var(--adm-fg)] text-[var(--adm-bg)]" : "border-[var(--adm-border)] text-[var(--adm-fg4)] hover:text-[var(--adm-fg)]"}`}
          >
            Missing {f}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-green)] py-3">All fragrances have {filter} data.</div>
      ) : (
        <DataTable
          headers={["Fragrance", "House", "Accords", "Notes"]}
          rows={displayed.map((f) => [
            f.name,
            f.house,
            f.missingAccords ? <span className="text-[var(--adm-red)]">missing</span> : <span className="text-[var(--adm-green)]">ok</span>,
            f.missingNotes ? <span className="text-[var(--adm-red)]">missing</span> : <span className="text-[var(--adm-green)]">ok</span>,
          ])}
        />
      )}
    </div>
  );
}

// ── Admin page ───────────────────────────────────────────────────────────────

const TABS = ["Spend", "Usage", "Errors", "Audit", "Flags", "Users", "Data Quality"] as const;
type TabId = typeof TABS[number];

interface AdminData {
  apiLogs: ApiLog[];
  activityLogs: ActivityLog[];
  users: AdminUser[];
  flags: CommunityFlag[];
  dqFrags: DQFrag[];
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("Spend");
  const [data, setData] = useState<AdminData>({ apiLogs: [], activityLogs: [], users: [], flags: [], dqFrags: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && (!user || !user.isAdmin)) router.replace("/dashboard");
  }, [isLoaded, user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [apiRes, actRes, profilesRes, flagsRes, fragsRes] = await Promise.all([
        supabase.from("api_log").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }),
        supabase.from("user_profiles").select("id, name, email, created_at, is_admin"),
        supabase.from("community_flags").select("*").order("created_at", { ascending: false }),
        supabase.from("fragrances").select("id, name, house, accords, top_notes"),
      ]);
      const mapApiLog = (r: Record<string, unknown>): ApiLog => ({
        timestamp: (r.created_at as string) ?? "",
        feature: (r.feature as string) ?? "",
        userId: (r.user_id as string) ?? "",
        status: (r.status as string) ?? "ok",
        tokensIn: String(r.tokens_in ?? ""),
        tokensOut: String(r.tokens_out ?? ""),
        costUsd: String(r.cost_usd ?? ""),
        latencyMs: String(r.latency_ms ?? ""),
        error: r.status === "error" ? "true" : undefined,
        errorMessage: (r.error_message as string) ?? undefined,
      });
      const mapActivityLog = (r: Record<string, unknown>): ActivityLog => ({
        timestamp: (r.created_at as string) ?? "",
        userId: (r.user_id as string) ?? "",
        actionType: (r.action_type as string) ?? "",
      });
      const mapProfile = (r: Record<string, unknown>): AdminUser => ({
        id: r.id as string,
        userId: r.id as string,
        name: r.name as string,
        displayName: r.name as string,
        email: r.email as string,
        isAdmin: (r.is_admin as boolean) ?? false,
      });
      const mapDQFrag = (r: Record<string, unknown>): DQFrag => ({
        id: r.id as string,
        name: r.name as string,
        house: r.house as string,
        missingAccords: !r.accords || (r.accords as string[]).length === 0,
        missingNotes: !r.top_notes || (r.top_notes as string[]).length === 0,
      });
      const mapFlag = (r: Record<string, unknown>): CommunityFlag => ({
        id: r.id as string,
        userId: r.user_id as string,
        fragranceName: r.fragrance_name as string,
        fragranceHouse: r.fragrance_house as string,
        fieldFlagged: r.field_flagged as string,
        userNote: (r.user_note as string) ?? null,
        resolved: (r.resolved as boolean) ?? false,
        createdAt: r.created_at as string,
      });
      const allDQFrags = (fragsRes.data ?? []).map(mapDQFrag);
      setData({
        apiLogs: (apiRes.data ?? []).map(mapApiLog),
        activityLogs: (actRes.data ?? []).map(mapActivityLog),
        users: (profilesRes.data ?? []).map(mapProfile),
        flags: (flagsRes.data ?? []).map(mapFlag),
        dqFrags: allDQFrags.filter((f) => f.missingAccords || f.missingNotes),
      });
      setLastSync("Just now");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function resolveFlag(id: string) {
    await supabase.from("community_flags").update({ resolved: true }).eq("id", id);
    setData((prev) => ({
      ...prev,
      flags: prev.flags.map((f) => f.id === id ? { ...f, resolved: true } : f),
    }));
  }

  async function toggleAdmin(id: string, current: boolean) {
    await supabase.from("user_profiles").update({ is_admin: !current }).eq("id", id);
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) => u.id === id ? { ...u, isAdmin: !current } : u),
    }));
  }

  if (!isLoaded || !user?.isAdmin) return null;

  const errors24h = data.apiLogs.filter((l) => {
    return (Date.now() - new Date(l.timestamp).getTime()) < 86_400_000 && isError(l);
  }).length;

  return (
    <div className="flex flex-col h-full bg-[var(--adm-bg)] font-[var(--adm-mono)]">
      {/* Admin header */}
      <div className="border-b-2 border-[var(--adm-fg)] px-8 py-5 flex justify-between items-start shrink-0">
        <div>
          <div className="font-[var(--adm-mono)] text-[22px] font-bold tracking-[0.04em] text-[var(--adm-fg)] leading-none mb-1">
            Admin
          </div>
          {lastSync && (
            <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] tracking-[0.06em]">
              Last sync: {lastSync}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)]">{user?.name}</span>
          <button
            onClick={load}
            className="font-[var(--adm-mono)] text-[11px] font-medium tracking-[0.1em] uppercase bg-[var(--adm-fg)] text-[var(--adm-bg)] px-4 py-1.5 hover:opacity-80 transition-opacity"
          >
            Sync Now
          </button>
          <Link
            href="/dashboard"
            className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg3)] border border-[var(--adm-border)] px-3 py-1.5 tracking-[0.1em] uppercase hover:bg-[var(--adm-fg)] hover:text-[var(--adm-bg)] transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Status banner */}
      {!loading && (
        <div className={`px-8 py-3 flex items-center gap-3 text-[11px] tracking-[0.06em] ${errors24h > 0 ? "bg-[var(--adm-red-bg)] border-l-[3px] border-[var(--adm-red)] text-[var(--adm-red)]" : "bg-[var(--adm-green-bg)] border-l-[3px] border-[var(--adm-green)] text-[var(--adm-green)]"}`}>
          <div className={`w-2 h-2 rounded-full ${errors24h > 0 ? "bg-[var(--adm-red)]" : "bg-[var(--adm-green)]"}`} />
          {errors24h > 0 ? `${errors24h} error${errors24h !== 1 ? "s" : ""} in last 24h. Check Errors tab.` : "All systems operational. 0 errors in last 24h."}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--adm-border)] shrink-0 px-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[10px] tracking-[0.14em] uppercase border-b-2 transition-all ${tab === t ? "border-[var(--adm-fg)] text-[var(--adm-fg)]" : "border-transparent text-[var(--adm-fg4)] hover:text-[var(--adm-fg)]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          {loading && (
            <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] tracking-[0.06em]">Loading...</div>
          )}
          {error && (
            <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-red)] bg-[var(--adm-red-bg)] px-4 py-3 border-l-2 border-[var(--adm-red)]">{error}</div>
          )}
          {!loading && !error && (
            <>
              {tab === "Spend" && <SpendTab apiLogs={data.apiLogs} users={data.users} />}
              {tab === "Usage" && <UsageTab apiLogs={data.apiLogs} activityLogs={data.activityLogs} users={data.users} />}
              {tab === "Errors" && <ErrorsTab apiLogs={data.apiLogs} />}
              {tab === "Audit" && <AuditTab />}
              {tab === "Flags" && <FlagsTab flags={data.flags} users={data.users} onResolve={resolveFlag} />}
              {tab === "Users" && <UsersTab users={data.users} currentUserId={user.id} onToggleAdmin={toggleAdmin} />}
              {tab === "Data Quality" && <DataQualityTab frags={data.dqFrags} />}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--adm-border)] px-8 py-3 flex justify-between font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] tracking-[0.08em] shrink-0">
        <span>tesknota / admin</span>
        <span>api_log · activity_log · community_flags</span>
      </div>
    </div>
  );
}
