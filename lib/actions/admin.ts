"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Role } from "@/types/database";

export async function criarUsuario(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const nome = String(formData.get("nome") || "").trim();
  const role = (formData.get("role") as Role) || "user";

  if (!email || !password || !nome) return { error: "Preencha nome, email e senha." };
  if (password.length < 6) return { error: "Senha precisa de pelo menos 6 caracteres." };

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (error || !data.user) return { error: error?.message ?? "Erro ao criar usuário." };

  const { error: pErr } = await admin.from("siarom_crm_profiles").insert({
    id: data.user.id,
    nome,
    email,
    role,
    ativo: true,
  });
  if (pErr) return { error: pErr.message };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function atualizarUsuario(id: string, formData: FormData) {
  await requireAdmin();
  const admin = supabaseAdmin();
  const patch = {
    nome: String(formData.get("nome") || "").trim(),
    role: (formData.get("role") as Role) || "user",
    ativo: formData.get("ativo") === "on",
  };
  const { error } = await admin.from("siarom_crm_profiles").update(patch).eq("id", id);
  if (error) return { error: error.message };
  await admin.auth.admin.updateUserById(id, { app_metadata: { role: patch.role } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function resetarSenha(id: string, novaSenha: string) {
  await requireAdmin();
  if (novaSenha.length < 6) return { error: "Senha precisa de pelo menos 6 caracteres." };
  const { error } = await supabaseAdmin().auth.admin.updateUserById(id, { password: novaSenha });
  if (error) return { error: error.message };
  return { ok: true };
}
