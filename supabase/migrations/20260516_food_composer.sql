-- ============================================================
-- Migration: food_items + nutrition_meals + nutrition_entries
-- Nutrition Composer — STRYVLAB Client App
-- 2026-05-16
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLE: food_items
-- Base alimentaire interne (~150 aliments seeds)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_fr           TEXT NOT NULL,
  category_l1       TEXT NOT NULL CHECK (category_l1 IN ('proteins','carbs','vegetables','fruits','fats','extras')),
  category_l2       TEXT,
  item_key          TEXT UNIQUE NOT NULL,
  kcal_per_100g     DECIMAL(6,1) NOT NULL,
  protein_per_100g  DECIMAL(5,1) NOT NULL DEFAULT 0,
  carbs_per_100g    DECIMAL(5,1) NOT NULL DEFAULT 0,
  fat_per_100g      DECIMAL(5,1) NOT NULL DEFAULT 0,
  fiber_per_100g    DECIMAL(5,1) NOT NULL DEFAULT 0,
  source            TEXT NOT NULL DEFAULT 'internal',
  is_verified       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category_l1, category_l2);


-- RLS : lecture publique (pas de données sensibles)
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "food_items_select" ON food_items;
CREATE POLICY "food_items_select" ON food_items FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- TABLE: nutrition_meals
-- Conteneur de repas structurés (remplace meal_logs pour
-- les repas via Composer — meal_logs conservé pour IA fallback)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_meals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES coach_clients(id) ON DELETE CASCADE,
  physiological_date  DATE NOT NULL,
  meal_type           TEXT NOT NULL DEFAULT 'snack'
                        CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  logged_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_calories      DECIMAL(7,1) NOT NULL DEFAULT 0,
  total_protein_g     DECIMAL(5,1) NOT NULL DEFAULT 0,
  total_carbs_g       DECIMAL(5,1) NOT NULL DEFAULT 0,
  total_fat_g         DECIMAL(5,1) NOT NULL DEFAULT 0,
  total_fiber_g       DECIMAL(5,1) NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_meals_client_date
  ON nutrition_meals(client_id, physiological_date DESC);

ALTER TABLE nutrition_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutrition_meals_client_all" ON nutrition_meals;
CREATE POLICY "nutrition_meals_client_all" ON nutrition_meals
  FOR ALL
  USING (client_id IN (
    SELECT id FROM coach_clients WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "nutrition_meals_coach_read" ON nutrition_meals;
CREATE POLICY "nutrition_meals_coach_read" ON nutrition_meals
  FOR SELECT
  USING (client_id IN (
    SELECT id FROM coach_clients WHERE coach_id = auth.uid()
  ));

-- ────────────────────────────────────────────────────────────
-- TABLE: nutrition_entries
-- Items individuels dans un repas (1 entry = 1 food_item + quantité)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_entries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id             UUID NOT NULL REFERENCES nutrition_meals(id) ON DELETE CASCADE,
  client_id           UUID NOT NULL REFERENCES coach_clients(id) ON DELETE CASCADE,
  food_item_id        UUID NOT NULL REFERENCES food_items(id),
  physiological_date  DATE NOT NULL,
  quantity_g          DECIMAL(7,1) NOT NULL,
  calories_kcal       DECIMAL(7,1) NOT NULL,
  protein_g           DECIMAL(5,1) NOT NULL DEFAULT 0,
  carbs_g             DECIMAL(5,1) NOT NULL DEFAULT 0,
  fat_g               DECIMAL(5,1) NOT NULL DEFAULT 0,
  fiber_g             DECIMAL(5,1) NOT NULL DEFAULT 0,
  input_mode          TEXT NOT NULL DEFAULT 'composer'
                        CHECK (input_mode IN ('composer','portion','photo_ai')),
  confidence_score    DECIMAL(3,2) NOT NULL DEFAULT 0.85,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_entries_meal
  ON nutrition_entries(meal_id);

CREATE INDEX IF NOT EXISTS idx_nutrition_entries_client_date
  ON nutrition_entries(client_id, physiological_date DESC);

ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutrition_entries_client_all" ON nutrition_entries;
CREATE POLICY "nutrition_entries_client_all" ON nutrition_entries
  FOR ALL
  USING (client_id IN (
    SELECT id FROM coach_clients WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "nutrition_entries_coach_read" ON nutrition_entries;
CREATE POLICY "nutrition_entries_coach_read" ON nutrition_entries
  FOR SELECT
  USING (client_id IN (
    SELECT id FROM coach_clients WHERE coach_id = auth.uid()
  ));

