import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { Project } from "@/types/database";

export default async function Page() {
  const supabase = createClient();
  const { data } = await supabase.from("siarom_crm_projects").select("*").order("created_at", { ascending: false });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold title-grad">Kanban de projetos</h1>
        <p className="text-sm text-slate-500">Arraste os cards para mudar de etapa.</p>
      </div>
      <KanbanBoard projetos={(data ?? []) as Project[]} />
    </div>
  );
}
