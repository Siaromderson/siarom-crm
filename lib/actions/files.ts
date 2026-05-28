"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth";
import type { FileCategoria, FileOwnerType } from "@/types/database";

const BUCKET = "siarom-files";

/**
 * Upload de arquivo via Server Action.
 * O caminho no Storage é: {ownerType}/{ownerId}/{categoria}/{uuid}-{filename}
 */
export async function uploadArquivo(formData: FormData) {
  const { user } = await requireSession();
  const file = formData.get("file") as File | null;
  const ownerType = formData.get("owner_type") as FileOwnerType;
  const ownerId = String(formData.get("owner_id") || "");
  const categoria = (formData.get("categoria") as FileCategoria) || "outro";

  if (!file || !ownerType || !ownerId) return { error: "Arquivo, tipo ou owner ausentes." };
  if (file.size === 0) return { error: "Arquivo vazio." };
  if (file.size > 25 * 1024 * 1024) return { error: "Arquivo maior que 25 MB." };

  const ext = file.name.split(".").pop() || "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const uniq = crypto.randomUUID();
  const path = `${ownerType}/${ownerId}/${categoria}/${uniq}-${safeName}`;

  const admin = supabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || `application/${ext}`,
    upsert: false,
  });
  if (upErr) return { error: `Upload: ${upErr.message}` };

  const supabase = createClient();
  const { error: insErr } = await supabase.from("siarom_crm_files").insert({
    owner_type: ownerType,
    owner_id: ownerId,
    categoria,
    nome: file.name,
    mime: file.type || null,
    size_bytes: file.size,
    storage_path: path,
    uploaded_by: user.id,
  });
  if (insErr) {
    await admin.storage.from(BUCKET).remove([path]); // rollback do storage
    return { error: insErr.message };
  }

  revalidatePath("/contratos");
  revalidatePath("/nfes");
  revalidatePath("/projetos");
  revalidatePath("/clientes");
  revalidatePath("/tarefas");
  return { ok: true };
}

export async function deletarArquivo(id: string) {
  await requireSession();
  const supabase = createClient();
  const { data: file, error: getErr } = await supabase
    .from("siarom_crm_files")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (getErr || !file) return { error: getErr?.message ?? "Arquivo não encontrado." };

  const admin = supabaseAdmin();
  await admin.storage.from(BUCKET).remove([file.storage_path as string]);
  const { error } = await supabase.from("siarom_crm_files").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/contratos");
  revalidatePath("/nfes");
  revalidatePath("/projetos");
  revalidatePath("/clientes");
  revalidatePath("/tarefas");
  return { ok: true };
}

/**
 * Gera URL assinada (1h) para download.
 */
export async function getDownloadUrl(id: string): Promise<{ url?: string; error?: string }> {
  await requireSession();
  const supabase = createClient();
  const { data: file, error: getErr } = await supabase
    .from("siarom_crm_files")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (getErr || !file) return { error: getErr?.message ?? "Arquivo não encontrado." };

  const admin = supabaseAdmin();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(file.storage_path as string, 3600);
  if (error || !data) return { error: error?.message ?? "Falha ao gerar URL." };
  return { url: data.signedUrl };
}
