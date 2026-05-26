"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { AppDefaults } from "@/types/database";

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
