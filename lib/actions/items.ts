"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import type { ItemTipo } from "@/types/database";

export async function criarItem(projectId: string, formData: FormData) {
  await requireSession();
  const supabase = createClient();
  const payload = {
    project_id: projectId,
    tipo: (formData.get("tipo") as ItemTipo) || "anotacao",
    titulo: String(formData.get("titulo") || "").trim(),
    conteudo: String(formData.get("conteudo") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    senha: String(formData.get("senha") || "").trim() || null,
    link:  String(formData.get("link")  || "").trim() || null,
  };
  if (!payload.titulo) return { error: "Título é obrigatório." };
  const { error } = await supabase.from("siarom_crm_project_items").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/projetos");
  return { ok: true };
}

export async function deletarItem(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_project_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projetos");
  return { ok: true };
}
