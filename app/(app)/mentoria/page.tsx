import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MentoriaPageClient } from "@/components/mentoria/MentoriaPageClient";
import type { Cliente, Mentoria, MentoriaAula } from "@/types/database";

export default async function Page() {
  await requireAdmin();
  const supabase = createClient();
  const [mentRes, aulasRes, mentoradosRes] = await Promise.all([
    supabase.from("siarom_crm_mentorias").select("*").order("created_at", { ascending: false }),
    supabase.from("siarom_crm_mentoria_aulas").select("*").order("data", { ascending: false }),
    supabase.from("siarom_crm_clientes").select("id, nome").eq("tipo", "mentorado").order("nome"),
  ]);

  const aulasPorMentoria: Record<string, MentoriaAula[]> = {};
  for (const a of (aulasRes.data ?? []) as MentoriaAula[]) {
    (aulasPorMentoria[a.mentoria_id] ||= []).push(a);
  }

  return (
    <MentoriaPageClient
      mentorias={(mentRes.data ?? []) as Mentoria[]}
      aulasPorMentoria={aulasPorMentoria}
      mentorados={(mentoradosRes.data ?? []) as Pick<Cliente, "id" | "nome">[]}
    />
  );
}
