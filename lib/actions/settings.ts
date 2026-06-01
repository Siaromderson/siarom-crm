"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { AppDefaults, TaskCategoria } from "@/types/database";
import { TASK_CATEGORIAS } from "@/types/database";
import { DEFAULT_CATEGORIA_CORES, TONE_LIST, type Tone } from "@/lib/palette";

export async function getDefaults(): Promise<AppDefaults> {
  const supabase = createClient();
  const { data } = await supabase
    .from("siarom_crm_app_settings")
    .select("valor")
    .eq("chave", "defaults")
    .single();
  const v = (data?.valor as AppDefaults) || { comissao: 20, imposto: 15.5 };
  return v;
}

export async function salvarDefaults(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const valor = {
    comissao: Number(formData.get("comissao") || 20),
    imposto: Number(formData.get("imposto") || 15.5),
  };
  const { error } = await supabase
    .from("siarom_crm_app_settings")
    .upsert({ chave: "defaults", valor });
  if (error) return { error: error.message };
  revalidatePath("/admin/configuracoes");
  revalidatePath("/calculadora");
  return { ok: true };
}

export type CategoriaCores = Record<TaskCategoria, Tone>;

const VALID_TONES = new Set(TONE_LIST.map((t) => t.id));

export async function getCategoriaCores(): Promise<CategoriaCores> {
  const supabase = createClient();
  const { data } = await supabase
    .from("siarom_crm_app_settings")
    .select("valor")
    .eq("chave", "task_categorias_cores")
    .single();
  const saved = (data?.valor ?? {}) as Partial<CategoriaCores>;
  // mescla com os padrões (garante todas as chaves mesmo se faltarem no banco)
  return { ...DEFAULT_CATEGORIA_CORES, ...saved };
}

export async function salvarCategoriaCores(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const valor = {} as CategoriaCores;
  for (const c of TASK_CATEGORIAS) {
    const tone = String(formData.get(`cor_${c.id}`) || "");
    valor[c.id] = (VALID_TONES.has(tone as Tone) ? tone : DEFAULT_CATEGORIA_CORES[c.id]) as Tone;
  }
  const { error } = await supabase
    .from("siarom_crm_app_settings")
    .upsert({ chave: "task_categorias_cores", valor });
  if (error) return { error: error.message };
  revalidatePath("/admin/configuracoes");
  revalidatePath("/tarefas");
  revalidatePath("/agenda");
  return { ok: true };
}
