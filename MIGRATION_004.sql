-- MIGRATION 004: data/hora da reunião agendada
alter table public.siarom_crm_projects
  add column if not exists reuniao_em timestamptz;
