-- 2026-05-18 — Portion scaling main + bananes plantains
-- Manual apply via Supabase Dashboard SQL Editor.

-- ────────────────────────────────────────────────────────────
-- 1. Column hand_length_cm on coach_clients
-- ────────────────────────────────────────────────────────────
ALTER TABLE coach_clients
  ADD COLUMN IF NOT EXISTS hand_length_cm DECIMAL(4,1) NULL;

COMMENT ON COLUMN coach_clients.hand_length_cm IS
  'Longueur main (cm) poignet → bout majeur. Override portion scaling. NULL = dérivé taille via ratio 0.108 (Pheasant 2003).';

-- ────────────────────────────────────────────────────────────
-- 2. Bananes plantains (5 variantes)
-- ────────────────────────────────────────────────────────────
INSERT INTO food_items (name_fr, category_l1, category_l2, item_key, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, is_verified)
VALUES
  ('Banane plantain verte (crue)',        'carbs', 'fecules', 'plantain-vert-cru',      122, 1.3, 32.0, 0.4, 2.3, 'internal', true),
  ('Banane plantain mûre (crue)',         'carbs', 'fecules', 'plantain-mur-cru',       122, 1.3, 32.0, 0.4, 2.3, 'internal', true),
  ('Banane plantain bouillie',            'carbs', 'fecules', 'plantain-bouilli',       116, 0.8, 31.0, 0.2, 2.0, 'internal', true),
  ('Banane plantain frite (tostones/aloco)', 'carbs', 'fecules', 'plantain-frit',        215, 1.5, 32.0, 9.5, 2.1, 'internal', true),
  ('Banane plantain mûre frite (maduros)', 'carbs', 'fecules', 'plantain-mur-frit',     240, 1.3, 38.0, 9.8, 2.0, 'internal', true)
ON CONFLICT (item_key) DO UPDATE
SET name_fr          = EXCLUDED.name_fr,
    category_l1      = EXCLUDED.category_l1,
    category_l2      = EXCLUDED.category_l2,
    kcal_per_100g    = EXCLUDED.kcal_per_100g,
    protein_per_100g = EXCLUDED.protein_per_100g,
    carbs_per_100g   = EXCLUDED.carbs_per_100g,
    fat_per_100g     = EXCLUDED.fat_per_100g,
    fiber_per_100g   = EXCLUDED.fiber_per_100g,
    is_verified      = EXCLUDED.is_verified;
