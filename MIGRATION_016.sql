-- ========================================================
-- MIGRATION 016 — Categoria (tipo) de tarefas
-- ========================================================
-- Cada tarefa passa a ter uma categoria: projeto, comunidade
-- ou gravacao (gravação de conteúdo). Usada para colorir os
-- cards no Kanban e os chips na Agenda.

alter table public.siarom_crm_tasks
  add column if not exists categoria text not null default 'projeto'
    check (categoria in ('projeto','comunidade','gravacao'));

create index if not exists idx_siarom_crm_tasks_categoria
  on public.siarom_crm_tasks(categoria);

notify pgrst, 'reload schema';
