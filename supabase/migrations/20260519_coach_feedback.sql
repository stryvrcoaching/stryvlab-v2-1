-- supabase/migrations/20260519_coach_feedback.sql

-- 1. coach_feedback table
CREATE TABLE IF NOT EXISTS coach_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   uuid NOT NULL REFERENCES coach_clients(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('session','exercise','set','checkin','morpho','bilan')),
  entity_id   uuid NOT NULL,
  entity_label text,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_feedback_client
  ON coach_feedback (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_feedback_entity
  ON coach_feedback (entity_type, entity_id);

-- 2. coach_feedback_reactions table
CREATE TABLE IF NOT EXISTS coach_feedback_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES coach_feedback(id) ON DELETE CASCADE,
  author_type text NOT NULL CHECK (author_type IN ('client','coach')),
  author_id   uuid NOT NULL,
  emoji       text NOT NULL CHECK (emoji IN ('👍','💪','✅','🔥','❓')),
  reply_text  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_reactions_feedback
  ON coach_feedback_reactions (feedback_id, created_at ASC);

-- 3. RLS for coach_feedback
ALTER TABLE coach_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_manage_feedback" ON coach_feedback;
CREATE POLICY "coach_manage_feedback"
  ON coach_feedback FOR ALL TO authenticated
  USING (
    coach_id = auth.uid() AND
    client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
  )
  WITH CHECK (
    coach_id = auth.uid() AND
    client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "client_read_feedback" ON coach_feedback;
CREATE POLICY "client_read_feedback"
  ON coach_feedback FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM coach_clients WHERE user_id = auth.uid())
  );

-- 4. RLS for coach_feedback_reactions
ALTER TABLE coach_feedback_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_manage_reactions" ON coach_feedback_reactions;
CREATE POLICY "coach_manage_reactions"
  ON coach_feedback_reactions FOR ALL TO authenticated
  USING (
    feedback_id IN (
      SELECT id FROM coach_feedback
      WHERE coach_id = auth.uid()
    )
  )
  WITH CHECK (
    feedback_id IN (
      SELECT id FROM coach_feedback
      WHERE coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "client_manage_reactions" ON coach_feedback_reactions;
CREATE POLICY "client_manage_reactions"
  ON coach_feedback_reactions FOR ALL TO authenticated
  USING (
    feedback_id IN (
      SELECT cf.id FROM coach_feedback cf
      JOIN coach_clients cc ON cc.id = cf.client_id
      WHERE cc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    feedback_id IN (
      SELECT cf.id FROM coach_feedback cf
      JOIN coach_clients cc ON cc.id = cf.client_id
      WHERE cc.user_id = auth.uid()
    )
  );

-- 5. Extend coach_client_notifications CHECK constraint to include new types
ALTER TABLE coach_client_notifications
  DROP CONSTRAINT IF EXISTS coach_client_notifications_type_check;

ALTER TABLE coach_client_notifications
  ADD CONSTRAINT coach_client_notifications_type_check
  CHECK (type IN (
    'coach_note','bilan_pending','program_assigned','system_reminder',
    'tdee_updated','tdee_coach_alert','coach_feedback','client_reaction'
  ));
