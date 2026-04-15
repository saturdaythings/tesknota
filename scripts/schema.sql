-- ============================================================
-- tesknota — Supabase schema
-- Run via: supabase db query --db-url "$DB_URL" -f scripts/schema.sql
-- Project: tofzctbkxuzvwirgobgh
-- ============================================================

-- ── Drop existing tables (safe re-run) ───────────────────────
DROP TABLE IF EXISTS activity_log      CASCADE;
DROP TABLE IF EXISTS api_log           CASCADE;
DROP TABLE IF EXISTS pending_entries   CASCADE;
DROP TABLE IF EXISTS user_compliments  CASCADE;
DROP TABLE IF EXISTS user_fragrances   CASCADE;
DROP TABLE IF EXISTS fragrances        CASCADE;
DROP TABLE IF EXISTS user_profiles     CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS touch_updated_at CASCADE;

-- ── 1. user_profiles ────────────────────────────────────────

CREATE TABLE user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO user_profiles (id, name, email) VALUES
  ('7a23b975-5839-473c-9415-9f669938c313', 'Kiana',  'kianamicari1@gmail.com'),
  ('3531e75c-05bb-489e-b02c-2cc19b7ddbfd', 'Sylvia', 'sylvia.m.safin@gmail.com');

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "own_profile_insert"   ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update"   ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. fragrances (shared community cache) ───────────────────

CREATE TABLE fragrances (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id                 TEXT UNIQUE,
  name                      TEXT NOT NULL,
  house                     TEXT NOT NULL,
  name_normalized           TEXT GENERATED ALWAYS AS (lower(regexp_replace(name,  '[^a-zA-Z0-9]', '', 'g'))) STORED,
  house_normalized          TEXT GENERATED ALWAYS AS (lower(regexp_replace(house, '[^a-zA-Z0-9]', '', 'g'))) STORED,
  type                      TEXT,
  accords                   TEXT[] NOT NULL DEFAULT '{}',
  top_notes                 TEXT[] NOT NULL DEFAULT '{}',
  middle_notes              TEXT[] NOT NULL DEFAULT '{}',
  base_notes                TEXT[] NOT NULL DEFAULT '{}',
  avg_price                 TEXT,
  is_dupe                   BOOLEAN NOT NULL DEFAULT false,
  dupe_for                  TEXT,
  community_rating          TEXT,
  parfumo_rating            TEXT,
  parfumo_longevity         TEXT,
  parfumo_sillage           TEXT,
  community_longevity_label TEXT,
  community_sillage_label   TEXT,
  rating_vote_count         TEXT,
  source                    TEXT NOT NULL DEFAULT 'seed',
  fragrantica_url           TEXT,
  added_at                  TIMESTAMPTZ DEFAULT now(),
  last_fetched_at           TIMESTAMPTZ,
  UNIQUE (name_normalized, house_normalized)
);

ALTER TABLE fragrances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_fragrances" ON fragrances FOR SELECT USING (auth.uid() IS NOT NULL);

-- Array search indexes (GIN required for @> and ANY())
CREATE INDEX fragrances_accords_gin     ON fragrances USING GIN (accords);
CREATE INDEX fragrances_top_notes_gin   ON fragrances USING GIN (top_notes);
CREATE INDEX fragrances_mid_notes_gin   ON fragrances USING GIN (middle_notes);
CREATE INDEX fragrances_base_notes_gin  ON fragrances USING GIN (base_notes);

-- ── 3. user_fragrances ──────────────────────────────────────

CREATE TABLE user_fragrances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id    UUID REFERENCES fragrances(id),
  name            TEXT NOT NULL,
  house           TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN (
    'CURRENT','PREVIOUSLY_OWNED','WANT_TO_BUY',
    'WANT_TO_SMELL','DONT_LIKE','WANT_TO_IDENTIFY','FINISHED'
  )),
  sizes           TEXT[] NOT NULL DEFAULT '{}',
  type            TEXT,
  where_bought    TEXT,
  purchase_month  TEXT,
  purchase_year   TEXT,
  purchase_price  TEXT,
  personal_rating SMALLINT CHECK (personal_rating BETWEEN 0 AND 5),
  personal_notes  TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_fragrances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_user_fragrances"  ON user_fragrances FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "own_insert_user_fragrances" ON user_fragrances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update_user_fragrances" ON user_fragrances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete_user_fragrances" ON user_fragrances FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX uf_user_status  ON user_fragrances (user_id, status);
CREATE INDEX uf_user_created ON user_fragrances (user_id, created_at DESC);
CREATE INDEX uf_fragrance_id ON user_fragrances (fragrance_id);

-- ── 4. user_compliments ─────────────────────────────────────

CREATE TABLE user_compliments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_frag_id     TEXT,
  primary_frag_name   TEXT NOT NULL,
  secondary_frag_id   TEXT,
  secondary_frag_name TEXT,
  gender              TEXT CHECK (gender IN ('Female', 'Male')),
  relation            TEXT NOT NULL,
  month               TEXT NOT NULL,
  year                TEXT NOT NULL,
  location            TEXT,
  city                TEXT,
  state               TEXT,
  country             TEXT NOT NULL DEFAULT 'US',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_compliments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_user_compliments"  ON user_compliments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "own_insert_user_compliments" ON user_compliments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update_user_compliments" ON user_compliments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete_user_compliments" ON user_compliments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX uc_user_created ON user_compliments (user_id, created_at DESC);
CREATE INDEX uc_user_year    ON user_compliments (user_id, year, month);
CREATE INDEX uc_frag_id      ON user_compliments (primary_frag_id);

-- ── 5. pending_entries ──────────────────────────────────────

CREATE TABLE pending_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  raw_transcript TEXT,
  parsed_json    JSONB,
  missing_fields TEXT[] NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pending_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_pending_entries" ON pending_entries FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER pending_entries_updated_at
  BEFORE UPDATE ON pending_entries
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── 6. api_log ──────────────────────────────────────────────

CREATE TABLE api_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  feature       TEXT,
  model         TEXT,
  tokens_in     INT,
  tokens_out    INT,
  cost_usd      NUMERIC(10,6),
  latency_ms    INT,
  status        TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE api_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_api_log" ON api_log FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── 7. activity_log ─────────────────────────────────────────

CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  action_type TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_activity_log" ON activity_log FOR SELECT USING (auth.uid() IS NOT NULL);
