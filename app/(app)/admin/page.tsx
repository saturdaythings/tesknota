"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TabPill } from "@/components/ui/tab-pill";
import Link from "next/link";

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
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
}

interface PendingEntry {
  id: string;
  fragranceName: string;
  house: string | null;
  concentration: string | null;
  requestedBy: string;
  createdAt: string;
  status: string;
}

interface CommunityFlag {
  id: string;
  userId: string;
  fragranceId: string | null;
  fragranceName: string;
  fragranceHouse: string;
  fieldFlagged: string;
  suggestedValue: string | null;
  currentValue: string | null;
  resolved: boolean;
  createdAt: string;
}

interface DQUserFrag {
  id: string;
  name: string;
  house: string;
  userId: string;
  missingNotes: boolean;
  missingRating: boolean;
  missingConcentration: boolean;
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

function userLabel(uid: string, users: AdminUser[]): string {
  const u = users.find((u) => u.id === uid);
  return u?.username ?? u?.name ?? uid;
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
          <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] tracking-[var(--tracking-wide)] mt-1">
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
        <div className="font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] tracking-[var(--tracking-md)] uppercase">{right}</div>
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
                className="font-[var(--adm-mono)] text-[10px] tracking-[var(--tracking-lg)] uppercase text-[var(--adm-fg4)] px-3 py-2 border-b border-[var(--adm-fg)] text-left font-normal"
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
          <div className="grid gap-px bg-[var(--adm-border)] border border-[var(--adm-border)]" style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(userAgg).length, 4)}, 1fr)` }}>
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
                  <div className="font-[var(--adm-mono)] text-[10px] tracking-[var(--tracking-xl)] uppercase text-[var(--adm-fg4)] mb-3 pb-1.5 border-b border-[var(--adm-border2)]">
                    {userLabel(uid, users)}
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

  const allActions: Record<string, boolean> = {};
  const allUserIds = Object.keys(userActionCounts).sort();
  for (const uid of allUserIds) {
    for (const a of Object.keys(userActionCounts[uid])) allActions[a] = true;
  }
  const actionList = Object.keys(allActions).sort();

  const userEvents: Record<string, number[]> = {};
  for (const l of activityLogs) {
    if (!l.timestamp) continue;
    const d = new Date(l.timestamp);
    if (d < thirtyDaysAgo) continue;
    const uid = l.userId || "?";
    if (!userEvents[uid]) userEvents[uid] = [];
    userEvents[uid].push(d.getTime());
  }

  const heatLevels = ["bg-[var(--adm-bg2)]", "bg-[var(--adm-bg3)]", "bg-[var(--adm-heat-1)]", "bg-[var(--adm-heat-2)]", "bg-[var(--adm-heat-3)]", "bg-[var(--adm-fg)]"];
  const CELL = 18;
  const LABEL_W = 40;

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
        <div
          className="grid"
          style={{
            gridTemplateColumns: `${LABEL_W}px repeat(7, ${CELL}px)`,
            gap: "2px",
            width: "fit-content",
          }}
        >
          <div />
          {DAY_ORDER.map((d) => (
            <div key={d} className="font-[var(--adm-mono)] text-[9px] text-[var(--adm-fg4)] text-center pb-1">{DAY_NAMES[d]}</div>
          ))}
          {TIME_BUCKETS.map((tb, bi) => (
            <>
              <div key={tb.label} className="font-[var(--adm-mono)] text-[9px] text-[var(--adm-fg4)] flex items-center">{tb.label}</div>
              {DAY_ORDER.map((di) => {
                const count = heatData[di + "-" + bi] || 0;
                const level = count > 0 ? Math.min(5, Math.ceil((count / heatMax) * 5)) : 0;
                return (
                  <div
                    key={di}
                    className={`cursor-pointer relative group ${heatLevels[level]}`}
                    style={{ width: CELL, height: CELL }}
                  >
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
                  <th className="font-[var(--adm-mono)] text-[10px] tracking-[var(--tracking-lg)] uppercase text-[var(--adm-fg4)] px-3 py-2 border-b border-[var(--adm-fg)] text-left font-normal">Action</th>
                  {allUserIds.map((uid) => (
                    <th key={uid} className="font-[var(--adm-mono)] text-[10px] tracking-[var(--tracking-lg)] uppercase text-[var(--adm-fg4)] px-3 py-2 border-b border-[var(--adm-fg)] text-right font-normal">{userLabel(uid, users)}</th>
                  ))}
                  <th className="font-[var(--adm-mono)] text-[10px] tracking-[var(--tracking-lg)] uppercase text-[var(--adm-fg4)] px-3 py-2 border-b border-[var(--adm-fg)] text-right font-normal">Total</th>
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
          <div className="grid gap-px bg-[var(--adm-border)] border border-[var(--adm-border)]" style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(userEvents).length, 4)}, 1fr)` }}>
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
                  <div className="font-[var(--adm-mono)] text-[10px] tracking-[var(--tracking-xl)] uppercase text-[var(--adm-fg4)] mb-3 pb-1.5 border-b border-[var(--adm-border2)]">
                    {userLabel(uid, users)}
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
        <Button variant="secondary" onClick={run}>Run Audit</Button>
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

