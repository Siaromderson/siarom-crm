import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlassButton } from "@/components/ui/glass";
import { ProjetosPageClient } from "@/components/projetos/ProjetosPageClient";
import type { ChecklistKey, Project } from "@/types/database";

export default async function Page() {
  const supabase = createClient();
  const [projsRes, clRes] = await Promise.all([
    supabase.from("siarom_crm_projects").select("*").order("created_at", { ascending: false }),
    supabase.from("siarom_crm_project_checklist").select("project_id, key"),
  ]);
  const projetos = (projsRes.data ?? []) as Project[];
  const checklists: Record<string, ChecklistKey[]> = {};
  for (const row of (clRes.data ?? []) as { project_id: string; key: ChecklistKey }[]) {
    (checklists[row.project_id] ||= []).push(row.key);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold title-grad">Projetos</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">{projetos.length} projeto(s)</p>
        </div>
        <Link href="/projetos/novo"><GlassButton>+ Novo projeto</GlassButton></Link>
      </div>
      <ProjetosPageClient projetos={projetos} checklists={checklists} />
    </div>
  );
}
