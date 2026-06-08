-- supabase/migrations/20260520_client_water_logs.sql
-- Fast water logging table — decoupled from nutrition_meals/food_items

CREATE TABLE IF NOT EXISTS client_water_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        NOT NULL REFERENCES coach_clients(id) ON DELETE CASCADE,
  amount_ml   integer     NOT NULL CHECK (amount_ml > 0),
  logged_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_water_logs_client_date
  ON client_water_logs (client_id, logged_at DESC);

-- RLS
ALTER TABLE client_water_logs ENABLE ROW LEVEL SECURITY;

-- Drop before recreate (idempotent)
DROP POLICY IF EXISTS "client_water_logs_client_select" ON client_water_logs;
DROP POLICY IF EXISTS "client_water_logs_client_insert" ON client_water_logs;
DROP POLICY IF EXISTS "client_water_logs_coach_select"  ON client_water_logs;

CREATE POLICY "client_water_logs_client_select"
  ON client_water_logs FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM coach_clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "client_water_logs_client_insert"
  ON client_water_logs FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM coach_clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "client_water_logs_coach_select"
  ON client_water_logs FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM coach_clients WHERE coach_id = auth.uid()
    )
  );
