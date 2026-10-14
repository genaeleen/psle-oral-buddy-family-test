-- Run AFTER the existing family database schema.
-- Add your administrator's Supabase Auth user UUID below (from Authentication > Users).
create table if not exists public.platform_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;
-- REPLACE the UUID below, then uncomment and execute this statement:
-- insert into public.platform_admins(user_id) values ('00000000-0000-0000-0000-000000000000') on conflict do nothing;
-- Do not add a public INSERT policy or automatic admin bootstrap endpoint.
