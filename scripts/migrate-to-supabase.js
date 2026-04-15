// migrate-to-supabase.js
// Reads Google Sheets data, inserts into Supabase.
// Run once after schema.sql has been applied.
//
// Required env vars (set in your shell before running):
//   SUPABASE_URL              — https://tofzctbkxuzvwirgobgh.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — from Supabase dashboard > Settings > API > service_role secret
//   SPREADSHEET_ID            — 1QUUSvFZvLvdS6b9XZgRfO1JKyqGKWMi4j7HiZuHOyas
//   SA_EMAIL                  — tesknota-sheets@singular-cache-491415-q6.iam.gserviceaccount.com
//   SA_KEY                    — the PEM private key (set as multiline or escaped \n)
//
// Run: node scripts/migrate-to-supabase.js

import { createClient } from "@supabase/supabase-js";
import { createSign } from "crypto";
import https from "https";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SA_EMAIL = process.env.SA_EMAIL;
const SA_KEY = (process.env.SA_KEY || "").replace(/\\n/g, "\n");

const USER_MAP = {
  u1: "7a23b975-5839-473c-9415-9f669938c313", // Kiana
  u2: "3531e75c-05bb-489e-b02c-2cc19b7ddbfd", // Sylvia
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function splitArr(val) {
  if (!val) return [];
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SPREADSHEET_ID || !SA_EMAIL || !SA_KEY) {
  console.error("Missing required env vars. See comments at top of this file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Google Sheets auth ───────────────────────────────────────

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

async function getGoogleToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: SA_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const sig = b64url(signer.sign(SA_KEY));
  const jwt = `${header}.${claim}.${sig}`;

  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const d = await res.json();
  if (!d.access_token) throw new Error("Google auth failed: " + JSON.stringify(d));
  return d.access_token;
}

async function readSheet(token, tabName) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(tabName)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.warn(`  [warn] Sheet "${tabName}" not found or empty (${res.status})`);
    return [];
  }
  const data = await res.json();
  const rows = data.values ?? [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj;
  });
}

