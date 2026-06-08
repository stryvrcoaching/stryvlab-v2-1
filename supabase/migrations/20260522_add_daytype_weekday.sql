-- 2026-05-22: add weekday and day_type to protocol days and sessions
BEGIN;

-- Add weekday (0=Sunday .. 6=Saturday) and day_type ('training'|'rest'|'special') to nutrition_protocol_days
ALTER TABLE IF EXISTS public.nutrition_protocol_days
  ADD COLUMN IF NOT EXISTS weekday smallint NULL,
  ADD COLUMN IF NOT EXISTS day_type text NULL;

-- Add weekday/day_type to sessions (so training scheduling can reference weekday)
ALTER TABLE IF EXISTS public.sessions
  ADD COLUMN IF NOT EXISTS weekday smallint NULL,
  ADD COLUMN IF NOT EXISTS day_type text NULL;

-- Optional: create indexes for fast lookup by weekday/day_type
CREATE INDEX IF NOT EXISTS idx_nutrition_protocol_days_weekday ON public.nutrition_protocol_days (weekday);
CREATE INDEX IF NOT EXISTS idx_nutrition_protocol_days_day_type ON public.nutrition_protocol_days (day_type);
CREATE INDEX IF NOT EXISTS idx_sessions_weekday ON public.sessions (weekday);
CREATE INDEX IF NOT EXISTS idx_sessions_day_type ON public.sessions (day_type);

COMMIT;

-- Notes:
-- 1) `weekday` stores integers 0..6 where 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
-- 2) `day_type` values should be constrained at the application layer (Zod/Prisma). Suggested values: 'training', 'rest', 'special'.
-- 3) After applying this migration, update API and UI to allow setting these fields when coach creates/edits a protocol day.
-- 4) If you use Prisma, add corresponding fields to `prisma/schema.prisma` and run:
--    npx prisma migrate dev --name add_weekday_daytype
--    npx prisma generate