// ── Community Flags tab ────────────────────────────────────────────────────────

function FlagsTab({
  flags,
  users,
  onResolve,
  onDismiss,
  onUpdate,
}: {
  flags: CommunityFlag[];
  users: AdminUser[];
  onResolve: (id: string, field: string, fragranceId: string | null, value: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm(flag: CommunityFlag) {
    setSaving(true);
    await onResolve(flag.id, flag.fieldFlagged, flag.fragranceId, editValue);
    setEditId(null);
    setEditValue("");
    setSaving(false);
  }

  const rowStyle: React.CSSProperties = {
    minHeight: "var(--size-row-min)",
    borderBottom: "1px solid var(--color-row-divider)",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
    padding: "var(--space-3) 0",
  };

  return (
    <div>
      <BigNumGrid items={[
        { val: String(flags.length), label: "Pending flags", valClass: flags.length > 0 ? "text-[var(--adm-red)]" : "text-[var(--adm-green)]" },
      ]} />

      {flags.length === 0 ? (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)", padding: "var(--space-6) 0" }}>
          No pending flags.
        </div>
      ) : (
        <div>
          {flags.map((f) => (
            <div key={f.id} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)" }}>
                    {f.fragranceName}
                  </span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                    {f.fragranceHouse}
                  </span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", background: "var(--color-cream-dark)", padding: "2px var(--space-2)", borderRadius: "var(--radius-full)" }}>
                    {f.fieldFlagged}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
                  {f.currentValue !== null && (
                    <div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)", marginBottom: "2px" }}>Current</div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-navy)" }}>{f.currentValue || "—"}</div>
                    </div>
                  )}
                  {f.suggestedValue && (
                    <div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)", marginBottom: "2px" }}>Suggested</div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-navy)" }}>{f.suggestedValue}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)", marginBottom: "2px" }}>Submitted by</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>{userLabel(f.userId, users)}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-meta-text)", marginBottom: "2px" }}>Date</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>{fmtDate(f.createdAt)}</div>
                  </div>
                </div>
                {editId === f.id && (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="New value..."
                      style={{ maxWidth: 280 }}
                    />
                    <Button variant="primary" onClick={() => handleConfirm(f)} disabled={saving || !editValue.trim()}>
                      Confirm
                    </Button>
                    <Button variant="ghost" onClick={() => { setEditId(null); setEditValue(""); }}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              {editId !== f.id && (
                <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0 }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditId(f.id);
                      setEditValue(f.suggestedValue ?? "");
                    }}
                  >
                    Update
                  </Button>
                  <Button variant="ghost" onClick={() => onDismiss(f.id)}>Dismiss</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users & Permissions tab ───────────────────────────────────────────────────

function UsersTab({ users, currentUserId, onToggleAdmin }: {
  users: AdminUser[];
  currentUserId: string;
  onToggleAdmin: (id: string, current: boolean) => void;
}) {
  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div>
      <BigNumGrid items={[
        { val: String(users.length), label: "Total users" },
        { val: String(adminCount), label: "Admins" },
      ]} />
      <SecHead title="Users & Permissions" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              minHeight: "var(--size-row-min)",
              borderBottom: "1px solid var(--color-row-divider)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-3) 0",
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)", marginBottom: "var(--space-1)" }}>
                {[u.name].filter(Boolean).join(" ") || u.id}
              </div>
              {u.username && (
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                  @{u.username}
                </div>
              )}
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
                {u.email}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
              {u.isAdmin && (
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--color-navy)", border: "1px solid var(--color-navy)", borderRadius: "var(--radius-full)", padding: "2px var(--space-2)" }}>
                  Admin
                </span>
              )}
              {u.id === currentUserId ? (
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", fontStyle: "italic" }}>you</span>
              ) : (
                <Button
                  variant="ghost"
                  disabled={u.isAdmin && adminCount <= 1}
                  onClick={() => onToggleAdmin(u.id, u.isAdmin)}
                >
                  {u.isAdmin ? "Revoke Admin" : "Grant Admin"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Data Quality tab ──────────────────────────────────────────────────────────

type DQFilter = "notes" | "rating" | "concentration" | "both";

const DQ_OPTIONS = [
  { value: "notes", label: "Missing Notes" },
  { value: "rating", label: "Missing Rating" },
  { value: "concentration", label: "Missing Concentration" },
  { value: "both", label: "Missing Rating & Concentration" },
];

function DataQualityTab({ frags }: { frags: DQUserFrag[] }) {
  const [filter, setFilter] = useState<DQFilter>("rating");

  const displayed = frags.filter((f) => {
    if (filter === "notes") return f.missingNotes;
    if (filter === "rating") return f.missingRating;
    if (filter === "concentration") return f.missingConcentration;
    return f.missingRating && f.missingConcentration;
  });

  const missingNotes = frags.filter((f) => f.missingNotes).length;
  const missingRating = frags.filter((f) => f.missingRating).length;
  const missingConc = frags.filter((f) => f.missingConcentration).length;
  const missingBoth = frags.filter((f) => f.missingRating && f.missingConcentration).length;

  const rowStyle: React.CSSProperties = {
    minHeight: "var(--size-row-min)",
    borderBottom: "1px solid var(--color-row-divider)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-4)",
  };

  return (
    <div>
      <BigNumGrid items={[
        { val: String(frags.length), label: "Total user frags" },
        { val: String(missingRating), label: "Missing rating", valClass: missingRating > 0 ? "text-[var(--adm-red)]" : "text-[var(--adm-green)]" },
        { val: String(missingConc), label: "Missing concentration", valClass: missingConc > 0 ? "text-[var(--adm-red)]" : "text-[var(--adm-green)]" },
        { val: String(missingNotes), label: "Missing notes", valClass: missingNotes > 0 ? "text-[var(--adm-red)]" : "text-[var(--adm-green)]" },
      ]} />

      <div style={{ marginBottom: "var(--space-5)", maxWidth: 260 }}>
        <Select options={DQ_OPTIONS} value={filter} onChange={(v) => setFilter(v as DQFilter)} />
      </div>

      {displayed.length === 0 ? (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)", padding: "var(--space-6) 0" }}>
          No records match this filter.
        </div>
      ) : (
        <div>
          {displayed.map((f) => (
            <div key={f.id} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.name}
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)" }}>
                  {f.house}
                </div>
              </div>
              <Link href={`/import?name=${encodeURIComponent(f.name)}`}>
                <Button variant="ghost">Fix</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pending Entries tab ───────────────────────────────────────────────────────

function PendingEntriesTab({
  entries,
  users,
  onDismiss,
}: {
  entries: PendingEntry[];
  users: AdminUser[];
  onDismiss: (id: string) => Promise<void>;
}) {
  const rowStyle: React.CSSProperties = {
    minHeight: "var(--size-row-min)",
    borderBottom: "1px solid var(--color-row-divider)",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
  };

  return (
    <div>
      <BigNumGrid items={[
        { val: String(entries.length), label: "Pending requests", valClass: entries.length > 0 ? "text-[var(--adm-red)]" : "text-[var(--adm-green)]" },
      ]} />

      {entries.length === 0 ? (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)", padding: "var(--space-6) 0" }}>
          No pending requests.
        </div>
      ) : (
        <div>
          {entries.map((e) => (
            <div key={e.id} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-note)", color: "var(--color-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.fragranceName}
                </span>
                {e.house && (
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)", flexShrink: 0 }}>
                    {e.house}
                  </span>
                )}
                {e.concentration && (
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", flexShrink: 0 }}>
                    {e.concentration}
                  </span>
                )}
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", flexShrink: 0 }}>
                  {userLabel(e.requestedBy, users)}
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", flexShrink: 0 }}>
                  {fmtDate(e.createdAt)}
                </span>
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0 }}>
                <Link href={`/import?name=${encodeURIComponent(e.fragranceName)}`}>
                  <Button variant="secondary">Import</Button>
                </Link>
                <Button variant="ghost" onClick={() => onDismiss(e.id)}>Dismiss</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dev Bot tab ───────────────────────────────────────────────────────────────

interface ChatMessage { role: "bot" | "user"; text: string }
interface HistoryEntry { role: "user" | "assistant"; content: string }

function DevBotTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    const outHistory: HistoryEntry[] = [...history, { role: "user", content: text }];
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/dev-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ message: text, history, userId }),
      });
      const data = await res.json();
      const reply: string = data.reply ?? (data.error ? `Error: ${data.error}` : "No reply");
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      setHistory([...outHistory, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "bot", text: "Error: " + (e instanceof Error ? e.message : "unknown") }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "640px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid var(--color-cream-dark)",
        flexShrink: 0,
        marginBottom: "0",
      }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-note)", fontStyle: "italic", color: "var(--color-navy)" }}>
          dev assistant
        </div>
        {loading && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}>
            thinking...
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.length === 0 && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)", padding: "var(--space-4) 0" }}>
            Ask me to read a file, propose a code change, or push a commit. I'll always show you the diff first.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              maxWidth: "85%",
              padding: "10px 14px",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-sm)",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              alignSelf: m.role === "bot" ? "flex-start" : "flex-end",
              background: m.role === "bot" ? "var(--color-cream-dark)" : "var(--color-navy)",
              color: m.role === "bot" ? "var(--color-navy)" : "var(--color-cream)",
              borderRadius: m.role === "bot" ? "2px 12px 12px 2px" : "12px 2px 2px 12px",
            }}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "8px 0 0",
        borderTop: "1px solid var(--color-cream-dark)",
        flexShrink: 0,
        display: "flex",
        gap: "8px",
      }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask anything about the codebase..."
          disabled={loading}
        />
        <Button variant="primary" onClick={send} disabled={!input.trim() || loading}>
          Send
        </Button>
      </div>
    </div>
  );
}

