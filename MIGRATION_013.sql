-- ========================================================
-- MIGRATION 013 — Mentorias e mentorados
-- ========================================================

-- ----- 1) Tipo de cliente: SiaromAI x mentorado -----
alter table public.siarom_crm_clientes
  add column if not exists tipo text not null default 'siaromai'
  check (tipo in ('siaromai','mentorado'));

create index if not exists idx_siarom_crm_clientes_tipo
  on public.siarom_crm_clientes(tipo);

-- ----- 2) Mentorias -----
create table if not exists public.siarom_crm_mentorias (
  id                 uuid primary key default gen_random_uuid(),
  mentorado_id       uuid references public.siarom_crm_clientes(id) on delete set null,
  mentorado_nome     text not null,
  plano              text,
  valor_total        numeric not null default 0,
  taxa_imposto       numeric not null default 0,
  horas_contratadas  numeric not null default 0,
  observacoes        text,
  owner_id           uuid not null references public.siarom_crm_profiles(id) on delete cascade,
  created_at         timestamptz not null default now()
);

create index if not exists idx_siarom_crm_mentorias_mentorado on public.siarom_crm_mentorias(mentorado_id);
create index if not exists idx_siarom_crm_mentorias_owner     on public.siarom_crm_mentorias(owner_id);

alter table public.siarom_crm_mentorias enable row level security;

drop policy if exists "mentorias_select" on public.siarom_crm_mentorias;
drop policy if exists "mentorias_all"    on public.siarom_crm_mentorias;
create policy "mentorias_select" on public.siarom_crm_mentorias
  for select using (public.siarom_crm_is_admin() or owner_id = auth.uid());
create policy "mentorias_all" on public.siarom_crm_mentorias
  for all using (public.siarom_crm_is_admin() or owner_id = auth.uid())
         with check (public.siarom_crm_is_admin() or owner_id = auth.uid());

-- ----- 3) Aulas das mentorias (registro de horas) -----
create table if not exists public.siarom_crm_mentoria_aulas (
  id            uuid primary key default gen_random_uuid(),
  mentoria_id   uuid not null references public.siarom_crm_mentorias(id) on delete cascade,
  data          date not null default current_date,
  duracao_horas numeric not null default 0,
  descricao     text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_siarom_crm_mentoria_aulas_mentoria on public.siarom_crm_mentoria_aulas(mentoria_id);

alter table public.siarom_crm_mentoria_aulas enable row level security;

-- Acesso à aula segue o acesso à mentoria pai
create or replace function public.siarom_crm_mentoria_can_access(p_mentoria_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.siarom_crm_is_admin()
    or exists (
      select 1 from public.siarom_crm_mentorias m
      where m.id = p_mentoria_id and m.owner_id = auth.uid()
    );
$$;

drop policy if exists "mentoria_aulas_select" on public.siarom_crm_mentoria_aulas;
drop policy if exists "mentoria_aulas_all"    on public.siarom_crm_mentoria_aulas;
create policy "mentoria_aulas_select" on public.siarom_crm_mentoria_aulas
  for select using (public.siarom_crm_mentoria_can_access(mentoria_id));
create policy "mentoria_aulas_all" on public.siarom_crm_mentoria_aulas
  for all using (public.siarom_crm_mentoria_can_access(mentoria_id))
         with check (public.siarom_crm_mentoria_can_access(mentoria_id));

notify pgrst, 'reload schema';
