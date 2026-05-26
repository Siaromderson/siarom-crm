-- Fix da recursão infinita entre policies de projects <-> tasks.
-- Rode TUDO no SQL Editor do Supabase.

-- ---------- projects ----------
drop policy if exists "projects_select" on public.siarom_crm_projects;
drop policy if exists "projects_insert" on public.siarom_crm_projects;
drop policy if exists "projects_update" on public.siarom_crm_projects;
drop policy if exists "projects_delete" on public.siarom_crm_projects;

create policy "projects_select" on public.siarom_crm_projects
  for select using (
    public.siarom_crm_is_admin() or owner_id = auth.uid()
  );

create policy "projects_insert" on public.siarom_crm_projects
  for insert with check (
    public.siarom_crm_is_admin() or owner_id = auth.uid()
  );

create policy "projects_update" on public.siarom_crm_projects
  for update using (public.siarom_crm_is_admin() or owner_id = auth.uid())
              with check (public.siarom_crm_is_admin() or owner_id = auth.uid());

create policy "projects_delete" on public.siarom_crm_projects
  for delete using (public.siarom_crm_is_admin());

-- ---------- tasks ----------
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
