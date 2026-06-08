-- 2026-05-21 — Add 'drinks' to food_items category_l1 CHECK constraint
-- Manual apply via Supabase Dashboard SQL Editor.

-- Drop old constraint (auto-generated name), add new one including 'drinks'
ALTER TABLE food_items
  DROP CONSTRAINT IF EXISTS food_items_category_l1_check;

ALTER TABLE food_items
  ADD CONSTRAINT food_items_category_l1_check
  CHECK (category_l1 IN ('proteins','carbs','vegetables','fruits','fats','drinks','extras'));

-- Reclassify existing drinks from extras → drinks
UPDATE food_items SET category_l1 = 'drinks', category_l2 = 'chauds'
  WHERE item_key = 'coffee-black';

UPDATE food_items SET category_l1 = 'drinks', category_l2 = 'laits-vegetaux'
  WHERE item_key IN ('oat-milk', 'almond-milk-unsweetened', 'soy-milk', 'coconut-milk-light');

-- Reclassify dairy beverages to proteins/laitiers (they are food, not drinks)
UPDATE food_items SET category_l1 = 'proteins', category_l2 = 'laitiers'
  WHERE item_key IN ('whole-milk', 'skim-milk');

-- Reclassify parmesan & mozzarella from extras/divers to proteins/laitiers
UPDATE food_items SET category_l1 = 'proteins', category_l2 = 'laitiers'
  WHERE item_key IN ('parmesan', 'mozzarella');

-- Reclassify honey & jam to extras/sucres
UPDATE food_items SET category_l2 = 'sucres'
  WHERE item_key IN ('honey', 'jam');
