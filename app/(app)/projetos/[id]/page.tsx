import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjetoForm } from "@/components/projetos/ProjetoForm";
import { getDefaults } from "@/lib/actions/settings";
import type { Project } from "@/types/database";

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("siarom_crm_projects").select("*").eq("id", params.id).single<Project>();
  if (!data) return notFound();
  const defaults = await getDefaults();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar projeto</h1>
      <ProjetoForm defaults={defaults} inicial={data} />
    </div>
  );
}
