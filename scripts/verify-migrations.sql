-- ============================================================
-- STRYVR — Vérification des migrations manuelles
-- Coller dans Supabase Dashboard > SQL Editor > Run
-- ✅ = appliquée  ❌ = MANQUANTE (à appliquer)
-- ============================================================

SELECT * FROM (

  -- ── TABLES ──────────────────────────────────────────────

  SELECT '20260514_beta_waitlist'            AS migration,
         'Table beta_waitlist'               AS check_name,
         CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beta_waitlist')
              THEN '✅ OK' ELSE '❌ MANQUANTE' END AS status

  UNION ALL SELECT '20260518_meal_favorites', 'Table client_meal_favorites',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='client_meal_favorites')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260520_ai_coach_daily_usage', 'Table ai_coach_daily_usage',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_coach_daily_usage')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260520_chat_messages', 'Table chat_messages',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='chat_messages')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260520_client_water_logs', 'Table client_water_logs',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='client_water_logs')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260517_client_activity_logs', 'Table client_activity_logs',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='client_activity_logs')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260519_adaptive_tdee', 'Table nutrition_tdee_history',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='nutrition_tdee_history')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260429_daily_checkins', 'Table daily_checkins',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_checkins')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260428_morpho_photos', 'Table morpho_photos',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='morpho_photos')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260418_morpho_analyses', 'Table morpho_analyses',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='morpho_analyses')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260424_program_adjustment_proposals', 'Table program_adjustment_proposals',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='program_adjustment_proposals')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260425_nutrition_protocols', 'Table nutrition_protocols',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='nutrition_protocols')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260516_food_composer', 'Table food_items',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='food_items')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260516_food_composer', 'Table nutrition_meals',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='nutrition_meals')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  -- ── COLONNES ────────────────────────────────────────────

  UNION ALL SELECT '20260516_tempo', 'Colonne tempo sur program_exercises',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='program_exercises' AND column_name='tempo')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260519_set_type', 'Colonne set_type sur client_set_logs',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_set_logs' AND column_name='set_type')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260519_adaptive_tdee', 'Colonne tdee_adaptive sur nutrition_protocols',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nutrition_protocols' AND column_name='tdee_adaptive')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260418_intelligence_profile', 'Colonne equipment sur coach_clients',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_clients' AND column_name='equipment')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260518_portion_scaling', 'Colonne hand_length_cm sur coach_clients',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_clients' AND column_name='hand_length_cm')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260416_exercise_muscles', 'Colonne primary_muscles sur program_exercises',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='program_exercises' AND column_name='primary_muscles')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  UNION ALL SELECT '20260414_session_logger_v2', 'Colonne exercise_notes sur client_session_logs',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_session_logs' AND column_name='exercise_notes')
         THEN '✅ OK' ELSE '❌ MANQUANTE' END

  -- ── VALEURS ENUM / CHECK ─────────────────────────────────

  UNION ALL SELECT '20260520_voice_input_mode', 'Valeur voice dans input_mode (nutrition_entries)',
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints
      WHERE constraint_schema='public'
        AND check_clause LIKE '%voice%'
        AND constraint_name LIKE '%nutrition_entries%'
    ) OR EXISTS (
      -- Vérification alternative : essai d'insert fictif non-committé
      SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'nutrition_entries' AND pg_get_constraintdef(c.oid) LIKE '%voice%'
    )
    THEN '✅ OK' ELSE '❌ MANQUANTE (ou non vérifiable via contrainte)' END

  UNION ALL SELECT '20260521_food_items_drinks_category', 'Valeur drinks dans food_items.category_l1',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'food_items' AND pg_get_constraintdef(c.oid) LIKE '%drinks%'
    )
    THEN '✅ OK' ELSE '❌ MANQUANTE' END

) AS checks
ORDER BY status DESC, migration;
