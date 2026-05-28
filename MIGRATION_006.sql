-- ========================================================
-- MIGRATION 006
-- - Tabela siarom_crm_clientes (clientes recorrentes + follow-up)
-- - Tabela siarom_crm_leads (funil de vendas standalone)
-- - FK cliente_id em projects/tasks
-- - Campo tipo (manual|followup) em tasks
-- - Tabela siarom_crm_project_checklist
-- ========================================================

-- ---------- 1) CLIENTES (criar antes de leads) ----------
create table if not exists public.siarom_crm_clientes (
  id                    uuid primary key default gen_random_uuid(),
  nome                  text not null,
  email                 text,
  telefone              text,
  site                  text,
  observacoes           text,
  proximo_followup_em   timestamptz,
  ultima_interacao_em   timestamptz,
  owner_id              uuid not null references public.siarom_crm_profiles(id) on delete restrict,
  created_at            timestamptz not null default now()
);

create index if not exists idx_siarom_crm_clientes_owner on public.siarom_crm_clientes(owner_id);
create index if not exists idx_siarom_crm_clientes_followup on public.siarom_crm_clientes(proximo_followup_em);

alter table public.siarom_crm_clientes enable row level security;

drop policy if exists "clientes_select" on public.siarom_crm_clientes;
drop policy if exists "clientes_all"    on public.siarom_crm_clientes;
create policy "clientes_select" on public.siarom_crm_clientes
  for select using (public.siarom_crm_is_admin() or owner_id = auth.uid());
create policy "clientes_all" on public.siarom_crm_clientes
  for all using (public.siarom_crm_is_admin() or owner_id = auth.uid())
         with check (public.siarom_crm_is_admin() or owner_id = auth.uid());

-- ---------- 2) LEADS ----------
create table if not exists public.siarom_crm_leads (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  email           text,
  telefone        text,
  site            text,
  descricao       text,
  valor_estimado  numeric(14,2) default 0,
  kanban_stage    text not null default 'reuniao_agendada'
                   check (kanban_stage in (
                     'reuniao_agendada','geracao_proposta','proposta_enviada',
                     'geracao_contrato','contrato_assinado','pagamento_entrada',
                     'no_show','desqualificado','perdido'
                   )),
  reuniao_em      timestamptz,
  origem          text,
  observacoes     text,
  owner_id        uuid not null references public.siarom_crm_profiles(id) on delete restrict,
  cliente_id      uuid references public.siarom_crm_clientes(id) on delete set null,
  convertido_em   timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_siarom_crm_leads_owner on public.siarom_crm_leads(owner_id);
create index if not exists idx_siarom_crm_leads_stage on public.siarom_crm_leads(kanban_stage);

alter table public.siarom_crm_leads enable row level security;

drop policy if exists "leads_select" on public.siarom_crm_leads;
drop policy if exists "leads_all"    on public.siarom_crm_leads;
create policy "leads_select" on public.siarom_crm_leads
  for select using (public.siarom_crm_is_admin() or owner_id = auth.uid());
create policy "leads_all" on public.siarom_crm_leads
  for all using (public.siarom_crm_is_admin() or owner_id = auth.uid())
         with check (public.siarom_crm_is_admin() or owner_id = auth.uid());

-- ---------- 3) FK em projects/tasks ----------
alter table public.siarom_crm_projects
  add column if not exists cliente_id uuid references public.siarom_crm_clientes(id) on delete set null;
create index if not exists idx_siarom_crm_projects_cliente on public.siarom_crm_projects(cliente_id);

alter table public.siarom_crm_tasks
  add column if not exists cliente_id uuid references public.siarom_crm_clientes(id) on delete set null,
  add column if not exists tipo text not null default 'manual'
    check (tipo in ('manual','followup'));
create index if not exists idx_siarom_crm_tasks_cliente on public.siarom_crm_tasks(cliente_id);
create index if not exists idx_siarom_crm_tasks_due     on public.siarom_crm_tasks(due_date);

-- ---------- 4) CHECKLIST ----------
create table if not exists public.siarom_crm_project_checklist (
  project_id uuid not null references public.siarom_crm_projects(id) on delete cascade,
  key        text not null check (key in (
    'contrato_assinado','entrada_50_recebida','nf_entrada_emitida',
    'acesso_credenciais_recebidas','kickoff_realizado',
    'entrega_homologacao','nf_final_emitida','pagamento_final_recebido'
  )),
  done       boolean not null default true,
  done_at    timestamptz not null default now(),
  done_by    uuid references public.siarom_crm_profiles(id) on delete set null,
  primary key (project_id, key)
);

alter table public.siarom_crm_project_checklist enable row level security;

drop policy if exists "checklist_select" on public.siarom_crm_project_checklist;
drop policy if exists "checklist_all"    on public.siarom_crm_project_checklist;
create policy "checklist_select" on public.siarom_crm_project_checklist
  for select using (
    public.siarom_crm_is_admin()
    or exists (select 1 from public.siarom_crm_projects p where p.id = project_id and p.owner_id = auth.uid())
  );
create policy "checklist_all" on public.siarom_crm_project_checklist
  for all using (
    public.siarom_crm_is_admin()
    or exists (select 1 from public.siarom_crm_projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    public.siarom_crm_is_admin()
    or exists (select 1 from public.siarom_crm_projects p where p.id = project_id and p.owner_id = auth.uid())
  );
