create extension if not exists pgcrypto;

create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date text not null,
  input_text text not null,
  work_content text not null,
  work_thought text not null
);

alter table public.work_logs enable row level security;

drop policy if exists "public read work logs" on public.work_logs;
drop policy if exists "public insert work logs" on public.work_logs;
drop policy if exists "public delete work logs" on public.work_logs;

create policy "public read work logs" on public.work_logs for select using (true);
create policy "public insert work logs" on public.work_logs for insert with check (true);
create policy "public delete work logs" on public.work_logs for delete using (true);
