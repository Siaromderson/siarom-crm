import { createClient } from "@/lib/supabase/server";
import { LeadsBoard } from "@/components/leads/LeadsBoard";
import type { Lead } from "@/types/database";

export default async function Page() {
  const supabase = createClient();
  const [{ data: leads }, { data: projs }] = await Promise.all([
    supabase.from("siarom_crm_leads").select("*").order("created_at", { ascending: false }),
    supabase.from("siarom_crm_projects").select("id, cliente_nome, cliente_id").not("cliente_id", "is", null),
  ]);
  const projetosByCliente: Record<string, { id: string; cliente_nome: string }[]> = {};
  for (const p of (projs ?? []) as { id: string; cliente_nome: string; cliente_id: string }[]) {
    (projetosByCliente[p.cliente_id] ||= []).push({ id: p.id, cliente_nome: p.cliente_nome });
  }
  return (
    <div className="space-y-4">
      <LeadsBoard leads={(leads ?? []) as Lead[]} projetosByCliente={projetosByCliente} />
    </div>
  );
}
