-- MIGRATION 005: campos estruturados em credenciais (email, senha, link)
alter table public.siarom_crm_project_items
  add column if not exists email text,
  add column if not exists senha text,
  add column if not exists link  text;
