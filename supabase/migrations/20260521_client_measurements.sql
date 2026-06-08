-- Client self-reported measurements (circumferences)
-- Applied manually via Supabase Dashboard SQL Editor

create table if not exists public.client_measurements (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.coach_clients(id) on delete cascade,
  measured_at  date not null default current_date,
  waist_cm     numeric(5,1),
  hips_cm      numeric(5,1),
  arm_cm       numeric(5,1),
  chest_cm     numeric(5,1),
  source       text not null default 'client_self',
  created_at   timestamptz not null default now()
);

create index if not exists client_measurements_client_id_idx
  on public.client_measurements(client_id, measured_at desc);

alter table public.client_measurements enable row level security;

-- Client can read and insert their own measurements
create policy "client_measurements_client_select" on public.client_measurements
  for select using (
    client_id in (
      select id from public.coach_clients where user_id = auth.uid()
    )
  );

create policy "client_measurements_client_insert" on public.client_measurements
  for insert with check (
    client_id in (
      select id from public.coach_clients where user_id = auth.uid()
    )
  );

-- Coach can read measurements for their clients
create policy "client_measurements_coach_select" on public.client_measurements
  for select using (
    client_id in (
      select id from public.coach_clients where coach_id = auth.uid()
    )
  );
