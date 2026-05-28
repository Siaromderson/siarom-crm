"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

export async function criarMentoria(formData: FormData) {
  const { user } = await requireSession();
  const supabase = createClient();
  const payload = {
    mentorado_id: (formData.get("mentorado_id") as string) || null,
    mentorado_nome: String(formData.get("mentorado_nome") || "").trim(),
    plano: String(formData.get("plano") || "").trim() || null,
    valor_total: Number(formData.get("valor_total") || 0),
    taxa_imposto: Number(formData.get("taxa_imposto") || 0),
    horas_contratadas: Number(formData.get("horas_contratadas") || 0),
    observacoes: String(formData.get("observacoes") || "").trim() || null,
    owner_id: user.id,
  };
  if (!payload.mentorado_nome) return { error: "Nome do mentorado obrigatório." };
  const { error } = await supabase.from("siarom_crm_mentorias").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/mentoria");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function atualizarMentoria(id: string, formData: FormData) {
  await requireSession();
  const supabase = createClient();
  const patch = {
    mentorado_id: (formData.get("mentorado_id") as string) || null,
    mentorado_nome: String(formData.get("mentorado_nome") || "").trim(),
    plano: String(formData.get("plano") || "").trim() || null,
    valor_total: Number(formData.get("valor_total") || 0),
    taxa_imposto: Number(formData.get("taxa_imposto") || 0),
    horas_contratadas: Number(formData.get("horas_contratadas") || 0),
    observacoes: String(formData.get("observacoes") || "").trim() || null,
  };
  if (!patch.mentorado_nome) return { error: "Nome do mentorado obrigatório." };
  const { error } = await supabase.from("siarom_crm_mentorias").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mentoria");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletarMentoria(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_mentorias").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mentoria");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function registrarAula(mentoriaId: string, formData: FormData) {
  await requireSession();
  const supabase = createClient();
  const payload = {
    mentoria_id: mentoriaId,
    data: (formData.get("data") as string) || new Date().toISOString().slice(0, 10),
    duracao_horas: Number(formData.get("duracao_horas") || 0),
    descricao: String(formData.get("descricao") || "").trim() || null,
  };
  if (payload.duracao_horas <= 0) return { error: "Duração deve ser maior que zero." };
  const { error } = await supabase.from("siarom_crm_mentoria_aulas").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/mentoria");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletarAula(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_mentoria_aulas").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mentoria");
  revalidatePath("/dashboard");
  return { ok: true };
}