function normalizeMonth(m) {
  const n = parseInt(m);
  if (!isNaN(n) && n >= 1 && n <= 12) return MONTHS[n - 1];
  return m;
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("Reading Google Sheets...");
  const token = await getGoogleToken();

  const [fragranceDB, userFragrances, userCompliments, pendingEntries, apiLog, activityLog] =
    await Promise.all([
      readSheet(token, "fragranceDB"),
      readSheet(token, "userFragrances"),
      readSheet(token, "userCompliments"),
      readSheet(token, "pendingEntries").catch(() => []),
      readSheet(token, "api_log").catch(() => []),
      readSheet(token, "activityLog").catch(() => []),
    ]);

  console.log("\n── Row counts from Google Sheets ──────────────────────");
  console.log(`fragranceDB:    ${fragranceDB.length}`);
  console.log(`userFragrances: ${userFragrances.length}`);
  console.log(`userCompliments:${userCompliments.length}`);
  console.log(`pendingEntries: ${pendingEntries.length}`);
  console.log(`api_log:        ${apiLog.length}`);
  console.log(`activityLog:    ${activityLog.length}`);
  console.log("───────────────────────────────────────────────────────\n");

  // ── 1. fragranceDB → fragrances ────────────────────────────

  console.log("Inserting fragrances...");
  const legacyIdToUuid = {};

  for (const r of fragranceDB) {
    const row = {
      legacy_id: r.fragranceId || null,
      name: r.fragranceName || r.name || "",
      house: r.fragranceHouse || r.house || "",
      type: r.fragranceType || null,
      accords: splitArr(r.fragranceAccords),
      top_notes: splitArr(r.topNotes),
      middle_notes: splitArr(r.middleNotes),
      base_notes: splitArr(r.baseNotes),
      avg_price: r.avgPrice || null,
      is_dupe: r.isDupe === "true" || r.isDupe === true,
      dupe_for: r.dupeFor || null,
      community_rating: r.communityRating || null,
      parfumo_rating: r.parfumoRating || null,
      parfumo_longevity: r.parfumoLongevity || null,
      parfumo_sillage: r.parfumoSillage || null,
      community_longevity_label: r.communityLongevityLabel || null,
      community_sillage_label: r.communitySillageLabel || null,
      rating_vote_count: r.ratingVoteCount || null,
      source: "seed",
      added_at: r.addedAt || null,
    };
    if (!row.name || !row.house) continue;

    const { data, error } = await supabase
      .from("fragrances")
      .upsert(row, { onConflict: "legacy_id", ignoreDuplicates: false })
      .select("id, legacy_id")
      .single();

    if (error) {
      // May be a normalized name+house conflict — look up existing
      const { data: existing } = await supabase
        .from("fragrances")
        .select("id, legacy_id")
        .eq("legacy_id", row.legacy_id)
        .maybeSingle();
      if (existing) legacyIdToUuid[r.fragranceId] = existing.id;
      else console.warn(`  [warn] fragrance insert failed: ${row.name} — ${error.message}`);
    } else if (data) {
      legacyIdToUuid[r.fragranceId] = data.id;
    }
  }
  console.log(`  Inserted/mapped ${Object.keys(legacyIdToUuid).length} fragrances`);

  // ── 2. userFragrances → user_fragrances ────────────────────

  console.log("Inserting user_fragrances...");
  let fragCount = 0;

  for (const r of userFragrances) {
    const userId = USER_MAP[r.userId];
    if (!userId) { console.warn(`  [skip] unknown userId: ${r.userId}`); continue; }
    const name = r.fragranceName || r.name || "";
    const house = r.fragranceHouse || r.house || "";
    if (!name) continue;

    const sizes = r.bottleSize
      ? r.bottleSize.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const pm = r.purchaseMonth ?? "";
    const personalNotes = (r.notes ?? "").replace(/^Purchased for \$[\d.]+\.?\s*/, "").trim();

    const row = {
      user_id: userId,
      fragrance_id: legacyIdToUuid[r.fragranceId] ?? null,
      name,
      house,
      status: r.status || "CURRENT",
      sizes,
      type: r.type || null,
      where_bought: r.boughtFrom || null,
      purchase_month: pm || null,
      purchase_year: r.purchaseYear || null,
      purchase_price: r.purchasePrice || null,
      personal_rating: r.personalRating ? parseInt(r.personalRating) : null,
      personal_notes: personalNotes,
      created_at: r.addedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from("user_fragrances").insert(row);
    if (error) console.warn(`  [warn] user_frag insert failed: ${name} — ${error.message}`);
    else fragCount++;
  }
  console.log(`  Inserted ${fragCount} user_fragrances`);

  // ── 3. userCompliments → user_compliments ──────────────────

  console.log("Inserting user_compliments...");
  let compCount = 0;

  for (const r of userCompliments) {
    const userId = USER_MAP[r.userId];
    if (!userId) { console.warn(`  [skip] unknown userId: ${r.userId}`); continue; }

    const row = {
      user_id: userId,
      primary_frag_id: r.primaryFragranceId || null,
      primary_frag_name: r.primaryFragranceName || r.primaryFrag || "",
      secondary_frag_id: r.secondaryFragranceId || null,
      secondary_frag_name: r.secondaryFrag || null,
      gender: r.complimenterGender || null,
      relation: r.relation || "Other",
      month: normalizeMonth(r.month ?? ""),
      year: r.year ?? "",
      location: r.locationName || null,
      city: r.city || null,
      state: r.state || null,
      country: r.country || "US",
      notes: r.notes || null,
      created_at: r.createdAt || new Date().toISOString(),
    };

    if (!row.primary_frag_name || !row.month || !row.year) {
      console.warn(`  [skip] compliment missing required fields: ${JSON.stringify(row)}`);
      continue;
    }

    const { error } = await supabase.from("user_compliments").insert(row);
    if (error) console.warn(`  [warn] compliment insert failed: ${error.message}`);
    else compCount++;
  }
  console.log(`  Inserted ${compCount} user_compliments`);

  // ── 4. pendingEntries → pending_entries ────────────────────

  if (pendingEntries.length) {
    console.log("Inserting pending_entries...");
    let peCount = 0;
    for (const r of pendingEntries) {
      const userId = USER_MAP[r.userId];
      if (!userId) continue;
      let parsedJson = null;
      try { parsedJson = r.parsedJson ? JSON.parse(r.parsedJson) : null; } catch {}
      const row = {
        user_id: userId,
        type: r.type || "unknown",
        status: r.status || "pending",
        raw_transcript: r.rawTranscript || null,
        parsed_json: parsedJson,
        missing_fields: r.missingFields ? r.missingFields.split(",").map((s) => s.trim()).filter(Boolean) : [],
        created_at: r.createdAt || new Date().toISOString(),
        updated_at: r.updatedAt || new Date().toISOString(),
      };
      const { error } = await supabase.from("pending_entries").insert(row);
      if (!error) peCount++;
    }
    console.log(`  Inserted ${peCount} pending_entries`);
  }

  // ── 5. api_log ─────────────────────────────────────────────

  if (apiLog.length) {
    console.log("Inserting api_log...");
    let logCount = 0;
    for (const r of apiLog) {
      const userId = USER_MAP[r.userId] ?? null;
      const row = {
        user_id: userId,
        feature: r.feature || null,
        model: r.model || null,
        tokens_in: r.tokensIn ? parseInt(r.tokensIn) : null,
        tokens_out: r.tokensOut ? parseInt(r.tokensOut) : null,
        cost_usd: r.costUsd ? parseFloat(r.costUsd) : null,
        status: r.status || null,
        created_at: r.timestamp || new Date().toISOString(),
      };
      const { error } = await supabase.from("api_log").insert(row);
      if (!error) logCount++;
    }
    console.log(`  Inserted ${logCount} api_log rows`);
  }

  // ── 6. activityLog → activity_log ──────────────────────────

  if (activityLog.length) {
    console.log("Inserting activity_log...");
    let actCount = 0;
    for (const r of activityLog) {
      const userId = USER_MAP[r.userId] ?? null;
      let metadata = null;
      try { metadata = r.metadata ? JSON.parse(r.metadata) : null; } catch {}
      const row = {
        user_id: userId,
        action_type: r.actionType || null,
        metadata,
        created_at: r.timestamp || new Date().toISOString(),
      };
      const { error } = await supabase.from("activity_log").insert(row);
      if (!error) actCount++;
    }
    console.log(`  Inserted ${actCount} activity_log rows`);
  }

  // ── Verification ────────────────────────────────────────────

  console.log("\n── Row counts in Supabase (post-migration) ────────────");
  const tables = ["fragrances","user_fragrances","user_compliments","pending_entries","api_log","activity_log"];
  for (const t of tables) {
    const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
    console.log(`${t.padEnd(22)} ${count}`);
  }
  console.log("───────────────────────────────────────────────────────");
  console.log("\nMigration complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
