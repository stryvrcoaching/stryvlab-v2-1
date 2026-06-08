-- Extend client_measurements with all circumference zones
-- Apply manually via Supabase Dashboard SQL Editor

alter table public.client_measurements
  add column if not exists neck_cm           numeric(5,1),
  add column if not exists shoulder_width_cm numeric(5,1),
  add column if not exists shoulder_circ_cm  numeric(5,1),
  add column if not exists arm_left_cm       numeric(5,1),
  add column if not exists arm_right_cm      numeric(5,1),
  add column if not exists thigh_left_cm     numeric(5,1),
  add column if not exists thigh_right_cm    numeric(5,1),
  add column if not exists calf_left_cm      numeric(5,1),
  add column if not exists calf_right_cm     numeric(5,1),
  add column if not exists glutes_cm         numeric(5,1);
