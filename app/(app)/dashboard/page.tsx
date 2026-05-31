import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { AgendaHojeWidget } from "@/components/dashboard/AgendaHojeWidget";
import { getAgendaEventos } from "@/lib/agenda";
import { eventosDeHoje } from "@/lib/agenda-types";
import type { Cliente, Lead, Project } from "@/types/database";

export default async function Page() {
  const profile = await requireAdmin();
  const supabase = createClient();
  const [projsRes, clientesRes, leadsRes, eventos] = await Promise.all([
    supabase.from("siarom_crm_projects").select("*").order("created_at", { ascending: false }),
    supabase.from("siarom_crm_clientes").select("id, nome, proximo_followup_em").not("proximo_followup_em", "is", null),
    supabase.from("siarom_crm_leads").select("id, nome, proximo_followup_em").not("proximo_followup_em", "is", null),
    getAgendaEventos({ roleAdmin: profile.role === "admin", userId: profile.id }),
  ]);

  const hoje = eventosDeHoje(eventos);

  return (
    <div className="space-y-6">
      <AgendaHojeWidget eventos={hoje} />
      <DashboardClient
        projetos={(projsRes.data ?? []) as Project[]}
        clientesFollowup={(clientesRes.data ?? []) as Pick<Cliente, "id" | "nome" | "proximo_followup_em">[]}
        leadsFollowup={(leadsRes.data ?? []) as Pick<Lead, "id" | "nome" | "proximo_followup_em">[]}
      />
    </div>
  );
}
