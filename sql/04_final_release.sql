-- Run in Supabase SQL Editor before uploading this release. No history deletion.
create table if not exists public.ai_daily_quota (
 student_id uuid not null references public.students(id) on delete cascade,
 day date not null,
 used integer not null default 0 check (used >= 0),
 primary key(student_id,day)
);
alter table public.ai_daily_quota drop constraint if exists ai_daily_quota_used_check;
alter table public.ai_daily_quota add constraint ai_daily_quota_used_check check (used >= 0);
alter table public.ai_daily_quota enable row level security;
revoke all on public.ai_daily_quota from anon,authenticated;
create table if not exists public.student_ai_settings (
 student_id uuid primary key references public.students(id) on delete cascade,
 daily_limit integer null check (daily_limit between 1 and 1000),
 updated_at timestamptz not null default now()
);
alter table public.student_ai_settings enable row level security;
revoke all on public.student_ai_settings from anon,authenticated;
-- NULL daily_limit = unlimited. Atomic increment prevents concurrent bypass of limited plans.
create or replace function public.reserve_ai_marking(p_student uuid,p_limit integer default null)
returns integer language plpgsql security definer set search_path=public as $$
declare v_used integer;
begin
 if p_limit is not null and (p_limit<1 or p_limit>1000) then raise exception 'Invalid quota limit';end if;
 insert into public.ai_daily_quota(student_id,day,used)
 values(p_student,(now() at time zone 'UTC')::date,1)
 on conflict(student_id,day) do update set used=public.ai_daily_quota.used+1
 where p_limit is null or public.ai_daily_quota.used<p_limit
 returning used into v_used;
 return v_used;
end $$;
revoke all on function public.reserve_ai_marking(uuid,integer) from public,anon,authenticated;
grant execute on function public.reserve_ai_marking(uuid,integer) to service_role;
