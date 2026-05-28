-- ========================================================
-- MIGRATION 012 — Usuário cria suas tarefas + arquivos em tarefas
-- ========================================================

-- ----- Tasks: permite usuário inserir tarefas pra si mesmo -----
drop policy if exists "tasks_user_insert" on public.siarom_crm_tasks;
create policy "tasks_user_insert" on public.siarom_crm_tasks
  for insert with check (assignee_id = auth.uid());

drop policy if exists "tasks_user_delete" on public.siarom_crm_tasks;
create policy "tasks_user_delete" on public.siarom_crm_tasks
  for delete using (assignee_id = auth.uid());

-- ----- Files: permite owner_type = 'tarefa' -----
alter table public.siarom_crm_files
  drop constraint if exists siarom_crm_files_owner_type_check;

alter table public.siarom_crm_files
  add constraint siarom_crm_files_owner_type_check
  check (owner_type in ('projeto','cliente','tarefa'));

-- Função de acesso: tarefa visível pro responsável ou admin
create or replace function public.siarom_crm_files_can_access(p_owner_type text, p_owner_id uuid)
returns boolean language sql stable security definer as $$
  select
    public.siarom_crm_is_admin()
    or (p_owner_type = 'projeto' and exists (
      select 1 from public.siarom_crm_projects p where p.id = p_owner_id and p.owner_id = auth.uid()
    ))
    or (p_owner_type = 'cliente' and exists (
      select 1 from public.siarom_crm_clientes c where c.id = p_owner_id and c.owner_id = auth.uid()
    ))
    or (p_owner_type = 'tarefa' and exists (
      select 1 from public.siarom_crm_tasks t where t.id = p_owner_id and t.assignee_id = auth.uid()
    ));
$$;

notify pgrst, 'reload schema';
