import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { HojeWidget } from "@/components/dashboard/HojeWidget";
import { getTarefasDoDia } from "@/lib/followups";
import type { Cliente, Lead, Project } from "@/types/database";

export default async function Page() {
  await requireAdmin();
  const supabase = createClient();
  const [projsRes, clientesRes, leadsRes, hoje] = await Promise.all([
    supabase.from("siarom_crm_projects").select("*").order("created_at", { ascending: false }),
    supabase.from("siarom_crm_clientes").select("id, nome, proximo_followup_em").not("proximo_followup_em", "is", null),
    supabase.from("siarom_crm_leads").select("id, nome, proximo_followup_em").not("proximo_followup_em", "is", null),
    getTarefasDoDia(),
  ]);

  return (
    <div className="space-y-6">
      <HojeWidget itens={hoje} />
      <DashboardClient
        projetos={(projsRes.data ?? []) as Project[]}
        clientesFollowup={(clientesRes.data ?? []) as Pick<Cliente, "id" | "nome" | "proximo_followup_em">[]}
        leadsFollowup={(leadsRes.data ?? []) as Pick<Lead, "id" | "nome" | "proximo_followup_em">[]}
      />
    </div>
  );
}