// ── Admin page ───────────────────────────────────────────────────────────────

const TABS = ["Spend", "Usage", "Errors", "Audit", "Community Flags", "Users & Permissions", "Data Quality", "Pending Entries", "Dev Bot"] as const;
type TabId = typeof TABS[number];

interface AdminData {
  apiLogs: ApiLog[];
  activityLogs: ActivityLog[];
  users: AdminUser[];
  flags: CommunityFlag[];
  dqFrags: DQUserFrag[];
  pendingEntries: PendingEntry[];
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("Spend");
  const [data, setData] = useState<AdminData>({ apiLogs: [], activityLogs: [], users: [], flags: [], dqFrags: [], pendingEntries: [] });
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
      const [apiRes, actRes, profilesRes, flagsRes, userFragsRes, pendingRes] = await Promise.all([
        supabase.from("api_log").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, first_name, last_name, username, email, is_admin"),
        supabase.from("community_flags").select("*").eq("resolved", false).order("created_at", { ascending: false }),
        supabase.from("user_fragrances").select("id, name, house, user_id, personal_notes, personal_rating, type").order("created_at", { ascending: false }),
        supabase.from("pending_entries").select("*").eq("status", "pending").order("created_at", { ascending: false }),
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
        username: (r.username as string) ?? null,
        name: [r.first_name, r.last_name].filter(Boolean).join(" ") || null,
        email: (r.email as string) ?? null,
        isAdmin: (r.is_admin as boolean) ?? false,
      });

