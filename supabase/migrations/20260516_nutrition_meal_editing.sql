-- ============================================================
-- Migration: editable structured nutrition meals
-- 2026-05-16
-- ============================================================

ALTER TABLE nutrition_meals
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_nutrition_entries_meal
  ON nutrition_entries(meal_id);
