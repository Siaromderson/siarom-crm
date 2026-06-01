import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { TarefasClient } from "@/components/tarefas/TarefasClient";
import { getCategoriaCores } from "@/lib/actions/settings";
import type { Profile, Project, Task } from "@/types/database";

export default async function Page() {
  const { profile } = await requireSession();
  const supabase = createClient();

  let q = supabase.from("siarom_crm_tasks").select("*").order("created_at", { ascending: false });
  if (profile.role === "user") q = q.eq("assignee_id", profile.id);
  const { data: tasks } = await q;

  const { data: projetos } = await supabase
    .from("siarom_crm_projects")
    .select("id, cliente_nome")
    .order("cliente_nome");

  const { data: usuarios } = await supabase
    .from("siarom_crm_profiles")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  const categoriaCores = await getCategoriaCores();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold title-grad">Tarefas</h1>
        <p className="text-sm text-slate-500">
          {profile.role === "user" ? "Suas tarefas atribuídas" : "Visão geral — todas as tarefas"}
        </p>
      </div>
      <TarefasClient
        initial={(tasks ?? []) as Task[]}
        projetos={(projetos ?? []) as Pick<Project, "id" | "cliente_nome">[]}
        usuarios={(usuarios ?? []) as Pick<Profile, "id" | "nome">[]}
        podeEscolherResponsavel={profile.role === "admin"}
        categoriaCores={categoriaCores}
      />
    </div>
  );
}
