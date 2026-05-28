-- ========================================================
-- MIGRATION 011 — Prazo de entrega nos projetos
-- ========================================================

alter table public.siarom_crm_projects
  add column if not exists prazo_entrega date;

create index if not exists idx_siarom_crm_projects_prazo_entrega
  on public.siarom_crm_projects(prazo_entrega);

notify pgrst, 'reload schema';