      const flags = (flagsRes.data ?? []).map((r): CommunityFlag => ({
        id: r.id as string,
        userId: r.user_id as string,
        fragranceId: (r.fragrance_id as string) ?? null,
        fragranceName: r.fragrance_name as string,
        fragranceHouse: (r.fragrance_house as string) ?? "",
        fieldFlagged: r.field_flagged as string,
        suggestedValue: (r.user_note as string) ?? null,
        currentValue: null,
        resolved: (r.resolved as boolean) ?? false,
        createdAt: r.created_at as string,
      }));

      // Enrich flags with current field values from fragrances table
      const fragranceIds = [...new Set(flags.map((f) => f.fragranceId).filter(Boolean) as string[])];
      if (fragranceIds.length > 0) {
        const { data: fragData } = await supabase
          .from("fragrances")
          .select("id, accords, top_notes, middle_notes, base_notes, type, description")
          .in("id", fragranceIds);
        const fragMap: Record<string, Record<string, unknown>> = {};
        (fragData ?? []).forEach((f) => { fragMap[f.id as string] = f as Record<string, unknown>; });
        flags.forEach((flag) => {
          if (!flag.fragranceId || !fragMap[flag.fragranceId]) return;
          const frag = fragMap[flag.fragranceId];
          const raw = frag[flag.fieldFlagged as string];
          if (Array.isArray(raw)) flag.currentValue = raw.join(", ");
          else if (raw != null) flag.currentValue = String(raw);
          else flag.currentValue = "";
        });
      }

