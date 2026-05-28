import { createClient } from "@/lib/supabase/server";
import { ArquivosList } from "@/components/arquivos/ArquivosList";
import { GlassCard } from "@/components/ui/glass";
import type { ProjectFile } from "@/types/database";

export default async function Page() {
  const supabase = createClient();
  const { data } = await supabase
    .from("siarom_crm_files")
    .select("*")
    .eq("categoria", "contrato")
    .order("created_at", { ascending: false });
  const arquivos = (data ?? []) as ProjectFile[];

  // Busca projetos + clientes referenciados pra montar labels
  const projIds = Array.from(new Set(arquivos.filter((f) => f.owner_type === "projeto").map((f) => f.owner_id)));
  const cliIds  = Array.from(new Set(arquivos.filter((f) => f.owner_type === "cliente").map((f) => f.owner_id)));

  const [{ data: projs }, { data: clis }] = await Promise.all([
    projIds.length ? supabase.from("siarom_crm_projects").select("id, cliente_nome, cliente_id").in("id", projIds) : Promise.resolve({ data: [] as any[] }),
    cliIds.length  ? supabase.from("siarom_crm_clientes").select("id, nome").in("id", cliIds) : Promise.resolve({ data: [] as any[] }),
  ]);

  // Map adicional pra resolver cliente do projeto
  const projClienteIds = (projs ?? []).map((p) => p.cliente_id).filter(Boolean) as string[];
  const { data: clisProj } = projClienteIds.length
    ? await supabase.from("siarom_crm_clientes").select("id, nome").in("id", projClienteIds)
    : { data: [] as any[] };
  const cliNomeById = Object.fromEntries([...(clis ?? []), ...(clisProj ?? [])].map((c) => [c.id, c.nome]));

  const ownerLabels: Record<string, { projeto?: string; cliente?: string }> = {};
  for (const p of (projs ?? [])) {
    ownerLabels[`projeto:${p.id}`] = {
      projeto: p.cliente_nome,
      cliente: p.cliente_id ? cliNomeById[p.cliente_id] : undefined,
    };
  }
  for (const c of (clis ?? [])) {
    ownerLabels[`cliente:${c.id}`] = { cliente: c.nome };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold title-grad">Contratos</h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400">{arquivos.length} contrato(s) arquivado(s)</p>
      </div>
      <GlassCard>
        <ArquivosList arquivos={arquivos} ownerLabels={ownerLabels} />
      </GlassCard>
      <div className="text-xs text-slate-400">Para anexar um novo contrato, abra o cliente ou projeto correspondente e use a aba <b>Arquivos</b>.</div>
    </div>
  );
}
