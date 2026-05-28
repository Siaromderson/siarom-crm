-- ========================================================
-- MIGRATION 008 — Kickoff + contagem regressiva da fase de testes
-- ========================================================

-- Atualiza CHECK do kanban_stage pra incluir 'kickoff'
alter table public.siarom_crm_projects
  drop constraint if exists siarom_crm_projects_kanban_stage_check;

alter table public.siarom_crm_projects
  add constraint siarom_crm_projects_kanban_stage_check
  check (kanban_stage in (
    -- legado (mantém pra não quebrar dados antigos)
    'reuniao_agendada',
    -- funil único dos projetos
    'geracao_proposta','proposta_enviada','geracao_contrato',
    'contrato_assinado','pagamento_entrada','kickoff',
    'implementacao','finalizado','fase_testes',
    'aguardando_pagamento_final','pagamento_final',
    -- descartes (continuam aceitos)
    'no_show','desqualificado','perdido'
  ));

-- Campos pra fase de testes
alter table public.siarom_crm_projects
  add column if not exists testes_iniciado_em date,
  add column if not exists testes_dias_total  int;

notify pgrst, 'reload schema';
