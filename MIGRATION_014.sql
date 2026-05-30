-- ========================================================
-- MIGRATION 014 — Eventos da agenda (custom)
-- ========================================================

create table if not exists public.siarom_crm_agenda_events (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text,
  tipo        text not null default 'outro'
                check (tipo in ('reuniao','tarefa','lembrete','outro')),
  data        date not null,
  hora        time,                       -- null = dia todo
  owner_id    uuid not null references public.siarom_crm_profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists idx_siarom_crm_agenda_events_owner on public.siarom_crm_agenda_events(owner_id);
create index if not exists idx_siarom_crm_agenda_events_data  on public.siarom_crm_agenda_events(data);

alter table public.siarom_crm_agenda_events enable row level security;

drop policy if exists "agenda_events_select" on public.siarom_crm_agenda_events;
drop policy if exists "agenda_events_all"    on public.siarom_crm_agenda_events;
create policy "agenda_events_select" on public.siarom_crm_agenda_events
  for select using (public.siarom_crm_is_admin() or owner_id = auth.uid());
create policy "agenda_events_all" on public.siarom_crm_agenda_events
  for all using (public.siarom_crm_is_admin() or owner_id = auth.uid())
         with check (public.siarom_crm_is_admin() or owner_id = auth.uid());

notify pgrst, 'reload schema';
