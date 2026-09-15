-- Выполните в SQL Editor своего проекта Supabase.
create table if not exists public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (length(btrim(guest_name)) between 1 and 120),
  attendance text not null check (attendance in ('alone', 'with_partner', 'cannot_attend')),
  created_at timestamptz not null default now()
);

alter table public.wedding_rsvps enable row level security;

-- Посетителям разрешена только отправка ответа. Чтение и правка доступны владельцу
-- в интерфейсе Supabase с административными правами, а не публичному сайту.
revoke all on table public.wedding_rsvps from public, anon, authenticated;
grant insert on table public.wedding_rsvps to anon, authenticated;

drop policy if exists "Guests may submit RSVP" on public.wedding_rsvps;
create policy "Guests may submit RSVP"
on public.wedding_rsvps
for insert
to anon, authenticated
with check (true);
