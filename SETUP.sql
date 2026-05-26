-- ============================================================
-- SIAROM CRM — Schema completo
-- Todas as tabelas usam prefixo siarom_crm_
-- Rode TUDO de uma vez no SQL Editor do Supabase.
-- ============================================================

-- ---------- 1) PROFILES ----------
create table if not exists public.siarom_crm_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text not null,
  role        text not null default 'user' check (role in ('admin','user')),
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- 2) APP SETTINGS ----------
create table if not exists public.siarom_crm_app_settings (
  chave text primary key,
  valor jsonb not null
);

insert into public.siarom_crm_app_settings (chave, valor)
values ('defaults', '{"comissao": 20, "imposto": 15.5}'::jsonb)
on conflict (chave) do nothing;

-- ---------- 3) PROJECTS ----------
create table if not exists public.siarom_crm_projects (
  id                    uuid primary key default gen_random_uuid(),
  cliente_nome          text not null,
  descricao_automacao   text,
  valor_total           numeric(14,2) not null check (valor_total >= 0),
  taxa_comissao         numeric(6,3) not null default 20,
  taxa_imposto          numeric(6,3) not null default 15.5,
  valor_comissao        numeric(14,2) generated always as (round(valor_total * taxa_comissao / 100, 2)) stored,
  valor_imposto         numeric(14,2) generated always as (round(valor_total * taxa_imposto  / 100, 2)) stored,
  valor_lucro           numeric(14,2) generated always as (round(valor_total - (valor_total * taxa_comissao/100) - (valor_total * taxa_imposto/100), 2)) stored,
  kanban_stage          text not null default 'reuniao_agendada'
                         check (kanban_stage in ('reuniao_agendada','geracao_proposta','proposta_enviada','geracao_contrato','contrato_assinado','implementacao')),
  owner_id              uuid not null references public.siarom_crm_profiles(id) on delete restrict,
  created_at            timestamptz not null default now(),
  closed_at             timestamptz
);

create index if not exists idx_siarom_crm_projects_owner   on public.siarom_crm_projects(owner_id);
create index if not exists idx_siarom_crm_projects_stage   on public.siarom_crm_projects(kanban_stage);
create index if not exists idx_siarom_crm_projects_created on public.siarom_crm_projects(created_at desc);

-- ---------- 4) TASKS ----------
create table if not exists public.siarom_crm_tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.siarom_crm_projects(id) on delete cascade,
  titulo       text not null,
  descricao    text,
  status       text not null default 'a_fazer'
                check (status in ('a_fazer','em_andamento','testar','validar','concluido')),
  prioridade   text not null default 'media' check (prioridade in ('baixa','media','alta','urgente')),
  assignee_id  uuid references public.siarom_crm_profiles(id) on delete set null,
  due_date     date,
  created_at   timestamptz not null default now()
);

create index if not exists idx_siarom_crm_tasks_assignee on public.siarom_crm_tasks(assignee_id);
create index if not exists idx_siarom_crm_tasks_status   on public.siarom_crm_tasks(status);
create index if not exists idx_siarom_crm_tasks_project  on public.siarom_crm_tasks(project_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.siarom_crm_profiles      enable row level security;
alter table public.siarom_crm_projects      enable row level security;
alter table public.siarom_crm_tasks         enable row level security;
alter table public.siarom_crm_app_settings  enable row level security;

-- Helper: is_admin via profiles
create or replace function public.siarom_crm_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.siarom_crm_profiles
    where id = auth.uid() and role = 'admin' and ativo = true
  );
$$;

-- ---------- profiles policies ----------
drop policy if exists "profiles_self_read"  on public.siarom_crm_profiles;
drop policy if exists "profiles_admin_all"  on public.siarom_crm_profiles;

create policy "profiles_self_read" on public.siarom_crm_profiles
  for select using (id = auth.uid() or public.siarom_crm_is_admin());

create policy "profiles_admin_all" on public.siarom_crm_profiles
  for all using (public.siarom_crm_is_admin()) with check (public.siarom_crm_is_admin());

-- ---------- projects policies ----------
drop policy if exists "projects_select"  on public.siarom_crm_projects;
drop policy if exists "projects_insert"  on public.siarom_crm_projects;
drop policy if exists "projects_update"  on public.siarom_crm_projects;
drop policy if exists "projects_delete"  on public.siarom_crm_projects;

create policy "projects_select" on public.siarom_crm_projects
  for select using (
    public.siarom_crm_is_admin() or owner_id = auth.uid()
  );

create policy "projects_insert" on public.siarom_crm_projects
  for insert with check (public.siarom_crm_is_admin() or owner_id = auth.uid());

create policy "projects_update" on public.siarom_crm_projects
  for update using (public.siarom_crm_is_admin() or owner_id = auth.uid())
              with check (public.siarom_crm_is_admin() or owner_id = auth.uid());

create policy "projects_delete" on public.siarom_crm_projects
  for delete using (public.siarom_crm_is_admin());

-- ---------- tasks policies ----------
drop policy if exists "tasks_select" on public.siarom_crm_tasks;
drop policy if exists "tasks_admin"  on public.siarom_crm_tasks;
drop policy if exists "tasks_owner_modify" on public.siarom_crm_tasks;
drop policy if exists "tasks_assignee_update" on public.siarom_crm_tasks;

create policy "tasks_select" on public.siarom_crm_tasks
  for select using (
    public.siarom_crm_is_admin() or assignee_id = auth.uid()
  );

create policy "tasks_admin" on public.siarom_crm_tasks
  for all using (public.siarom_crm_is_admin())
  with check (public.siarom_crm_is_admin());

create policy "tasks_assignee_update" on public.siarom_crm_tasks
  for update using (assignee_id = auth.uid()) with check (assignee_id = auth.uid());

-- ---------- app_settings policies ----------
drop policy if exists "settings_read"   on public.siarom_crm_app_settings;
drop policy if exists "settings_admin"  on public.siarom_crm_app_settings;

create policy "settings_read" on public.siarom_crm_app_settings
  for select using (auth.uid() is not null);

create policy "settings_admin" on public.siarom_crm_app_settings
  for all using (public.siarom_crm_is_admin()) with check (public.siarom_crm_is_admin());

-- ============================================================
-- Como criar o PRIMEIRO ADMIN:
-- 1) No Supabase Studio > Authentication > Users > "Add user" (email + senha).
-- 2) Copie o UUID dele e rode:
--
--   insert into public.siarom_crm_profiles (id, nome, email, role, ativo)
--   values ('<UUID-DO-USER>', 'Seu Nome', 'voce@empresa.com', 'admin', true);
--
-- Pronto. Os próximos usuários serão criados pelo painel /admin/usuarios.
-- ============================================================
