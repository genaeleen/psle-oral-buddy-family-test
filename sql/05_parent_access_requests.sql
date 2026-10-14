-- Run once in Supabase SQL Editor; existing family data is untouched.
create table if not exists public.parent_access_requests (
 id uuid primary key default gen_random_uuid(),
 email text not null check(length(email) between 3 and 254),
 name text not null check(length(name) between 2 and 80),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index if not exists parent_access_requests_status_created_idx on public.parent_access_requests(status,created_at);
alter table public.parent_access_requests enable row level security;
revoke all on public.parent_access_requests from anon,authenticated;
-- Only server-side service-role functions may access this table.