      const dqFrags = (userFragsRes.data ?? []).map((r): DQUserFrag => ({
        id: r.id as string,
        name: r.name as string,
        house: (r.house as string) ?? "",
        userId: r.user_id as string,
        missingNotes: !r.personal_notes || (r.personal_notes as string).trim() === "",
        missingRating: r.personal_rating == null,
        missingConcentration: !r.type,
      }));

      const mapPendingEntry = (r: Record<string, unknown>): PendingEntry => ({
        id: r.id as string,
        fragranceName: r.fragrance_name as string,
        house: (r.house as string) ?? null,
        concentration: (r.concentration as string) ?? null,
        requestedBy: r.requested_by as string,
        createdAt: r.created_at as string,
        status: (r.status as string) ?? "pending",
      });

      setData({
        apiLogs: (apiRes.data ?? []).map(mapApiLog),
        activityLogs: (actRes.data ?? []).map(mapActivityLog),
        users: (profilesRes.data ?? []).map(mapProfile),
        flags,
        dqFrags,
        pendingEntries: (pendingRes.data ?? []).map(mapPendingEntry),
      });
      setLastSync(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function resolveFlag(id: string, field: string, fragranceId: string | null, value: string) {
    if (fragranceId && field && value.trim()) {
      const updatePayload: Record<string, unknown> = {};
      const v = value.trim();
      // Array fields: split by comma
      const arrayFields = ["accords", "top_notes", "middle_notes", "base_notes"];
      if (arrayFields.includes(field)) {
        updatePayload[field] = v.split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        updatePayload[field] = v;
      }
      await supabase.from("fragrances").update(updatePayload).eq("id", fragranceId);
    }
    await supabase.from("community_flags").update({ resolved: true }).eq("id", id);
    setData((prev) => ({ ...prev, flags: prev.flags.filter((f) => f.id !== id) }));
  }

  async function dismissFlag(id: string) {
    await supabase.from("community_flags").update({ resolved: true }).eq("id", id);
    setData((prev) => ({ ...prev, flags: prev.flags.filter((f) => f.id !== id) }));
  }

  async function toggleAdmin(id: string, current: boolean) {
    const adminCount = data.users.filter((u) => u.isAdmin).length;
    if (current && adminCount <= 1) return;
    await supabase.from("profiles").update({ is_admin: !current }).eq("id", id);
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) => u.id === id ? { ...u, isAdmin: !current } : u),
    }));
  }

  async function dismissPendingEntry(id: string) {
    await supabase.from("pending_entries").update({ status: "dismissed" }).eq("id", id);
    setData((prev) => ({
      ...prev,
      pendingEntries: prev.pendingEntries.filter((e) => e.id !== id),
    }));
  }

  if (!isLoaded || !user?.isAdmin) return null;

  const errors24h = data.apiLogs.filter((l) => {
    return (Date.now() - new Date(l.timestamp).getTime()) < 86_400_000 && isError(l);
  }).length;

  return (
    <div className="flex flex-col h-full bg-[var(--adm-bg)] font-[var(--adm-mono)]">
      <div className="border-b-2 border-[var(--adm-fg)] px-8 py-5 flex justify-between items-start shrink-0">
        <div>
          <div className="font-[var(--adm-mono)] text-[22px] font-bold tracking-[var(--tracking-xs)] text-[var(--adm-fg)] leading-none mb-1">
            Admin Dashboard
          </div>
          {lastSync && (
            <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] tracking-[var(--tracking-base)]">
              Last sync: {lastSync}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)]">{user?.name}</span>
          <Button variant="secondary" size="sm" onClick={load}>Sync Now</Button>
        </div>
      </div>

      {!loading && (
        <div className={`px-8 py-3 flex items-center gap-3 text-[11px] tracking-[var(--tracking-base)] ${errors24h > 0 ? "bg-[var(--adm-red-bg)] border-l-[3px] border-[var(--adm-red)] text-[var(--adm-red)]" : "bg-[var(--adm-green-bg)] border-l-[3px] border-[var(--adm-green)] text-[var(--adm-green)]"}`}>
          <div className={`w-2 h-2 rounded-full ${errors24h > 0 ? "bg-[var(--adm-red)]" : "bg-[var(--adm-green)]"}`} />
          {errors24h > 0 ? `${errors24h} error${errors24h !== 1 ? "s" : ""} in last 24h. Check Errors tab.` : "All systems operational. 0 errors in last 24h."}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-[var(--adm-border)] shrink-0 px-8 py-2">
        {TABS.map((t) => (
          <TabPill key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          {loading && (
            <div className="font-[var(--adm-mono)] text-[11px] text-[var(--adm-fg4)] tracking-[var(--tracking-base)]">Loading...</div>
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
              {tab === "Community Flags" && (
                <FlagsTab
                  flags={data.flags}
                  users={data.users}
                  onResolve={resolveFlag}
                  onDismiss={dismissFlag}
                />
              )}
              {tab === "Users & Permissions" && (
                <UsersTab users={data.users} currentUserId={user.id} onToggleAdmin={toggleAdmin} />
              )}
              {tab === "Data Quality" && <DataQualityTab frags={data.dqFrags} />}
              {tab === "Pending Entries" && (
                <PendingEntriesTab entries={data.pendingEntries} users={data.users} onDismiss={dismissPendingEntry} />
              )}
              {tab === "Dev Bot" && <DevBotTab userId={user.id} />}
            </>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--adm-border)] px-8 py-3 flex justify-between font-[var(--adm-mono)] text-[10px] text-[var(--adm-fg4)] tracking-[var(--tracking-wide)] shrink-0">
        <span>tesknota / admin</span>
        <span>api_log · activity_log · community_flags · pending_entries</span>
      </div>
    </div>
  );
}
