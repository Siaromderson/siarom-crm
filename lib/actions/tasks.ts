"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import type { TaskStatus } from "@/types/database";

export async function criarTarefa(formData: FormData) {
  await requireSession();
  const supabase = createClient();
  const payload = {
    titulo: String(formData.get("titulo") || "").trim(),
    descricao: String(formData.get("descricao") || "").trim() || null,
    project_id: (formData.get("project_id") as string) || null,
    assignee_id: (formData.get("assignee_id") as string) || null,
    prioridade: (formData.get("prioridade") as string) || "media",
    status: (formData.get("status") as TaskStatus) || "a_fazer",
    due_date: (formData.get("due_date") as string) || null,
  };
  if (!payload.titulo) return { error: "Título obrigatório." };
  const { error } = await supabase.from("siarom_crm_tasks").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/tarefas");
  return { ok: true };
}

export async function atualizarStatusTarefa(id: string, status: TaskStatus) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_tasks").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tarefas");
  return { ok: true };
}

export async function deletarTarefa(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tarefas");
  return { ok: true };
}
