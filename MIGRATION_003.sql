-- MIGRATION 003: site e telefone do cliente nos projetos.
-- Rode no SQL Editor do Supabase.

alter table public.siarom_crm_projects
  add column if not exists site_url text,
  add column if not exists telefone text;
