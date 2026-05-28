"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import type { KanbanStage } from "@/types/database";

export async function criarLead(formData: FormData) {
  const { user } = await requireSession();
  const supabase = createClient();
  const payload = {
    nome: String(formData.get("nome") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    telefone: String(formData.get("telefone") || "").trim() || null,
    site: String(formData.get("site") || "").trim() || null,
    descricao: String(formData.get("descricao") || "").trim() || null,
    valor_estimado: Number(formData.get("valor_estimado") || 0),
    kanban_stage: (formData.get("kanban_stage") as KanbanStage) || "reuniao_agendada",
    reuniao_em: String(formData.get("reuniao_em") || "").trim() || null,
    origem: String(formData.get("origem") || "").trim() || null,
    observacoes: String(formData.get("observacoes") || "").trim() || null,
    proximo_followup_em: String(formData.get("proximo_followup_em") || "").trim() || null,
    owner_id: user.id,
  };
  if (!payload.nome) return { error: "Nome obrigatório." };
  const { data, error } = await supabase.from("siarom_crm_leads").insert(payload).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true, id: data.id as string };
}

export async function atualizarLead(id: string, formData: FormData) {
  await requireSession();
  const supabase = createClient();
  const patch = {
    nome: String(formData.get("nome") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    telefone: String(formData.get("telefone") || "").trim() || null,
    site: String(formData.get("site") || "").trim() || null,
    descricao: String(formData.get("descricao") || "").trim() || null,
    valor_estimado: Number(formData.get("valor_estimado") || 0),
    kanban_stage: formData.get("kanban_stage"),
    reuniao_em: String(formData.get("reuniao_em") || "").trim() || null,
    origem: String(formData.get("origem") || "").trim() || null,
    observacoes: String(formData.get("observacoes") || "").trim() || null,
    proximo_followup_em: String(formData.get("proximo_followup_em") || "").trim() || null,
  };
  const { error } = await supabase.from("siarom_crm_leads").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

export async function marcarFollowupLeadFeito(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase
    .from("siarom_crm_leads")
    .update({ ultima_interacao_em: new Date().toISOString(), proximo_followup_em: null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function moverEtapaLead(id: string, stage: KanbanStage) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_leads").update({ kanban_stage: stage }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

export async function deletarLead(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_leads").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

/**
 * Converte um lead em cliente + cria projeto vinculado.
 * Reusa cliente existente se já houver vínculo (lead.cliente_id).
 */
export async function converterLeadEmCliente(leadId: string) {
  const { user } = await requireSession();
  const supabase = createClient();

  const { data: lead, error: lErr } = await supabase
    .from("siarom_crm_leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (lErr || !lead) return { error: lErr?.message ?? "Lead não encontrado." };

  let clienteId = lead.cliente_id as string | null;
  if (!clienteId) {
    const { data: cliente, error: cErr } = await supabase
      .from("siarom_crm_clientes")
      .insert({
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        site: lead.site,
        owner_id: user.id,
      })
      .select("id")
      .single();
    if (cErr || !cliente) return { error: cErr?.message ?? "Falha ao criar cliente." };
    clienteId = cliente.id as string;
  }

  const { data: projeto, error: pErr } = await supabase
    .from("siarom_crm_projects")
    .insert({
      cliente_nome: lead.nome,
      cliente_id: clienteId,
      site_url: lead.site,
      telefone: lead.telefone,
      descricao_automacao: lead.descricao,
      reuniao_em: lead.reuniao_em,
      valor_total: lead.valor_estimado || 0,
      taxa_comissao: 20,
      taxa_imposto: 15.5,
      kanban_stage: "implementacao",
      owner_id: user.id,
    })
    .select("id")
    .single();
  if (pErr || !projeto) return { error: pErr?.message ?? "Falha ao criar projeto." };

  await supabase
    .from("siarom_crm_leads")
    .update({ cliente_id: clienteId, convertido_em: new Date().toISOString() })
    .eq("id", leadId);

  revalidatePath("/leads");
  revalidatePath("/clientes");
  revalidatePath("/projetos");
  revalidatePath("/kanban");
  return { ok: true, clienteId, projetoId: projeto.id as string };
}
