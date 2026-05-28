-- ========================================================
-- MIGRATION 007 — Arquivos do CRM (NFEs, contratos, etc)
-- ========================================================

-- ---------- 1) Tabela de arquivos ----------
create table if not exists public.siarom_crm_files (
  id            uuid primary key default gen_random_uuid(),
  owner_type    text not null check (owner_type in ('projeto','cliente')),
  owner_id      uuid not null,
  categoria     text not null default 'outro' check (categoria in ('contrato','nfe','outro')),
  nome          text not null,
  mime          text,
  size_bytes    bigint,
  storage_path  text not null unique,
  uploaded_by   uuid references public.siarom_crm_profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_siarom_crm_files_owner     on public.siarom_crm_files(owner_type, owner_id);
create index if not exists idx_siarom_crm_files_categoria on public.siarom_crm_files(categoria);

alter table public.siarom_crm_files enable row level security;

-- Helper: tem acesso ao owner (projeto OU cliente)?
create or replace function public.siarom_crm_files_can_access(p_owner_type text, p_owner_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.siarom_crm_is_admin()
    or (p_owner_type = 'projeto' and exists (
      select 1 from public.siarom_crm_projects p where p.id = p_owner_id and p.owner_id = auth.uid()
    ))
    or (p_owner_type = 'cliente' and exists (
      select 1 from public.siarom_crm_clientes c where c.id = p_owner_id and c.owner_id = auth.uid()
    ));
$$;

drop policy if exists "files_select" on public.siarom_crm_files;
drop policy if exists "files_all"    on public.siarom_crm_files;
create policy "files_select" on public.siarom_crm_files
  for select using (public.siarom_crm_files_can_access(owner_type, owner_id));
create policy "files_all" on public.siarom_crm_files
  for all using (public.siarom_crm_files_can_access(owner_type, owner_id))
         with check (public.siarom_crm_files_can_access(owner_type, owner_id));

-- ========================================================
-- 2) STORAGE BUCKET (criação via SQL)
-- ========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'siarom-files',
  'siarom-files',
  false,
  26214400, -- 25 MB
  null      -- aceita qualquer mime
)
on conflict (id) do nothing;

-- Policies do bucket (storage.objects).
-- Como o caminho é {owner_type}/{owner_id}/{categoria}/{filename},
-- conferimos acesso parseando os 2 primeiros segmentos.

drop policy if exists "siarom_files_select" on storage.objects;
drop policy if exists "siarom_files_insert" on storage.objects;
drop policy if exists "siarom_files_delete" on storage.objects;

create policy "siarom_files_select" on storage.objects
  for select using (
    bucket_id = 'siarom-files'
    and public.siarom_crm_files_can_access(
      split_part(name, '/', 1),
      (split_part(name, '/', 2))::uuid
    )
  );

create policy "siarom_files_insert" on storage.objects
  for insert with check (
    bucket_id = 'siarom-files'
    and public.siarom_crm_files_can_access(
      split_part(name, '/', 1),
      (split_part(name, '/', 2))::uuid
    )
  );

create policy "siarom_files_delete" on storage.objects
  for delete using (
    bucket_id = 'siarom-files'
    and public.siarom_crm_files_can_access(
      split_part(name, '/', 1),
      (split_part(name, '/', 2))::uuid
    )
  );
