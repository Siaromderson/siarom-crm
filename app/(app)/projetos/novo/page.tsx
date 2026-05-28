import { ProjetoForm } from "@/components/projetos/ProjetoForm";
import { getDefaults } from "@/lib/actions/settings";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/types/database";

export default async function Page() {
  const defaults = await getDefaults();
  const supabase = createClient();
  const { data } = await supabase
    .from("siarom_crm_clientes")
    .select("id, nome, telefone, site")
    .order("nome");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold title-grad">Novo projeto</h1>
      <ProjetoForm defaults={defaults} clientes={(data ?? []) as Pick<Cliente, "id" | "nome" | "telefone" | "site">[]} />
    </div>
  );
}
