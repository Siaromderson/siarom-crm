import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlassButton } from "@/components/ui/glass";
import { ProjetosListClient } from "@/components/projetos/ProjetosListClient";
import type { Project } from "@/types/database";

export default async function Page() {
  const supabase = createClient();
  const { data } = await supabase
    .from("siarom_crm_projects")
    .select("*")
    .order("created_at", { ascending: false });
  const projetos = (data ?? []) as Project[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold title-grad">Projetos</h1>
          <p className="text-sm text-slate-500">{projetos.length} projeto(s)</p>
        </div>
        <Link href="/projetos/novo"><GlassButton>+ Novo projeto</GlassButton></Link>
      </div>
      <ProjetosListClient projetos={projetos} />
    </div>
  );
}
