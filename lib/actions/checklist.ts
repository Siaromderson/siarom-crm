"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import type { ChecklistKey } from "@/types/database";

export async function marcarChecklist(projectId: string, key: ChecklistKey) {
  const { user } = await requireSession();
  const supabase = createClient();
  const { error } = await supabase
    .from("siarom_crm_project_checklist")
    .upsert({ project_id: projectId, key, done: true, done_at: new Date().toISOString(), done_by: user.id });
  if (error) return { error: error.message };
  revalidatePath("/projetos");
  revalidatePath("/kanban");
  return { ok: true };
}

export async function desmarcarChecklist(projectId: string, key: ChecklistKey) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase
    .from("siarom_crm_project_checklist")
    .delete()
    .eq("project_id", projectId)
    .eq("key", key);
  if (error) return { error: error.message };
  revalidatePath("/projetos");
  revalidatePath("/kanban");
  return { ok: true };
}
