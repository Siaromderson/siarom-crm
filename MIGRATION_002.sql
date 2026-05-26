-- ========================================================
-- MIGRATION 002
-- - Novas etapas do Kanban (entrada 50% e funil pós-venda)
-- - Tabela de items do projeto (credenciais, notas, links)
-- Rode TUDO no SQL Editor do Supabase.
-- ========================================================

-- 1) Atualiza o CHECK das etapas
alter table public.siarom_crm_projects
  drop constraint if exists siarom_crm_projects_kanban_stage_check;

alter table public.siarom_crm_projects
  add constraint siarom_crm_projects_kanban_stage_check
  check (kanban_stage in (
    -- funil de vendas
    'reuniao_agendada','geracao_proposta','proposta_enviada',
    'geracao_contrato','contrato_assinado','pagamento_entrada',
    -- funil de pós-venda
    'implementacao','finalizado','fase_testes',
    'aguardando_pagamento_final','pagamento_final',
    -- descartados
    'no_show','desqualificado','perdido'
  ));

-- 2) Items do projeto (credenciais, notas, links etc.)
create table if not exists public.siarom_crm_project_items (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.siarom_crm_projects(id) on delete cascade,
  tipo       text not null check (tipo in ('credencial','anotacao','link','arquivo')),
  titulo     text not null,
  conteudo   text,
  created_at timestamptz not null default now()
);

create index if not exists idx_siarom_crm_items_project on public.siarom_crm_project_items(project_id);

alter table public.siarom_crm_project_items enable row level security;

drop policy if exists "items_select" on public.siarom_crm_project_items;
drop policy if exists "items_all"    on public.siarom_crm_project_items;

create policy "items_select" on public.siarom_crm_project_items
  for select using (
    public.siarom_crm_is_admin()
    or exists (
      select 1 from public.siarom_crm_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

create policy "items_all" on public.siarom_crm_project_items
  for all using (
    public.siarom_crm_is_admin()
    or exists (
      select 1 from public.siarom_crm_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  ) with check (
    public.siarom_crm_is_admin()
    or exists (
      select 1 from public.siarom_crm_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );
