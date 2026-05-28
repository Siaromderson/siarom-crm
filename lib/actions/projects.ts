"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import type { KanbanStage } from "@/types/database";

export async function criarProjeto(formData: FormData) {
  const { user } = await requireSession();
  const supabase = createClient();

  const payload = {
    cliente_nome: String(formData.get("cliente_nome") || "").trim() || "(sem nome)",
    cliente_id: (formData.get("cliente_id") as string) || null,
    site_url: String(formData.get("site_url") || "").trim() || null,
    telefone: String(formData.get("telefone") || "").trim() || null,
    descricao_automacao: String(formData.get("descricao_automacao") || "").trim() || null,
    reuniao_em: String(formData.get("reuniao_em") || "").trim() || null,
    testes_iniciado_em: String(formData.get("testes_iniciado_em") || "").trim() || null,
    testes_dias_total: formData.get("testes_dias_total") ? Number(formData.get("testes_dias_total")) : null,
    valor_total: Number(formData.get("valor_total") || 0),
    taxa_comissao: Number(formData.get("taxa_comissao") || 20),
    taxa_imposto: Number(formData.get("taxa_imposto") || 15.5),
    kanban_stage: (formData.get("kanban_stage") as KanbanStage) || "geracao_proposta",
    prazo_entrega: String(formData.get("prazo_entrega") || "").trim() || null,
    owner_id: user.id,
  };

  const { error } = await supabase.from("siarom_crm_projects").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/projetos");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function atualizarProjeto(id: string, formData: FormData) {
  await requireSession();
  const supabase = createClient();

  const patch: Record<string, unknown> = {
    cliente_nome: String(formData.get("cliente_nome") || "").trim(),
    cliente_id: (formData.get("cliente_id") as string) || null,
    site_url: String(formData.get("site_url") || "").trim() || null,
    telefone: String(formData.get("telefone") || "").trim() || null,
    descricao_automacao: String(formData.get("descricao_automacao") || "").trim() || null,
    reuniao_em: String(formData.get("reuniao_em") || "").trim() || null,
    testes_iniciado_em: String(formData.get("testes_iniciado_em") || "").trim() || null,
    testes_dias_total: formData.get("testes_dias_total") ? Number(formData.get("testes_dias_total")) : null,
    valor_total: Number(formData.get("valor_total") || 0),
    taxa_comissao: Number(formData.get("taxa_comissao") || 20),
    taxa_imposto: Number(formData.get("taxa_imposto") || 15.5),
    kanban_stage: formData.get("kanban_stage"),
    prazo_entrega: String(formData.get("prazo_entrega") || "").trim() || null,
  };

  const { error } = await supabase.from("siarom_crm_projects").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/projetos");
  revalidatePath(`/projetos/${id}`);
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function moverEtapa(id: string, stage: KanbanStage) {
  await requireSession();
  const supabase = createClient();
  const closed_at = stage === "pagamento_final" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("siarom_crm_projects")
    .update({ kanban_stage: stage, closed_at })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletarProjeto(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projetos");
  revalidatePath("/kanban");
  return { ok: true };
}
