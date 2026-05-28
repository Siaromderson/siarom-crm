"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

export async function criarCliente(formData: FormData) {
  const { user } = await requireSession();
  const supabase = createClient();
  const tipoRaw = String(formData.get("tipo") || "").trim();
  const payload = {
    nome: String(formData.get("nome") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    telefone: String(formData.get("telefone") || "").trim() || null,
    site: String(formData.get("site") || "").trim() || null,
    observacoes: String(formData.get("observacoes") || "").trim() || null,
    tipo: tipoRaw === "mentorado" ? "mentorado" : "siaromai",
    proximo_followup_em: String(formData.get("proximo_followup_em") || "").trim() || null,
    owner_id: user.id,
  };
  if (!payload.nome) return { error: "Nome obrigatório." };
  const { data, error } = await supabase.from("siarom_crm_clientes").insert(payload).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { ok: true, id: data.id as string };
}

export async function atualizarCliente(id: string, formData: FormData) {
  await requireSession();
  const supabase = createClient();
  const patch = {
    nome: String(formData.get("nome") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    telefone: String(formData.get("telefone") || "").trim() || null,
    site: String(formData.get("site") || "").trim() || null,
    observacoes: String(formData.get("observacoes") || "").trim() || null,
    proximo_followup_em: String(formData.get("proximo_followup_em") || "").trim() || null,
  };
  const { error } = await supabase.from("siarom_crm_clientes").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function marcarFollowupFeito(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase
    .from("siarom_crm_clientes")
    .update({ ultima_interacao_em: new Date().toISOString(), proximo_followup_em: null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletarCliente(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_clientes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { ok: true };
}
