-- supabase/migrations/20260520_metric_annotations_ai.sql
-- Extend metric_annotations for AI-generated analysis

-- 1. Add ai_analysis event_type + is_ai_draft flag
ALTER TABLE metric_annotations
  DROP CONSTRAINT IF EXISTS metric_annotations_event_type_check;

ALTER TABLE metric_annotations
  ADD CONSTRAINT metric_annotations_event_type_check
  CHECK (event_type IN ('program_change', 'injury', 'travel', 'nutrition', 'note', 'ai_analysis'));

ALTER TABLE metric_annotations
  ADD COLUMN IF NOT EXISTS is_ai_draft boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_metric_annotations_ai
  ON metric_annotations (coach_id, is_ai_draft)
  WHERE is_ai_draft = true;
