-- ========================================================
-- MIGRATION 010 — Follow-up em leads
-- ========================================================

alter table public.siarom_crm_leads
  add column if not exists proximo_followup_em timestamptz,
  add column if not exists ultima_interacao_em timestamptz;

create index if not exists idx_siarom_crm_leads_followup
  on public.siarom_crm_leads(proximo_followup_em);

notify pgrst, 'reload schema';
