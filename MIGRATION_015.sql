-- ========================================================
-- MIGRATION 015 — Recorrência em eventos da agenda
-- ========================================================
-- Estratégia: 1 linha por série + expansão virtual na leitura.
-- O banco não cresce com a frequência.

alter table public.siarom_crm_agenda_events
  add column if not exists recorrencia text not null default 'none'
    check (recorrencia in ('none','daily','weekly','monthly','yearly')),
  add column if not exists recorrencia_dias_semana int[],
  add column if not exists recorrencia_ate date;

create index if not exists idx_siarom_crm_agenda_events_recorrencia
  on public.siarom_crm_agenda_events(recorrencia);

notify pgrst, 'reload schema';
