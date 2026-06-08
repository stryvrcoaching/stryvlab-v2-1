-- supabase/migrations/20260517_beta_waitlist_role.sql
-- Add role column to beta_waitlist (coach | athlete)

-- Create table if not yet applied (idempotent safety)
CREATE TABLE IF NOT EXISTS beta_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'stryvr-landing'
);

CREATE UNIQUE INDEX IF NOT EXISTS beta_waitlist_email_idx ON beta_waitlist (lower(email));

ALTER TABLE beta_waitlist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'beta_waitlist' AND policyname = 'beta_waitlist_insert_anon'
  ) THEN
    CREATE POLICY "beta_waitlist_insert_anon"
      ON beta_waitlist FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'beta_waitlist' AND policyname = 'beta_waitlist_select_authenticated'
  ) THEN
    CREATE POLICY "beta_waitlist_select_authenticated"
      ON beta_waitlist FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Add role column
ALTER TABLE beta_waitlist
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('coach', 'athlete')) DEFAULT 'athlete';
