-- ========================================================
-- MIGRATION 009 — Categoria "proposta" nos arquivos
-- ========================================================

alter table public.siarom_crm_files
  drop constraint if exists siarom_crm_files_categoria_check;

alter table public.siarom_crm_files
  add constraint siarom_crm_files_categoria_check
  check (categoria in ('contrato','nfe','proposta','outro'));

notify pgrst, 'reload schema';
